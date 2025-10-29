import { Card, CardRank, CardSuit, ParsedCard } from "@/lib/redux/slices/tableSlice";

/**
 * Создает карту в строковом формате из ранга и масти
 * @example createCard("6", "hearts") => "6hearts"
 */
export function createCard(rank: CardRank, suit: CardSuit): Card {
  return `${rank}${suit}`;
}

/**
 * Парсит строковую карту в объект с рангом и мастью
 * @example parseCard("6hearts") => { rank: "6", suit: "hearts" }
 */
export function parseCard(card: Card): ParsedCard {
  const suits: CardSuit[] = ["hearts", "diamonds", "clubs", "spades"];

  // Находим масть в конце строки
  const suit = suits.find((s) => card.endsWith(s));

  if (!suit) {
    throw new Error(`Invalid card format: ${card}`);
  }

  // Извлекаем ранг (все символы до масти)
  const rank = card.slice(0, -suit.length) as CardRank;

  return { rank, suit };
}

/**
 * Проверяет, является ли строка валидной картой
 */
export function isValidCard(card: string): card is Card {
  try {
    parseCard(card);
    return true;
  } catch {
    return false;
  }
}
