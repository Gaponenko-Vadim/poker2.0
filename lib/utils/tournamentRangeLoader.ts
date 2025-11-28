// Импортируем все JSON файлы с диапазонами
import tournamentRangesMicro200 from "@/lib/constants/tournamentRanges_micro_200bb.json";
import tournamentRangesMicro100 from "@/lib/constants/tournamentRanges_micro_100bb.json";
import tournamentRangesLow100 from "@/lib/constants/tournamentRanges_low_100bb.json";
import tournamentRangesMid100 from "@/lib/constants/tournamentRanges_mid_100bb.json";
import {
  TablePosition,
  PlayerStrength,
  StackSize,
  PlayerPlayStyle,
  TournamentStage,
  TournamentCategory,
  RangeSetData
} from "@/lib/redux/slices/tableSlice";

// Тип для данных диапазонов
type RangeData = typeof tournamentRangesMicro200;

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
 * Возвращает доступные значения начального стека для данной категории турнира
 * @param category - Категория турнира
 * @param bounty - Наличие баунти
 * @returns Массив доступных значений начального стека
 */
export function getAvailableStartingStacks(category: TournamentCategory, bounty: boolean): number[] {
  // Только для PKO турниров (bounty = true)
  if (!bounty) {
    return [];
  }

  // Определяем доступные стеки для каждой категории
  switch (category) {
    case "micro":
      return [100, 200]; // Для micro доступны оба варианта
    case "low":
      return [100]; // Для low только 100 BB
    case "mid":
      return [100]; // Для mid только 100 BB
    case "high":
      return []; // Для high пока нет диапазонов
    default:
      return [];
  }
}

/**
 * Выбирает правильный JSON файл с диапазонами на основе категории и начального стека
 */
function getRangeDataFile(category: TournamentCategory, startingStack: number, bounty: boolean): RangeData | null {
  // Для PKO турниров (bounty = true)
  if (bounty) {
    if (category === "micro" && startingStack === 200) {
      return tournamentRangesMicro200;
    }
    if (category === "micro" && startingStack === 100) {
      return tournamentRangesMicro100 as unknown as RangeData;
    }
    if (category === "low" && startingStack === 100) {
      return tournamentRangesLow100 as unknown as RangeData;
    }
    if (category === "mid" && startingStack === 100) {
      return tournamentRangesMid100 as unknown as RangeData;
    }
  }

  return null;
}

/**
 * Проверяет, совпадают ли текущие настройки турнира с поддерживаемыми настройками
 * Поддерживает PKO турниры с различными категориями и начальными стеками
 */
