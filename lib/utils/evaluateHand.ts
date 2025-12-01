import { Card } from "@/lib/redux/slices/tableSlice";
import { parseCard } from "./cardUtils";

// Типы покерных комбинаций
export type HandRank =
  | "Royal Flush"
  | "Straight Flush"
  | "Four of a Kind"
  | "Full House"
  | "Flush"
  | "Straight"
  | "Three of a Kind"
  | "Two Pair"
  | "One Pair"
  | "High Card";

// Численные значения для сравнения
export const HAND_RANK_VALUES: Record<HandRank, number> = {
  "Royal Flush": 10,
  "Straight Flush": 9,
  "Four of a Kind": 8,
  "Full House": 7,
  "Flush": 6,
  "Straight": 5,
  "Three of a Kind": 4,
  "Two Pair": 3,
  "One Pair": 2,
  "High Card": 1,
};

// Результат оценки руки
export interface HandEvaluation {
  rank: HandRank;
  rankValue: number;
  cards: string[]; // 5 карт, составляющих комбинацию
  description: string; // Описание на русском
  kickers: number[]; // Значения кикеров для сравнения
}

// Вспомогательная функция: преобразование ранга в число
function rankToValue(rank: string): number {
  const rankMap: Record<string, number> = {
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
    "T": 10, "J": 11, "Q": 12, "K": 13, "A": 14,
  };
  return rankMap[rank] || 0;
}

// Проверка на флеш
function isFlush(cards: Array<{ rank: string; suit: string }>): boolean {
  const suitCounts = new Map<string, number>();
  for (const card of cards) {
    suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
  }
  return Array.from(suitCounts.values()).some((count) => count >= 5);
}

// Проверка на стрит
function isStraight(values: number[]): boolean {
  const uniqueValues = Array.from(new Set(values)).sort((a, b) => b - a);

  // Проверяем обычный стрит
  for (let i = 0; i <= uniqueValues.length - 5; i++) {
    if (
      uniqueValues[i] - uniqueValues[i + 1] === 1 &&
      uniqueValues[i + 1] - uniqueValues[i + 2] === 1 &&
      uniqueValues[i + 2] - uniqueValues[i + 3] === 1 &&
      uniqueValues[i + 3] - uniqueValues[i + 4] === 1
    ) {
      return true;
    }
  }

  // Проверяем колесо (A-2-3-4-5)
  if (uniqueValues.includes(14) && uniqueValues.includes(5) && uniqueValues.includes(4) && uniqueValues.includes(3) && uniqueValues.includes(2)) {
    return true;
  }

  return false;
}

// Получить карты стрита
function getStraightCards(cards: Array<{ rank: string; suit: string; value: number }>): Array<{ rank: string; suit: string; value: number }> {
  const sortedCards = [...cards].sort((a, b) => b.value - a.value);
  const uniqueValues = Array.from(new Set(sortedCards.map(c => c.value))).sort((a, b) => b - a);

  // Проверяем обычный стрит
  for (let i = 0; i <= uniqueValues.length - 5; i++) {
    if (
      uniqueValues[i] - uniqueValues[i + 1] === 1 &&
      uniqueValues[i + 1] - uniqueValues[i + 2] === 1 &&
      uniqueValues[i + 2] - uniqueValues[i + 3] === 1 &&
      uniqueValues[i + 3] - uniqueValues[i + 4] === 1
    ) {
      const straightValues = uniqueValues.slice(i, i + 5);
      return straightValues.map(v => sortedCards.find(c => c.value === v)!);
    }
  }

  // Проверяем колесо (A-2-3-4-5)
  if (uniqueValues.includes(14) && uniqueValues.includes(5) && uniqueValues.includes(4) && uniqueValues.includes(3) && uniqueValues.includes(2)) {
    return [
      sortedCards.find(c => c.value === 5)!,
      sortedCards.find(c => c.value === 4)!,
      sortedCards.find(c => c.value === 3)!,
      sortedCards.find(c => c.value === 2)!,
      sortedCards.find(c => c.value === 14)!, // Туз в колесе имеет значение 1
    ];
  }

  return [];
}

// Получить карты флеша
function getFlushCards(cards: Array<{ rank: string; suit: string; value: number }>): Array<{ rank: string; suit: string; value: number }> {
  const suitGroups = new Map<string, Array<{ rank: string; suit: string; value: number }>>();

  for (const card of cards) {
    if (!suitGroups.has(card.suit)) {
      suitGroups.set(card.suit, []);
    }
    suitGroups.get(card.suit)!.push(card);
  }

  for (const [, group] of suitGroups) {
    if (group.length >= 5) {
      return group.sort((a, b) => b.value - a.value).slice(0, 5);
    }
  }

  return [];
}

