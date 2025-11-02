import {
  TablePosition,
  PlayerStrength,
  StackSize,
} from "../redux/slices/tableSlice";

/**
 * Тип действия игрока в покере
 */
export type PokerAction = "open" | "threeBet" | "fourBet" | "fiveBet" | "allIn";

/**
 * Структура диапазонов для конкретного размера стека
 */
export interface StackRanges {
  open: string[]; // Диапазон для открытия
  threeBet: string[]; // Диапазон для 3-бета
  fourBet: string[]; // Диапазон для 4-бета
  fiveBet: string[]; // Диапазон для 5-бета
  allIn: string[]; // Диапазон для all-in
}

/**
 * Структура диапазонов для всех размеров стека
 */
export interface StrengthRanges {
  "very-small": StackRanges;
  small: StackRanges;
  medium: StackRanges;
  big: StackRanges;
}

/**
 * Структура диапазонов для всех типов силы игрока
 */
export interface PositionRanges {
  fish: StrengthRanges;
  amateur: StrengthRanges;
  regular: StrengthRanges;
}

// ============================================================================
// UTG (Under The Gun) - Ранняя позиция
// ============================================================================

export const UTG_FISH: StrengthRanges = {
  "very-small": {
    open: [],
    threeBet: [],
    fourBet: [],
    fiveBet: [],
    allIn: ["AA", "KK", "AKs"],
  },
  small: {
    open: ["AA", "KK", "AKs"],
    threeBet: ["AA", "KK"],
    fourBet: [],
    fiveBet: [],
    allIn: ["AA", "AKs"],
  },
  medium: {
    open: ["AA", "KK", "QQ", "AKs"],
    threeBet: ["AA", "KK", "AKs"],
    fourBet: ["AA", "KK"],
    fiveBet: [],
    allIn: ["AA"],
  },
  big: {
    open: ["AA", "KK", "QQ", "JJ", "AKs"],
    threeBet: ["AA", "KK", "QQ", "AKs"],
    fourBet: ["AA", "KK", "AKs"],
    fiveBet: ["AA", "KK"],
    allIn: ["AA"],
  },
};

export const UTG_AMATEUR: StrengthRanges = {
  "very-small": {
    open: [],
    threeBet: [],
    fourBet: [],
    fiveBet: [],
    allIn: ["AA", "KK"],
  },
  small: {
    open: ["AA", "KK"],
    threeBet: ["AA"],
    fourBet: [],
    fiveBet: [],
    allIn: ["AA"],
  },
  medium: {
    open: ["AA", "KK", "QQ"],
    threeBet: ["AA", "KK"],
    fourBet: ["AA"],
    fiveBet: [],
    allIn: ["AA"],
  },
  big: {
    open: ["AA", "KK", "QQ", "JJ"],
    threeBet: ["AA", "KK", "QQ"],
    fourBet: ["AA", "KK"],
    fiveBet: ["AA"],
    allIn: ["AA"],
  },
};

export const UTG_REGULAR: StrengthRanges = {
  "very-small": {
    open: [],
    threeBet: [],
    fourBet: [],
    fiveBet: [],
    allIn: ["AA"],
  },
  small: {
    open: ["AA", "KK"],
    threeBet: ["AA"],
    fourBet: [],
    fiveBet: [],
    allIn: ["AA"],
  },
  medium: {
    open: ["AA", "KK"],
    threeBet: ["AA"],
    fourBet: [],
    fiveBet: [],
    allIn: ["AA"],
  },
  big: {
    open: ["AA", "KK", "QQ"],
    threeBet: ["AA", "KK"],
    fourBet: ["AA"],
    fiveBet: [],
    allIn: ["AA"],
  },
};

export const UTG_RANGES: PositionRanges = {
  fish: UTG_FISH,
  amateur: UTG_AMATEUR,
  regular: UTG_REGULAR,
};

// ============================================================================
// MP (Middle Position)
// ============================================================================

export const MP_RANGES: PositionRanges = {
  fish: UTG_FISH, // Пока используем UTG диапазоны, заполните своими
  amateur: UTG_AMATEUR,
  regular: UTG_REGULAR,
};

// ============================================================================
// CO (Cutoff)
// ============================================================================

export const CO_RANGES: PositionRanges = {
  fish: UTG_FISH, // Пока используем UTG диапазоны, заполните своими
  amateur: UTG_AMATEUR,
  regular: UTG_REGULAR,
};

// ============================================================================
// BTN (Button)
// ============================================================================

export const BTN_RANGES: PositionRanges = {
  fish: UTG_FISH, // Пока используем UTG диапазоны, заполните своими
  amateur: UTG_AMATEUR,
  regular: UTG_REGULAR,
};

// ============================================================================
// SB (Small Blind)
// ============================================================================

export const SB_RANGES: PositionRanges = {
  fish: UTG_FISH, // Пока используем UTG диапазоны, заполните своими
  amateur: UTG_AMATEUR,
  regular: UTG_REGULAR,
};

// ============================================================================
// BB (Big Blind)
// ============================================================================

export const BB_RANGES: PositionRanges = {
  fish: UTG_FISH, // Пока используем UTG диапазоны, заполните своими
  amateur: UTG_AMATEUR,
  regular: UTG_REGULAR,
};

// ============================================================================
// HJ (Hijack)
// ============================================================================

export const HJ_RANGES: PositionRanges = {
  fish: UTG_FISH, // Пока используем UTG диапазоны, заполните своими
  amateur: UTG_AMATEUR,
  regular: UTG_REGULAR,
};

