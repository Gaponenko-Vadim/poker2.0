import { equityTable } from "../constants/equityTable";

const values = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "T",
  "J",
  "Q",
  "K",
  "A",
];

const formatHand = (cards: string[]): string => {
  const [card1, card2] = cards;
  const rank1 = card1[0];
  const rank2 = card2[0];
  const suit1 = card1.slice(1);
  const suit2 = card2.slice(1);

  if (rank1 === rank2) {
    return `${rank1}${rank2}`;
  }

  const isSuited = suit1 === suit2;
  if (values.indexOf(rank1) > values.indexOf(rank2)) {
    return isSuited ? `${rank1}${rank2}s` : `${rank1}${rank2}o`;
  }
  return isSuited ? `${rank2}${rank1}s` : `${rank2}${rank1}o`;
};

/**
 * Рассчитывает эквити выбранных карт против диапазона оппонента
 * @param selectedCards Выбранные карты игрока
 * @param villainRange Диапазон оппонента
 * @returns Объект с общим эквити, суммой комбинаций и деталями по рукам
 */
export const calculateEquity = (
  selectedCards: string[],
  villainRange: string[][]
): {
  equity: number | null;
  totalCountSum: number;
  handDetails: Array<{
    hand: string;
    combinations: number;
    equity: number;
    contribution: number;
  }>;
} => {
  const selectedHand = formatHand(selectedCards);
  const selectedRanks = selectedCards.map((card) => card[0]);
  const selectedCardsSet = new Set(selectedCards);
  const isSelectedHandSuited = selectedHand.endsWith("s");

  const comboCountRaw: Record<string, number> = {};
  for (const villainCombo of villainRange) {
    if (villainCombo.some((card) => selectedCardsSet.has(card))) {
      continue;
    }
    const villainHand = formatHand(villainCombo);
    comboCountRaw[villainHand] = (comboCountRaw[villainHand] || 0) + 1;
  }

  const comboCount: Record<string, number> = {};
  for (const villainHand in comboCountRaw) {
    const rawCount = comboCountRaw[villainHand];
    const villainRanks =
      villainHand.length === 2
        ? [villainHand[0], villainHand[1]]
        : [villainHand[0], villainHand[1]];
    const isSuited = villainHand.endsWith("s");

    const overlapCount = villainRanks.filter((rank) =>
      selectedRanks.includes(rank)
    ).length;

    // Логика множителей (без изменений)
    if (
      selectedHand.length === 2 &&
      villainHand.length === 2 &&
      selectedHand === villainHand
    ) {
      comboCount[villainHand] = 1;
    } else if (
      !isSelectedHandSuited &&
      villainHand.length === 2 &&
      (overlapCount === 1 || overlapCount === 2)
    ) {
      comboCount[villainHand] = 3;
    } else if (
      selectedHand.length === 2 &&
      villainHand.length !== 2 &&
      isSuited &&
      overlapCount === 1
    ) {
      comboCount[villainHand] = 2;
    } else if (
      selectedHand.length === 2 &&
      villainHand.length !== 2 &&
      !isSuited &&
      overlapCount === 1
    ) {
      comboCount[villainHand] = 6;
    } else if (
      !isSelectedHandSuited &&
      !isSuited &&
      overlapCount === 2 &&
      villainHand.slice(0, 2) === selectedHand.slice(0, 2)
    ) {
      comboCount[villainHand] = 7;
    } else if (
      !isSelectedHandSuited &&
      isSuited &&
      overlapCount === 2 &&
      villainHand.slice(0, 2) === selectedHand.slice(0, 2)
    ) {
      comboCount[villainHand] = 2;
    } else if (!isSelectedHandSuited && !isSuited && overlapCount === 1) {
      comboCount[villainHand] = 9;
    } else if (!isSelectedHandSuited && isSuited && overlapCount === 1) {
      comboCount[villainHand] = 3;
    } else if (
      isSelectedHandSuited &&
      !isSuited &&
      overlapCount === 2 &&
      villainHand.slice(0, 2) === selectedHand.slice(0, 2)
    ) {
      comboCount[villainHand] = 6;
    } else if (isSelectedHandSuited && !isSuited && overlapCount === 1) {
      comboCount[villainHand] = 9;
    } else if (isSelectedHandSuited && overlapCount > 0) {
      comboCount[villainHand] = 3;
    } else if (overlapCount === 1) {
      if (isSuited) {
        comboCount[villainHand] = 2;
      } else {
        comboCount[villainHand] = rawCount;
      }
    } else {
      comboCount[villainHand] = rawCount;
    }
  }

  let totalEquity = 0;
  let totalCombinations = 0;
  const handDetails: Array<{
    hand: string;
    combinations: number;
    equity: number;
    contribution: number;
  }> = [];

  // Рассчёт эквити для каждой руки
  for (const villainHand in comboCount) {
    const count = comboCount[villainHand];
    const key1 = `${selectedHand} vs ${villainHand}`;
    const key2 = `${villainHand} vs ${selectedHand}`;

    const equityValue = equityTable[key1]?.hand1 || equityTable[key2]?.hand2;

    if (equityValue !== undefined) {
      const contribution = equityValue * count;
      handDetails.push({
        hand: villainHand,
        combinations: count,
        equity: equityValue,
        contribution,
      });
      totalEquity += contribution;
      totalCombinations += count;
    } else {
      console.warn(`Нет данных эквити для ${key1} или ${key2}`);
    }
  }

  // Подсчёт суммы всех комбинаций
  const totalCountSum = Object.values(comboCount).reduce(
    (sum, count) => sum + count,
    0
  );

  if (totalCombinations === 0) {
    return { equity: null, totalCountSum, handDetails };
  }

  const calculatedEquity = totalEquity / totalCombinations;
  return { equity: calculatedEquity, totalCountSum, handDetails };
};