// Группировка карт по рангу
function groupByRank(cards: Array<{ rank: string; suit: string; value: number }>): Map<number, Array<{ rank: string; suit: string; value: number }>> {
  const groups = new Map<number, Array<{ rank: string; suit: string; value: number }>>();

  for (const card of cards) {
    if (!groups.has(card.value)) {
      groups.set(card.value, []);
    }
    groups.get(card.value)!.push(card);
  }

  return groups;
}

// Основная функция оценки руки
export function evaluateHand(cards: (Card | null)[]): HandEvaluation {
  // Фильтруем null и парсим карты
  const validCards = cards.filter((c): c is Card => c !== null && c !== undefined);

  if (validCards.length < 5) {
    throw new Error("Для оценки комбинации нужно минимум 5 карт");
  }

  const parsedCards = validCards.map((card) => {
    const parsed = parseCard(card);
    return {
      rank: parsed.rank,
      suit: parsed.suit,
      value: rankToValue(parsed.rank),
    };
  });

  const values = parsedCards.map((c) => c.value);
  const groups = groupByRank(parsedCards);
  const groupSizes = Array.from(groups.values()).map((g) => g.length).sort((a, b) => b - a);

  // Проверяем на Royal Flush
  const flushCards = getFlushCards(parsedCards);
  if (flushCards.length >= 5) {
    const flushValues = flushCards.map(c => c.value);
    if (isStraight(flushValues)) {
      const straightFlushCards = getStraightCards(flushCards);
      const isRoyal = straightFlushCards[0].value === 14 && straightFlushCards[1].value === 13;

      if (isRoyal) {
        return {
          rank: "Royal Flush",
          rankValue: HAND_RANK_VALUES["Royal Flush"],
          cards: straightFlushCards.map((c) => `${c.rank}${c.suit}`),
          description: "Роял Флеш",
          kickers: straightFlushCards.map(c => c.value),
        };
      }

      return {
        rank: "Straight Flush",
        rankValue: HAND_RANK_VALUES["Straight Flush"],
        cards: straightFlushCards.map((c) => `${c.rank}${c.suit}`),
        description: `Стрит Флеш (старшая карта ${straightFlushCards[0].rank})`,
        kickers: straightFlushCards.map(c => c.value),
      };
    }
  }

  // Проверяем на Four of a Kind (Каре)
  if (groupSizes[0] === 4) {
    const quadGroup = Array.from(groups.entries()).find(([, g]) => g.length === 4)!;
    const kicker = Array.from(groups.entries())
      .filter(([v]) => v !== quadGroup[0])
      .sort((a, b) => b[0] - a[0])[0];

    return {
      rank: "Four of a Kind",
      rankValue: HAND_RANK_VALUES["Four of a Kind"],
      cards: [...quadGroup[1].map((c) => `${c.rank}${c.suit}`), `${kicker[1][0].rank}${kicker[1][0].suit}`],
      description: `Каре ${quadGroup[1][0].rank}`,
      kickers: [quadGroup[0], kicker[0]],
    };
  }

  // Проверяем на Full House (Фулл Хаус)
  if (groupSizes[0] === 3 && groupSizes[1] >= 2) {
    const tripGroup = Array.from(groups.entries()).find(([, g]) => g.length === 3)!;
    const pairGroup = Array.from(groups.entries())
      .filter(([v]) => v !== tripGroup[0] && groups.get(v)!.length >= 2)
      .sort((a, b) => b[0] - a[0])[0];

    return {
      rank: "Full House",
      rankValue: HAND_RANK_VALUES["Full House"],
      cards: [
        ...tripGroup[1].map((c) => `${c.rank}${c.suit}`),
        ...pairGroup[1].slice(0, 2).map((c) => `${c.rank}${c.suit}`),
      ],
      description: `Фулл Хаус (${tripGroup[1][0].rank} и ${pairGroup[1][0].rank})`,
      kickers: [tripGroup[0], pairGroup[0]],
    };
  }

  // Проверяем на Flush (Флеш)
  if (flushCards.length >= 5) {
    return {
      rank: "Flush",
      rankValue: HAND_RANK_VALUES["Flush"],
      cards: flushCards.slice(0, 5).map((c) => `${c.rank}${c.suit}`),
      description: `Флеш (старшая карта ${flushCards[0].rank})`,
      kickers: flushCards.slice(0, 5).map(c => c.value),
    };
  }

  // Проверяем на Straight (Стрит)
  if (isStraight(values)) {
    const straightCards = getStraightCards(parsedCards);
    return {
      rank: "Straight",
      rankValue: HAND_RANK_VALUES["Straight"],
      cards: straightCards.map((c) => `${c.rank}${c.suit}`),
      description: `Стрит (старшая карта ${straightCards[0].rank})`,
      kickers: straightCards.map(c => c.value),
    };
  }

  // Проверяем на Three of a Kind (Сет)
  if (groupSizes[0] === 3) {
    const tripGroup = Array.from(groups.entries()).find(([, g]) => g.length === 3)!;
    const kickers = Array.from(groups.entries())
      .filter(([v]) => v !== tripGroup[0])
      .sort((a, b) => b[0] - a[0])
      .slice(0, 2);

    return {
      rank: "Three of a Kind",
      rankValue: HAND_RANK_VALUES["Three of a Kind"],
      cards: [
        ...tripGroup[1].map((c) => `${c.rank}${c.suit}`),
        ...kickers.flatMap(([, g]) => g.slice(0, 1).map((c) => `${c.rank}${c.suit}`)),
      ],
      description: `Сет ${tripGroup[1][0].rank}`,
      kickers: [tripGroup[0], ...kickers.map(([v]) => v)],
    };
  }

  // Проверяем на Two Pair (Две пары)
  if (groupSizes[0] === 2 && groupSizes[1] === 2) {
    const pairs = Array.from(groups.entries())
      .filter(([, g]) => g.length === 2)
      .sort((a, b) => b[0] - a[0])
      .slice(0, 2);
    const kicker = Array.from(groups.entries())
      .filter(([v]) => !pairs.some(([pv]) => pv === v))
      .sort((a, b) => b[0] - a[0])[0];

    return {
      rank: "Two Pair",
      rankValue: HAND_RANK_VALUES["Two Pair"],
      cards: [
        ...pairs[0][1].map((c) => `${c.rank}${c.suit}`),
        ...pairs[1][1].map((c) => `${c.rank}${c.suit}`),
        `${kicker[1][0].rank}${kicker[1][0].suit}`,
      ],
      description: `Две пары (${pairs[0][1][0].rank} и ${pairs[1][1][0].rank})`,
      kickers: [pairs[0][0], pairs[1][0], kicker[0]],
    };
  }

  // Проверяем на One Pair (Пара)
  if (groupSizes[0] === 2) {
    const pairGroup = Array.from(groups.entries()).find(([, g]) => g.length === 2)!;
    const kickers = Array.from(groups.entries())
      .filter(([v]) => v !== pairGroup[0])
      .sort((a, b) => b[0] - a[0])
      .slice(0, 3);

    return {
      rank: "One Pair",
      rankValue: HAND_RANK_VALUES["One Pair"],
      cards: [
        ...pairGroup[1].map((c) => `${c.rank}${c.suit}`),
        ...kickers.flatMap(([, g]) => g.slice(0, 1).map((c) => `${c.rank}${c.suit}`)),
      ],
      description: `Пара ${pairGroup[1][0].rank}`,
      kickers: [pairGroup[0], ...kickers.map(([v]) => v)],
    };
  }

  // High Card (Старшая карта)
  const sortedCards = [...parsedCards].sort((a, b) => b.value - a.value).slice(0, 5);
  return {
    rank: "High Card",
    rankValue: HAND_RANK_VALUES["High Card"],
    cards: sortedCards.map((c) => `${c.rank}${c.suit}`),
    description: `Старшая карта ${sortedCards[0].rank}`,
    kickers: sortedCards.map(c => c.value),
  };
}

