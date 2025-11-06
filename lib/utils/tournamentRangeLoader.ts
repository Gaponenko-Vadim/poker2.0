// Импортируем JSON напрямую
import tournamentRangesData from "@/lib/constants/tournamentRanges.json";
import {
  TablePosition,
  PlayerStrength,
  StackSize,
  PlayerPlayStyle,
  TournamentStage,
  TournamentCategory
} from "@/lib/redux/slices/tableSlice";

// Тип категории стека из JSON
type JsonStackCategory = "very_short" | "short" | "medium" | "big";

// Маппинг нашего типа StackSize на категории из JSON
const stackSizeToJsonCategory = (stackSize: StackSize): JsonStackCategory => {
  const mapping: Record<StackSize, JsonStackCategory> = {
    "very-small": "very_short",
    "small": "short",
    "medium": "medium",
    "big": "big",
  };
  return mapping[stackSize];
};

// Тип действия из JSON
export type TournamentActionType =
  | "open_raise"
  | "push_range"
  | "call_vs_shove"
  | "defense_vs_open"
  | "3bet"
  | "defense_vs_3bet"
  | "4bet"
  | "defense_vs_4bet"
  | "5bet"
  | "defense_vs_5bet";

/**
 * Конвертирует PokerAction в TournamentActionType
 */
export function convertPokerActionToTournamentAction(
  action: "open" | "threeBet" | "fourBet" | "fiveBet" | "allIn"
): TournamentActionType {
  const actionMap: Record<string, TournamentActionType> = {
    "open": "open_raise",
    "threeBet": "3bet",
    "fourBet": "4bet",
    "fiveBet": "5bet",
    "allIn": "push_range",
  };
  return actionMap[action];
}

/**
 * Проверяет, совпадают ли текущие настройки турнира с поддерживаемыми настройками
 * Текущая версия поддерживает только PKO турниры с стеком 200 BB на ранней стадии
 */
export function shouldUseTournamentRanges(
  startingStack: number,
  stage: TournamentStage,
  category: TournamentCategory,
  bounty: boolean
): boolean {
  // Поддерживаем только PKO турниры с 200 BB на ранней стадии
  return (
    startingStack === 200 &&
    stage === "early" &&
    category === "micro" &&
    bounty === true
  );
}

/**
 * Конвертировать строку диапазона из JSON в массив рук
 * @param rangeString - Строка диапазона из JSON (например, "AA, KK, AKs")
 * @returns Массив рук
 */
export function parseRangeString(rangeString: string): string[] {
  if (!rangeString || rangeString.trim() === "" || rangeString === "NEVER") {
    return [];
  }

  // Разбиваем по запятым и убираем пробелы
  return rangeString
    .split(",")
    .map((hand) => hand.trim())
    .filter((hand) => hand.length > 0);
}

/**
 * Генерирует полный диапазон со всеми 169 покерными комбинациями
 * Используется когда у игрока нет действия (action = null)
 * @returns Массив всех 169 рук
 */
export function generateFullRange(): string[] {
  const ranks = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
  const allHands: string[] = [];

  for (let i = 0; i < ranks.length; i++) {
    for (let j = 0; j < ranks.length; j++) {
      if (i === j) {
        // Карманные пары (диагональ)
        allHands.push(`${ranks[i]}${ranks[j]}`);
      } else if (i < j) {
        // Одномастные (выше диагонали)
        allHands.push(`${ranks[i]}${ranks[j]}s`);
      } else {
        // Разномастные (ниже диагонали)
        allHands.push(`${ranks[j]}${ranks[i]}o`);
      }
    }
  }

  return allHands;
}

/**
 * Получить диапазон напрямую из tournamentRanges.json
 * @param position - Позиция игрока
 * @param strength - Сила игрока (fish/amateur/regular)
 * @param playStyle - Стиль игры (tight/balanced/aggressor)
 * @param stackSize - Размер стека
 * @param action - Тип действия
 * @returns Массив рук
 */
export function getTournamentRangeFromJSON(
  position: TablePosition,
  strength: PlayerStrength,
  playStyle: PlayerPlayStyle,
  stackSize: StackSize,
  action: TournamentActionType
): string[] {
  try {
    // Получаем данные из JSON
    const ranges = tournamentRangesData.ranges;

    // Навигация по структуре JSON
    const positionData = ranges?.user?.positions?.[position];
    if (!positionData) return [];

    const strengthData = positionData[strength];
    if (!strengthData) return [];

    const playStyleData = strengthData[playStyle];
    if (!playStyleData) return [];

    const stackCategory = stackSizeToJsonCategory(stackSize);
    const stackData = playStyleData.ranges_by_stack?.[stackCategory];
    if (!stackData) return [];

    // Получаем строку диапазона по типу действия
    const rangeString = (stackData as Record<string, string>)[action] || "";

    return parseRangeString(rangeString);
  } catch (error) {
    console.error("Ошибка при загрузке диапазона из JSON:", error);
    return [];
  }
}

/**
 * Получает диапазон с учетом настроек турнира
 * Если настройки совпадают с tournamentRanges.json, использует диапазоны оттуда
 * Иначе возвращает пустой массив
 *
 * @param position - Позиция игрока
 * @param strength - Сила игрока
 * @param playStyle - Стиль игры
 * @param stackSize - Размер стека
 * @param action - Действие (в формате PokerAction)
 * @param startingStack - Начальный стек турнира в BB
 * @param stage - Стадия турнира
 * @param category - Категория турнира
 * @param bounty - Наличие баунти
 * @returns Массив диапазона или пустой массив
 */
export function getRangeForTournament(
  position: TablePosition,
  strength: PlayerStrength,
  playStyle: PlayerPlayStyle,
  stackSize: StackSize,
  action: "open" | "threeBet" | "fourBet" | "fiveBet" | "allIn",
  startingStack: number,
  stage: TournamentStage,
  category: TournamentCategory,
  bounty: boolean
): string[] {
  // Проверяем, совпадают ли настройки
  if (!shouldUseTournamentRanges(startingStack, stage, category, bounty)) {
    return []; // Настройки не совпадают - возвращаем пустой массив
  }

  // Конвертируем action в формат JSON
  const tournamentAction = convertPokerActionToTournamentAction(action);

  // Получаем диапазон напрямую из JSON
  return getTournamentRangeFromJSON(position, strength, playStyle, stackSize, tournamentAction);
}
