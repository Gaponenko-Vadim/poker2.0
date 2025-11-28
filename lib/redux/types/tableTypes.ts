// Типы для Redux slice таблицы покера

// Тип силы игрока
export type PlayerStrength = "fish" | "amateur" | "regular";

// Тип стиля игры
export type PlayerPlayStyle = "tight" | "balanced" | "aggressor";

// Тип размера стека игрока
export type StackSize = "very-small" | "small" | "medium" | "big";

// Тип стадии турнира
export type TournamentStage =
  | "early"
  | "middle"
  | "pre-bubble"
  | "late"
  | "pre-final"
  | "final";

// Категория турнира по buy-in
export type TournamentCategory = "micro" | "low" | "mid" | "high";

// Тип позиции за столом
export type TablePosition =
  | "BTN"
  | "SB"
  | "BB"
  | "UTG"
  | "UTG+1"
  | "MP"
  | "CO"
  | "HJ";

// Масти карт
export type CardSuit = "hearts" | "diamonds" | "clubs" | "spades";

// Значения карт
export type CardRank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "T"
  | "J"
  | "Q"
  | "K"
  | "A";

// Карта в строковом формате (например: "6hearts", "Aspades")
export type Card = string;

// Вспомогательные типы для работы с картами
export interface ParsedCard {
  rank: CardRank;
  suit: CardSuit;
}

// Тип действия игрока
export type PlayerAction =
  | "fold"
  | "call"
  | "check"
  | "bet-open"
  | "raise-3bet"
  | "raise-4bet"
  | "raise-5bet"
  | "all-in";

// Интерфейс для временных изменений диапазонов (не сохраненных в БД)
export interface TemporaryRangeOverride {
  position: TablePosition;
  strength: PlayerStrength;
  playStyle: PlayerPlayStyle;
  stackSize: StackSize;
  action: PlayerAction | null;
  stage: TournamentStage;
  category: TournamentCategory;
  startingStack: number;
  bounty: boolean;
  range: string[]; // Измененный диапазон
}

// Интерфейс игрока (User)
export interface User {
  name: string;
  stack: number;
  stackSize: StackSize;
  strength: PlayerStrength;
  playStyle: PlayerPlayStyle;
  position: TablePosition;
  cards?: [Card | null, Card | null];
  range: string[];
  action: PlayerAction | null;
  bet: number;
}

// Тип для данных диапазонов из БД/JSON
// Представляет сложную вложенную структуру диапазонов
export type RangeSetData = Record<string, unknown>;