// Сравнение двух рук (возвращает 1 если hand1 сильнее, -1 если hand2 сильнее, 0 если равны)
export function compareHands(hand1: HandEvaluation, hand2: HandEvaluation): number {
  if (hand1.rankValue !== hand2.rankValue) {
    return hand1.rankValue > hand2.rankValue ? 1 : -1;
  }

  // Сравниваем кикеры
  for (let i = 0; i < Math.min(hand1.kickers.length, hand2.kickers.length); i++) {
    if (hand1.kickers[i] !== hand2.kickers[i]) {
      return hand1.kickers[i] > hand2.kickers[i] ? 1 : -1;
    }
  }

  return 0; // Равные руки
}

// Найти лучшую комбинацию из 7 карт (2 карты игрока + 5 карт борда)
export function findBestHand(playerCards: [Card, Card], boardCards: Card[]): HandEvaluation {
  const allCards = [...playerCards, ...boardCards];

  if (allCards.length < 7) {
    // Если карт меньше 7 (например, на флопе), используем все доступные карты
    return evaluateHand(allCards);
  }

  // Генерируем все возможные комбинации из 5 карт
  const combinations: Array<(Card | null)[]> = [];

  for (let i = 0; i < allCards.length; i++) {
    for (let j = i + 1; j < allCards.length; j++) {
      for (let k = j + 1; k < allCards.length; k++) {
        for (let l = k + 1; l < allCards.length; l++) {
          for (let m = l + 1; m < allCards.length; m++) {
            combinations.push([allCards[i], allCards[j], allCards[k], allCards[l], allCards[m]]);
          }
        }
      }
    }
  }

  // Оцениваем все комбинации и выбираем лучшую
  let bestHand = evaluateHand(combinations[0]);

  for (let i = 1; i < combinations.length; i++) {
    const currentHand = evaluateHand(combinations[i]);
    if (compareHands(currentHand, bestHand) > 0) {
      bestHand = currentHand;
    }
  }

  return bestHand;
}