export function shouldUseTournamentRanges(
  startingStack: number,
  stage: TournamentStage,
  category: TournamentCategory,
  bounty: boolean
): boolean {
  const supportedStages: TournamentStage[] = ["early", "middle", "pre-bubble", "late", "pre-final", "final"];

  // Проверяем, что стадия поддерживается
  if (!supportedStages.includes(stage)) {
    return false;
  }

  // Проверяем, что это PKO турнир
  if (!bounty) {
    return false;
  }

  // Проверяем доступность файла для данной комбинации
  const rangeFile = getRangeDataFile(category, startingStack, bounty);
  return rangeFile !== null;
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
 * Получить диапазон напрямую из соответствующего JSON файла
 * @param stage - Стадия турнира
 * @param position - Позиция игрока
 * @param strength - Сила игрока (fish/amateur/regular)
 * @param playStyle - Стиль игры (tight/balanced/aggressor)
 * @param stackSize - Размер стека
 * @param action - Тип действия
 * @param category - Категория турнира
 * @param startingStack - Начальный стек
 * @param bounty - Наличие баунти
 * @returns Массив рук
 */
export function getTournamentRangeFromJSON(
  stage: TournamentStage,
  position: TablePosition,
  strength: PlayerStrength,
  playStyle: PlayerPlayStyle,
  stackSize: StackSize,
  action: TournamentActionType,
  category: TournamentCategory,
  startingStack: number,
  bounty: boolean
): string[] {
  try {
    // Выбираем правильный файл данных
    const rangeData = getRangeDataFile(category, startingStack, bounty);
    if (!rangeData) {
      return [];
    }

    // Получаем данные из выбранного JSON
    const ranges = rangeData.ranges;

    // Навигация по структуре JSON с учетом стадии турнира
    const stageData = ranges?.user?.stages?.[stage];
    if (!stageData) return [];

    const positionData = stageData?.positions?.[position];
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
 * Получает диапазон из переданных данных (для пользовательских наборов из БД)
 * @param stage - Стадия турнира
 * @param position - Позиция игрока
 * @param strength - Сила игрока
 * @param playStyle - Стиль игры
 * @param stackSize - Размер стека
 * @param action - Тип действия
 * @param rangeData - JSON данные диапазонов
 * @returns Массив рук
 */
export function getRangeFromData(
  stage: TournamentStage,
  position: TablePosition,
  strength: PlayerStrength,
  playStyle: PlayerPlayStyle,
  stackSize: StackSize,
  action: TournamentActionType,
  rangeData: RangeSetData
): string[] {
  try {
    // Получаем данные из переданного JSON
    const ranges = (rangeData as Record<string, unknown>).ranges as Record<string, unknown> | undefined;
    const userData = ranges?.["user"] as Record<string, unknown> | undefined;

    if (!userData) {
      console.log("No user data in custom ranges");
      return [];
    }

    // Проверяем, есть ли структура со стадиями (новый формат)
    const hasStages = userData["stages"] !== undefined;

    let positionData: Record<string, unknown> | undefined;

    if (hasStages) {
      // Новый формат: ranges.user.stages[stage].positions[position]
      const stages = userData["stages"] as Record<string, unknown> | undefined;
      const stageData = stages?.[stage] as Record<string, unknown> | undefined;
      if (!stageData) {
        console.log(`No data for stage: ${stage}`);
        return [];
      }

      const positions = stageData["positions"] as Record<string, unknown> | undefined;
      positionData = positions?.[position] as Record<string, unknown> | undefined;
    } else {
      // Старый формат (обратная совместимость): ranges.user.positions[position]
      const positions = userData["positions"] as Record<string, unknown> | undefined;
      positionData = positions?.[position] as Record<string, unknown> | undefined;
      console.log(`Using legacy format (no stages) for position: ${position}`);
    }

    if (!positionData) {
      console.log(`No data for position: ${position}`);
      return [];
    }

    const strengthData = positionData[strength] as Record<string, unknown> | undefined;
    if (!strengthData) {
      console.log(`No data for strength: ${strength}`);
      return [];
    }

    const playStyleData = strengthData[playStyle] as Record<string, unknown> | undefined;
    if (!playStyleData) {
      console.log(`No data for playStyle: ${playStyle}`);
      return [];
    }

    const stackCategory = stackSizeToJsonCategory(stackSize);
    const rangesByStack = playStyleData["ranges_by_stack"] as Record<string, unknown> | undefined;
    const stackData = rangesByStack?.[stackCategory] as Record<string, unknown> | undefined;
    if (!stackData) {
      console.log(`No data for stackCategory: ${stackCategory}`);
      return [];
    }

    // Получаем строку диапазона по типу действия
    const rangeString = (stackData as Record<string, string>)[action] || "";

    if (!rangeString) {
      console.log(`No range for action: ${action}`);
      return [];
    }

    return parseRangeString(rangeString);
  } catch (error) {
    console.error("Ошибка при загрузке диапазона из данных:", error);
    return [];
  }
}

/**
 * Получает диапазон с учетом настроек турнира
 * Если настройки совпадают с доступными JSON файлами, использует диапазоны оттуда
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

  // Получаем диапазон напрямую из соответствующего JSON с учетом всех параметров
  return getTournamentRangeFromJSON(
    stage,
    position,
    strength,
    playStyle,
    stackSize,
    tournamentAction,
    category,
    startingStack,
    bounty
  );
}
