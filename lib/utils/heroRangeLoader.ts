// Импортируем JSON файлы с диапазонами Hero
import heroRangesMicro100 from "@/lib/constants/heroRanges/heroRanges_micro_100bb.json";
import heroRangesMicro200 from "@/lib/constants/heroRanges/heroRanges_micro_200bb.json";
import heroRangesLow100 from "@/lib/constants/heroRanges/heroRanges_low_100bb.json";
import {
  TablePosition,
  StackSize,
  PlayerPlayStyle,
  TournamentStage,
  TournamentCategory,
  RangeSetData
} from "@/lib/redux/slices/tableSlice";
import { TournamentActionType, parseRangeString } from "./tournamentRangeLoader";

// Тип для данных диапазонов Hero
type HeroRangeData = typeof heroRangesMicro100;

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

/**
 * Выбирает правильный JSON файл с диапазонами Hero на основе категории и начального стека
 */
function getHeroRangeDataFile(
  category: TournamentCategory,
  startingStack: number,
  bounty: boolean
): HeroRangeData | null {
  // Для PKO турниров (bounty = true)
  if (bounty) {
    if (category === "micro" && startingStack === 200) {
      return heroRangesMicro200;
    }
    if (category === "micro" && startingStack === 100) {
      return heroRangesMicro100;
    }
    if (category === "low" && startingStack === 100) {
      return heroRangesLow100;
    }
  }

  return null;
}

/**
 * Получить диапазон Hero напрямую из соответствующего JSON файла
 * ВАЖНО: Структура Hero отличается от оппонентов - НЕТ уровня strength
 *
 * Структура: ranges.hero.stages.{STAGE}.positions.{POSITION}.{playStyle}.ranges_by_stack.{stackSize}.{action}
 *
 * @param stage - Стадия турнира
 * @param position - Позиция Hero
 * @param playStyle - Стиль игры (tight/balanced/aggressor)
 * @param stackSize - Размер стека
 * @param action - Тип действия
 * @param category - Категория турнира
 * @param startingStack - Начальный стек
 * @param bounty - Наличие баунти
 * @returns Массив рук
 */
export function getHeroRangeFromJSON(
  stage: TournamentStage,
  position: TablePosition,
  playStyle: PlayerPlayStyle,
  stackSize: StackSize,
  action: TournamentActionType,
  category: TournamentCategory,
  startingStack: number,
  bounty: boolean
): string[] {
  try {
    // Выбираем правильный файл данных
    const rangeData = getHeroRangeDataFile(category, startingStack, bounty);
    if (!rangeData) {
      console.log("No hero range file found for:", { category, startingStack, bounty });
      return [];
    }

    // Получаем данные из выбранного JSON
    const ranges = rangeData.ranges;

    // Навигация по структуре JSON для Hero (БЕЗ уровня strength)
    const heroData = ranges?.hero;
    if (!heroData) {
      console.log("No hero data in ranges");
      return [];
    }

    const stageData = heroData?.stages?.[stage];
    if (!stageData) {
      console.log(`No data for stage: ${stage}`);
      return [];
    }

    const positionData = stageData?.positions?.[position];
    if (!positionData) {
      console.log(`No data for position: ${position}`);
      return [];
    }

    // Для Hero напрямую идем к playStyle (БЕЗ strength)
    const playStyleData = positionData[playStyle];
    if (!playStyleData) {
      console.log(`No data for playStyle: ${playStyle}`);
      return [];
    }

    const stackCategory = stackSizeToJsonCategory(stackSize);
    const stackData = playStyleData.ranges_by_stack?.[stackCategory];
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
    console.error("Ошибка при загрузке диапазона Hero из JSON:", error);
    return [];
  }
}

/**
 * Получает диапазон Hero из переданных данных (для пользовательских наборов из БД)
 * ВАЖНО: Структура Hero БЕЗ уровня strength
 *
 * @param stage - Стадия турнира
 * @param position - Позиция Hero
 * @param playStyle - Стиль игры
 * @param stackSize - Размер стека
 * @param action - Тип действия
 * @param rangeData - JSON данные диапазонов
 * @returns Массив рук
 */
export function getHeroRangeFromData(
  stage: TournamentStage,
  position: TablePosition,
  playStyle: PlayerPlayStyle,
  stackSize: StackSize,
  action: TournamentActionType,
  rangeData: RangeSetData
): string[] {
  try {
    // Получаем данные из переданного JSON
    const ranges = (rangeData as Record<string, unknown>).ranges as Record<string, unknown> | undefined;

    // Проверяем структуру Hero
    const heroData = ranges?.["hero"] as Record<string, unknown> | undefined;
    if (!heroData) {
      console.log("No hero data in custom ranges");
      return [];
    }

    // Проверяем, есть ли структура со стадиями
    const hasStages = heroData["stages"] !== undefined;

    let positionData: Record<string, unknown> | undefined;

    if (hasStages) {
      // Новый формат: ranges.hero.stages[stage].positions[position]
      const stages = heroData["stages"] as Record<string, unknown> | undefined;
      const stageData = stages?.[stage] as Record<string, unknown> | undefined;
      if (!stageData) {
        console.log(`No data for stage: ${stage}`);
        return [];
      }

      const positions = stageData["positions"] as Record<string, unknown> | undefined;
      positionData = positions?.[position] as Record<string, unknown> | undefined;
    } else {
      // Старый формат (обратная совместимость): ranges.hero.positions[position]
      const positions = heroData["positions"] as Record<string, unknown> | undefined;
      positionData = positions?.[position] as Record<string, unknown> | undefined;
      console.log(`Using legacy format (no stages) for position: ${position}`);
    }

    if (!positionData) {
      console.log(`No data for position: ${position}`);
      return [];
    }

    // Для Hero напрямую идем к playStyle (БЕЗ strength)
    const playStyleData = positionData[playStyle] as Record<string, unknown> | undefined;
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
    console.error("Ошибка при загрузке диапазона Hero из данных:", error);
    return [];
  }
}
