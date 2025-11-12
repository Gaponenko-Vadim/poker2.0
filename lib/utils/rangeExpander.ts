import { CardRank, CardSuit } from "../redux/slices/tableSlice";

// Все возможные масти
const SUITS: CardSuit[] = ["hearts", "diamonds", "clubs", "spades"];

/**
 * Генерирует все возможные комбинации карт из покерной нотации
 * Например: "AA" -> [["Ahearts", "Aspades"], ["Ahearts", "Adiamonds"], ...]
 * "AKs" -> [["Ahearts", "Khearts"], ["Aspades", "Kspades"], ...]
 * "AKo" -> [["Ahearts", "Kspades"], ["Ahearts", "Kdiamonds"], ...]
 */
export function expandHandNotation(handNotation: string): string[][] {
  // Проверка на валидность
  if (!handNotation || handNotation.length < 2) {
    return [];
  }

  const rank1 = handNotation[0] as CardRank;
  const rank2 = handNotation[1] as CardRank;
  const modifier = handNotation[2]; // 's' для suited, 'o' для offsuit, undefined для пар

  const combinations: string[][] = [];

  if (!modifier) {
    // Пара (например, "AA", "KK", "22")
    for (let i = 0; i < SUITS.length; i++) {
      for (let j = i + 1; j < SUITS.length; j++) {
        const card1 = `${rank1}${SUITS[i]}`;
        const card2 = `${rank2}${SUITS[j]}`;
        combinations.push([card1, card2]);
      }
    }
  } else if (modifier === "s") {
    // Suited комбинации (одной масти)
    for (const suit of SUITS) {
      const card1 = `${rank1}${suit}`;
      const card2 = `${rank2}${suit}`;
      combinations.push([card1, card2]);
    }
  } else if (modifier === "o") {
    // Offsuit комбинации (разных мастей)
    for (const suit1 of SUITS) {
      for (const suit2 of SUITS) {
        if (suit1 !== suit2) {
          const card1 = `${rank1}${suit1}`;
          const card2 = `${rank2}${suit2}`;
          combinations.push([card1, card2]);
        }
      }
    }
  }

  return combinations;
}

/**
 * Расширяет весь диапазон рук в массив всех возможных комбинаций карт
 * Например: ["AA", "AKs", "JTo"] -> [[...], [...], ...]
 */
export function expandRange(range: string[]): string[][] {
  const allCombinations: string[][] = [];

  for (const handNotation of range) {
    const combinations = expandHandNotation(handNotation);
    allCombinations.push(...combinations);
  }

  return allCombinations;
}

/**
 * Фильтрует комбинации, исключая карты, которые уже используются
 * @param combinations - Все возможные комбинации
 * @param usedCards - Массив уже используемых карт
 */
export function filterCombinations(
  combinations: string[][],
  usedCards: string[]
): string[][] {
  const usedCardsSet = new Set(usedCards);

  return combinations.filter((combo) => {
    // Проверяем, что ни одна карта в комбинации не используется
    return !combo.some((card) => usedCardsSet.has(card));
  });
}
