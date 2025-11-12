/**
 * Утилиты для работы с JSON структурами пользовательских диапазонов
 */

import tournamentRangesMicro100bb from "@/lib/constants/tournamentRanges_micro_100bb.json";
import tournamentRangesMicro200bb from "@/lib/constants/tournamentRanges_micro_200bb.json";
import tournamentRangesLow100bb from "@/lib/constants/tournamentRanges_low_100bb.json";
import tournamentRangesMid100bb from "@/lib/constants/tournamentRanges_mid_100bb.json";
import {
  TablePosition,
  PlayerStrength,
  PlayerPlayStyle,
  StackSize,
  TournamentStage,
  TournamentCategory,
} from "@/lib/redux/slices/tableSlice";
import { TournamentActionType } from "./tournamentRangeLoader";

// Тип для полной JSON структуры диапазонов
export interface RangeDataJSON {
  ranges: {
    user: {
      stages: {
        [stage: string]: {
          positions: {
            [position: string]: {
              [strength: string]: {
                [playStyle: string]: {
                  ranges_by_stack: {
                    [stackSize: string]: {
                      [action: string]: string;
                    };
                  };
                };
              };
            };
          };
        };
      };
    };
  };
}

// Маппинг внутренних значений в ключи JSON
const STACK_SIZE_TO_JSON: Record<StackSize, string> = {
  "very-small": "very_short",
  "small": "short",
  "medium": "medium",
  "big": "big",
};

const PLAY_STYLE_TO_JSON: Record<PlayerPlayStyle, string> = {
  "tight": "tight",
  "balanced": "balanced",
  "aggressor": "aggressor",
};

/**
 * Получить базовый JSON шаблон на основе турнирных параметров
 */
export function getBaseRangeJSON(
  category: TournamentCategory,
  startingStack: number,
  bounty: boolean
): RangeDataJSON {
  // Логика выбора JSON файла (совпадает с tournamentRangeLoader.ts)
  if (category === "micro" && startingStack === 200 && bounty) {
    return tournamentRangesMicro200bb as RangeDataJSON;
  }

  if (category === "micro" && startingStack === 100) {
    return tournamentRangesMicro100bb as RangeDataJSON;
  }

  if (category === "low" && startingStack === 100) {
    return tournamentRangesLow100bb as RangeDataJSON;
  }

  if (category === "mid" && startingStack === 100) {
    return tournamentRangesMid100bb as RangeDataJSON;
  }

  // Дефолтный fallback
  return tournamentRangesMicro100bb as RangeDataJSON;
}

/**
 * Создать пустой набор диапазонов (глубокая копия базового JSON)
 */
export function createEmptyRangeSet(
  category: TournamentCategory = "micro",
  startingStack: number = 100,
  bounty: boolean = false
): RangeDataJSON {
  const baseJSON = getBaseRangeJSON(category, startingStack, bounty);
  // Глубокое копирование JSON
  return JSON.parse(JSON.stringify(baseJSON)) as RangeDataJSON;
}

/**
 * Обновить конкретный диапазон в JSON структуре
 */
export function updateRangeInJSON(
  json: RangeDataJSON,
  stage: TournamentStage,
  position: TablePosition,
  strength: PlayerStrength,
  playStyle: PlayerPlayStyle,
  stackSize: StackSize,
  action: TournamentActionType,
  newRange: string[]
): RangeDataJSON {
  // Создаем глубокую копию для иммутабельности
  const updatedJSON: RangeDataJSON = JSON.parse(JSON.stringify(json));

  try {
    // Конвертируем внутренние значения в ключи JSON
    const stackKey = STACK_SIZE_TO_JSON[stackSize];
    const playStyleKey = PLAY_STYLE_TO_JSON[playStyle];

    // Навигация по структуре JSON
    const stageData = updatedJSON.ranges.user.stages[stage];
    if (!stageData) {
      console.warn(`Stage ${stage} not found in JSON`);
      return updatedJSON;
    }

    const positionData = stageData.positions[position];
    if (!positionData) {
      console.warn(`Position ${position} not found in JSON`);
      return updatedJSON;
    }

    const strengthData = positionData[strength];
    if (!strengthData) {
      console.warn(`Strength ${strength} not found in JSON`);
      return updatedJSON;
    }

    const playStyleData = strengthData[playStyleKey];
    if (!playStyleData) {
      console.warn(`PlayStyle ${playStyleKey} not found in JSON`);
      return updatedJSON;
    }

    const stackData = playStyleData.ranges_by_stack[stackKey];
    if (!stackData) {
      console.warn(`Stack size ${stackKey} not found in JSON`);
      return updatedJSON;
    }

    // Обновляем диапазон (сохраняем как строку через запятую)
    const rangeString = newRange.join(", ");
    stackData[action] = rangeString;

    console.log(
      `✅ Updated range: ${stage}/${position}/${strength}/${playStyleKey}/${stackKey}/${action} = ${newRange.length} hands (${rangeString.substring(0, 50)}...)`
    );
  } catch (error) {
    console.error("❌ Error updating range in JSON:", error);
  }

  return updatedJSON;
}

