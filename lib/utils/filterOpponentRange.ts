import { Card } from "@/lib/redux/slices/tableSlice";
import { expandRange, filterCombinations } from "./rangeExpander";

/**
 * Параметры для фильтрации диапазона оппонента
 */
export interface FilterOpponentRangeParams {
  /** Диапазон оппонента в нотации (например, ["AA", "KK", "AKs"]) */
  opponentRange: string[];
  /** Карты Hero (2 карты) - опционально */
  heroCards?: (Card | null)[];
  /** Карты борда (до 5 карт: флоп, тёрн, ривер) - опционально */
  boardCards?: (Card | null)[];
}

/**
 * Результат фильтрации диапазона
 */
export interface FilteredRangeResult {
  /** Все возможные комбинации из диапазона (до фильтрации) */
  totalCombinations: number;
  /** Комбинации после фильтрации (убраны блокеры) */
  filteredCombinations: string[][];
  /** Количество отфильтрованных комбинаций */
  filteredCount: number;
  /** Процент оставшихся комбинаций */
  remainingPercentage: number;
  /** Список блокирующих карт (карты Hero + борд) */
  blockers: string[];
}

/**
 * Фильтрует диапазон оппонента, убирая комбинации с блокерами
 *
 * Функция:
 * 1. Разворачивает диапазон в нотации (["AA", "KK"]) во все возможные комбинации
 * 2. Собирает все известные карты (Hero + борд)
 * 3. Убирает комбинации, которые пересекаются с известными картами
 *
 * @example
 * ```typescript
 * const result = filterOpponentRange({
 *   opponentRange: ["AA", "KK", "AKs"],
 *   heroCards: ["Ahearts", "Kdiamonds"],
 *   boardCards: ["Qhearts", "Jhearts", "Thearts", null, null]
 * });
 *
 * console.log(result.filteredCount); // Количество возможных комбинаций
 * console.log(result.remainingPercentage); // Процент оставшихся рук
 * ```
 *
 * @param params - Параметры фильтрации
 * @returns Результат с отфильтрованными комбинациями и статистикой
 */
export function filterOpponentRange(params: FilterOpponentRangeParams): FilteredRangeResult {
  const { opponentRange, heroCards = [], boardCards = [] } = params;

  // 1. Разворачиваем диапазон во все возможные комбинации
  const allCombinations = expandRange(opponentRange);
  const totalCombinations = allCombinations.length;

  // 2. Собираем все известные карты (блокеры)
  const blockers: string[] = [];

  // Добавляем карты Hero (если есть)
  if (heroCards) {
    for (const card of heroCards) {
      if (card !== null && card !== undefined) {
        blockers.push(card);
      }
    }
  }

  // Добавляем карты борда (если есть)
  if (boardCards) {
    for (const card of boardCards) {
      if (card !== null && card !== undefined) {
        blockers.push(card);
      }
    }
  }

  // 3. Фильтруем комбинации, убирая те, где есть пересечения с блокерами
  const filteredCombinations = filterCombinations(allCombinations, blockers);
  const filteredCount = filteredCombinations.length;

  // 4. Вычисляем процент оставшихся комбинаций
  const remainingPercentage = totalCombinations > 0
    ? Math.round((filteredCount / totalCombinations) * 100)
    : 0;

  return {
    totalCombinations,
    filteredCombinations,
    filteredCount,
    remainingPercentage,
    blockers,
  };
}

/**
 * Вспомогательная функция для получения только массива комбинаций
 * (без дополнительной статистики)
 *
 * @param params - Параметры фильтрации
 * @returns Массив отфильтрованных комбинаций
 */
export function getFilteredCombinations(params: FilterOpponentRangeParams): string[][] {
  const result = filterOpponentRange(params);
  return result.filteredCombinations;
}

/**
 * Проверяет, остались ли вообще возможные комбинации после фильтрации
 *
 * @param params - Параметры фильтрации
 * @returns true если есть хотя бы одна возможная комбинация
 */
export function hasAnyCombinations(params: FilterOpponentRangeParams): boolean {
  const result = filterOpponentRange(params);
  return result.filteredCount > 0;
}

/**
 * Возвращает количество возможных комбинаций для каждой руки в диапазоне
 * с учётом блокеров
 *
 * @param params - Параметры фильтрации
 * @returns Map с количеством комбинаций для каждой руки
 *
 * @example
 * ```typescript
 * const combosPerHand = getCombinationsPerHand({
 *   opponentRange: ["AA", "KK", "AKs"],
 *   heroCards: ["Ahearts", "Kdiamonds"]
 * });
 *
 * console.log(combosPerHand.get("AA")); // 3 (вместо 6, т.к. Hero держит A)
 * console.log(combosPerHand.get("KK")); // 3 (вместо 6, т.к. Hero держит K)
 * console.log(combosPerHand.get("AKs")); // 0 (все AKs блокированы)
 * ```
 */
export function getCombinationsPerHand(
  params: FilterOpponentRangeParams
): Map<string, number> {
  const { opponentRange, heroCards = [], boardCards = [] } = params;

  // Собираем блокеры
  const blockers: string[] = [];
  if (heroCards) {
    for (const card of heroCards) {
      if (card) blockers.push(card);
    }
  }
  if (boardCards) {
    for (const card of boardCards) {
      if (card) blockers.push(card);
    }
  }

  const combosPerHand = new Map<string, number>();

  // Для каждой руки в диапазоне вычисляем количество возможных комбинаций
  for (const handNotation of opponentRange) {
    const handCombinations = expandRange([handNotation]);
    const filteredHandCombinations = filterCombinations(handCombinations, blockers);
    combosPerHand.set(handNotation, filteredHandCombinations.length);
  }

  return combosPerHand;
}
