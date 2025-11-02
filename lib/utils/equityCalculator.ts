import { Card, User } from "../redux/slices/tableSlice";
import { expandRange, filterCombinations } from "./rangeExpander";
import { calculateEquity } from "./calculateEquity";

/**
 * Вычисляет эквити карт Hero против диапазона оппонента
 * @param heroCards - Массив из двух карт Hero
 * @param opponentRange - Диапазон оппонента в нотации ["AA", "AKs", "JTo"]
 * @returns Процент эквити или null, если нет данных
 */
export function calculateHeroEquity(
  heroCards: [Card | null, Card | null],
  opponentRange: string[]
): number | null {
  // Проверяем, что обе карты Hero выбраны
  if (!heroCards[0] || !heroCards[1]) {
    return null;
  }

  // Проверяем, что диапазон оппонента не пустой
  if (!opponentRange || opponentRange.length === 0) {
    return null;
  }

  // Расширяем диапазон оппонента в массив всех возможных комбинаций карт
  const expandedRange = expandRange(opponentRange);

  // Фильтруем комбинации, исключая карты Hero
  const filteredRange = filterCombinations(expandedRange, [
    heroCards[0],
    heroCards[1],
  ]);

  // Если после фильтрации не осталось комбинаций
  if (filteredRange.length === 0) {
    return null;
  }

  // Вычисляем эквити
  const result = calculateEquity([heroCards[0], heroCards[1]], filteredRange);

  return result.equity;
}

/**
 * Находит игрока с позицией BB (Big Blind)
 * @param users - Массив всех игроков за столом
 * @returns Игрок с позицией BB или null
 */
export function findBBPlayer(users: User[]): User | null {
  return users.find((user) => user.position === "BB") || null;
}

/**
 * Вычисляет эквити Hero против игрока на позиции BB
 * @param users - Массив всех игроков за столом
 * @param heroIndex - Индекс Hero в массиве
 * @returns Процент эквити или null
 */
export function calculateHeroEquityVsBB(
  users: User[],
  heroIndex: number
): number | null {
  const hero = users[heroIndex];

  // Проверяем, что карты Hero выбраны
  if (!hero || !hero.cards || !hero.cards[0] || !hero.cards[1]) {
    return null;
  }

  // Находим игрока на позиции BB
  const bbPlayer = findBBPlayer(users);
  if (!bbPlayer) {
    return null;
  }

  // Вычисляем эквити против диапазона BB
  return calculateHeroEquity(hero.cards, bbPlayer.range);
}

/**
 * Проверяет, все ли игроки имеют action = null
 * @param users - Массив всех игроков
 * @returns true, если у всех игроков action = null
 */
export function areAllActionsNull(users: User[]): boolean {
  return users.every((user) => user.action === null);
}

/**
 * Главная функция для вычисления эквити с учетом логики игры
 * Если у всех action = null, считает против BB
 * @param users - Массив всех игроков
 * @param heroIndex - Индекс Hero
 * @returns Процент эквити или null
 */
export function calculateGameEquity(
  users: User[],
  heroIndex: number
): number | null {
  // Проверяем, все ли действия null
  if (areAllActionsNull(users)) {
    // Считаем против BB
    return calculateHeroEquityVsBB(users, heroIndex);
  }

  // TODO: В будущем здесь можно добавить логику для других ситуаций
  // Например, считать против игроков, которые сделали call/raise

  return calculateHeroEquityVsBB(users, heroIndex);
}
