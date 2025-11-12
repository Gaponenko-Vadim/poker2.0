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
 * Находит игрока с максимальной ставкой (bet), кроме Hero
 * @param users - Массив всех игроков
 * @param heroIndex - Индекс Hero
 * @returns Игрок с максимальной ставкой или null
 */
export function findPlayerWithMaxBet(users: User[], heroIndex: number): User | null {
  let maxBet = 0;
  let playerWithMaxBet: User | null = null;

  users.forEach((user, index) => {
    // Пропускаем Hero
    if (index === heroIndex) return;

    // Ищем игрока с максимальной ставкой
    if (user.bet > maxBet) {
      maxBet = user.bet;
      playerWithMaxBet = user;
    }
  });

  return playerWithMaxBet;
}

/**
 * Генерирует полный диапазон из всех 169 покерных комбинаций
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
 * Главная функция для вычисления эквити с учетом логики игры
 * Считает против игрока с максимальной ставкой (bet)
 * Если у него нет диапазона или action = null, использует полный диапазон (169 комбинаций)
 * @param users - Массив всех игроков
 * @param heroIndex - Индекс Hero
 * @returns Процент эквити или null
 */
export function calculateGameEquity(
  users: User[],
  heroIndex: number
): number | null {
  const hero = users[heroIndex];

  // Проверяем, что карты Hero выбраны
  if (!hero || !hero.cards || !hero.cards[0] || !hero.cards[1]) {
    return null;
  }

  // Находим игрока с максимальной ставкой (кроме Hero)
  const playerWithMaxBet = findPlayerWithMaxBet(users, heroIndex);

  if (!playerWithMaxBet) {
    // Если никого не найдено, считаем против BB как fallback
    return calculateHeroEquityVsBB(users, heroIndex);
  }

  // Получаем диапазон игрока с максимальной ставкой
  let opponentRange = playerWithMaxBet.range;

  // Если диапазон пустой или у игрока нет действия, используем полный диапазон
  if (!opponentRange || opponentRange.length === 0 || playerWithMaxBet.action === null) {
    opponentRange = generateFullRange();
  }

  // Вычисляем эквити против диапазона этого игрока
  return calculateHeroEquity(hero.cards, opponentRange);
}