/**
 * Получить диапазон из JSON структуры
 */
export function getRangeFromJSON(
  json: RangeDataJSON,
  stage: TournamentStage,
  position: TablePosition,
  strength: PlayerStrength,
  playStyle: PlayerPlayStyle,
  stackSize: StackSize,
  action: TournamentActionType
): string[] {
  try {
    const stackKey = STACK_SIZE_TO_JSON[stackSize];
    const playStyleKey = PLAY_STYLE_TO_JSON[playStyle];

    const rangeString =
      json.ranges.user.stages[stage]?.positions[position]?.[strength]?.[
        playStyleKey
      ]?.ranges_by_stack[stackKey]?.[action];

    if (!rangeString || rangeString.trim() === "") {
      return [];
    }

    // Парсим строку диапазона в массив
    return rangeString
      .split(",")
      .map((hand) => hand.trim())
      .filter((hand) => hand.length > 0);
  } catch (error) {
    console.error("❌ Error getting range from JSON:", error);
    return [];
  }
}

/**
 * Валидация JSON структуры диапазонов
 */
export function validateRangeData(json: unknown): json is RangeDataJSON {
  if (!json || typeof json !== "object") {
    return false;
  }

  const data = json as Record<string, unknown>;

  // Проверяем наличие основной структуры
  if (!data.ranges || typeof data.ranges !== "object") {
    return false;
  }

  const ranges = data.ranges as Record<string, unknown>;
  if (!ranges.user || typeof ranges.user !== "object") {
    return false;
  }

  const user = ranges.user as Record<string, unknown>;
  if (!user.stages || typeof user.stages !== "object") {
    return false;
  }

  // Базовая валидация пройдена
  return true;
}

/**
 * Объединить два JSON набора диапазонов (приоритет у второго)
 */
export function mergeRangeJSONs(
  base: RangeDataJSON,
  override: Partial<RangeDataJSON>
): RangeDataJSON {
  const merged: RangeDataJSON = JSON.parse(JSON.stringify(base));

  // Простое слияние на верхнем уровне
  if (override.ranges) {
    Object.assign(merged.ranges, override.ranges);
  }

  return merged;
}

/**
 * Создать полный JSON диапазонов с учетом временных изменений
 * @param temporaryRanges - Map с временными диапазонами (ключ: "playerIndex-action")
 * @param playerIndex - Индекс игрока
 * @param position - Позиция игрока
 * @param strength - Сила игрока
 * @param playStyle - Стиль игрока
 * @param stackSize - Размер стека
 * @param stage - Стадия турнира
 * @param category - Категория турнира
 * @param startingStack - Начальный стек
 * @param bounty - С баунти или нет
 * @returns Полный JSON с учетом временных изменений
 */
export function createFullJSONWithTemporaryRanges(
  temporaryRanges: Map<string, string[]>,
  playerIndex: number,
  position: TablePosition,
  strength: PlayerStrength,
  playStyle: PlayerPlayStyle,
  stackSize: StackSize,
  stage: TournamentStage,
  category: TournamentCategory,
  startingStack: number,
  bounty: boolean
): RangeDataJSON {
  // Получаем базовый JSON
  let json = createEmptyRangeSet(category, startingStack, bounty);

  // Все стадии турнира, для которых будут применяться диапазоны
  const allStages: TournamentStage[] = ["early", "middle", "pre-bubble", "late", "pre-final", "final"];

  // Применяем все временные изменения для этого игрока КО ВСЕМ СТАДИЯМ
  temporaryRanges.forEach((range, key) => {
    // Ключ формата: "playerIndex-action"
    const [keyPlayerIndex, action] = key.split("-");

    if (parseInt(keyPlayerIndex) === playerIndex) {
      // Это изменение для нашего игрока - применяем ко всем стадиям
      allStages.forEach((stageToUpdate) => {
        json = updateRangeInJSON(
          json,
          stageToUpdate,
          position,
          strength,
          playStyle,
          stackSize,
          action as TournamentActionType,
          range
        );
      });
    }
  });

  return json;
}