// ============================================================================
// UTG+1
// ============================================================================

export const UTG_PLUS_1_RANGES: PositionRanges = {
  fish: UTG_FISH, // Пока используем UTG диапазоны, заполните своими
  amateur: UTG_AMATEUR,
  regular: UTG_REGULAR,
};

// ============================================================================
// Главный объект со всеми диапазонами позиций
// ============================================================================

export const ALL_POSITION_RANGES: Record<TablePosition, PositionRanges> = {
  UTG: UTG_RANGES,
  "UTG+1": UTG_PLUS_1_RANGES,
  MP: MP_RANGES,
  HJ: HJ_RANGES,
  CO: CO_RANGES,
  BTN: BTN_RANGES,
  SB: SB_RANGES,
  BB: BB_RANGES,
};

/**
 * Получить диапазон на основе позиции, силы игрока, размера стека и действия
 * @param position - позиция за столом
 * @param strength - сила игрока (fish/amateur/regular)
 * @param stackSize - размер стека (very-small/small/medium/big)
 * @param action - действие (open/threeBet/fourBet/fiveBet/allIn)
 * @returns массив с диапазоном рук
 */
export function getRangeByPlayerParams(
  position: TablePosition,
  strength: PlayerStrength,
  stackSize: StackSize,
  action: PokerAction = "open"
): string[] {
  const positionRanges = ALL_POSITION_RANGES[position];
  if (!positionRanges) return [];

  const strengthRanges = positionRanges[strength];
  if (!strengthRanges) return [];

  const stackRanges = strengthRanges[stackSize];
  if (!stackRanges) return [];

  return stackRanges[action] || [];
}

/**
 * DEPRECATED: Старая функция для обратной совместимости
 * Получить дефолтный диапазон для позиции (возвращает open диапазон для amateur/medium)
 */
export function getDefaultRangeForPosition(position: TablePosition): string[] {
  return getRangeByPlayerParams(position, "amateur", "medium", "open");
}

/**
 * Проверить, является ли комбинация валидной
 * Формат: AA, AKs, AKo, JTo и т.д.
 */
export function isValidHandNotation(hand: string): boolean {
  // Проверка формата карт (2 символа для рангов + опционально s/o для suited/offsuit)
  const handRegex = /^([AKQJT98765432]{2}[so]?|[AKQJT98765432]{2})$/;
  return handRegex.test(hand);
}

/**
 * Экспорт всех возможных комбинаций для будущего расширения
 * Пока не используется, но может пригодиться для UI выбора диапазонов
 */
export const ALL_HAND_COMBINATIONS = {
  pairs: [
    "AA",
    "KK",
    "QQ",
    "JJ",
    "TT",
    "99",
    "88",
    "77",
    "66",
    "55",
    "44",
    "33",
    "22",
  ],
  suited: [
    "AKs",
    "AQs",
    "AJs",
    "ATs",
    "A9s",
    "A8s",
    "A7s",
    "A6s",
    "A5s",
    "A4s",
    "A3s",
    "A2s",
    "KQs",
    "KJs",
    "KTs",
    "K9s",
    "K8s",
    "K7s",
    "K6s",
    "K5s",
    "K4s",
    "K3s",
    "K2s",
    "QJs",
    "QTs",
    "Q9s",
    "Q8s",
    "Q7s",
    "Q6s",
    "Q5s",
    "Q4s",
    "Q3s",
    "Q2s",
    "JTs",
    "J9s",
    "J8s",
    "J7s",
    "J6s",
    "J5s",
    "J4s",
    "J3s",
    "J2s",
    "T9s",
    "T8s",
    "T7s",
    "T6s",
    "T5s",
    "T4s",
    "T3s",
    "T2s",
    "98s",
    "97s",
    "96s",
    "95s",
    "94s",
    "93s",
    "92s",
    "87s",
    "86s",
    "85s",
    "84s",
    "83s",
    "82s",
    "76s",
    "75s",
    "74s",
    "73s",
    "72s",
    "65s",
    "64s",
    "63s",
    "62s",
    "54s",
    "53s",
    "52s",
    "43s",
    "42s",
    "32s",
  ],
  offsuit: [
    "AKo",
    "AQo",
    "AJo",
    "ATo",
    "A9o",
    "A8o",
    "A7o",
    "A6o",
    "A5o",
    "A4o",
    "A3o",
    "A2o",
    "KQo",
    "KJo",
    "KTo",
    "K9o",
    "K8o",
    "K7o",
    "K6o",
    "K5o",
    "K4o",
    "K3o",
    "K2o",
    "QJo",
    "QTo",
    "Q9o",
    "Q8o",
    "Q7o",
    "Q6o",
    "Q5o",
    "Q4o",
    "Q3o",
    "Q2o",
    "JTo",
    "J9o",
    "J8o",
    "J7o",
    "J6o",
    "J5o",
    "J4o",
    "J3o",
    "J2o",
    "T9o",
    "T8o",
    "T7o",
    "T6o",
    "T5o",
    "T4o",
    "T3o",
    "T2o",
    "98o",
    "97o",
    "96o",
    "95o",
    "94o",
    "93o",
    "92o",
    "87o",
    "86o",
    "85o",
    "84o",
    "83o",
    "82o",
    "76o",
    "75o",
    "74o",
    "73o",
    "72o",
    "65o",
    "64o",
    "63o",
    "62o",
    "54o",
    "53o",
    "52o",
    "43o",
    "42o",
    "32o",
  ],
};
