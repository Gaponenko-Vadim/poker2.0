// Типы действий игрока в покере
export type PlayerAction =
  | "fold"      // Сброс карт
  | "call"      // Уравнять ставку
  | "check"     // Пас (когда ставка не требуется)
  | "bet"       // Первая ставка
  | "raise"     // Рейз (повышение ставки)
  | "3-bet"     // 3-бет (ререйз)
  | "4-bet"     // 4-бет
  | "5-bet"     // 5-бет
  | "all-in";   // Ва-банк

// Уровень ставок в текущем раунде
// 0 = никто не ставил (можно Bet)
// 1 = кто-то поставил (можно Raise)
// 2 = был ререйз (можно 3-bet)
// 3 = был 3-bet (можно 4-bet)
// 4 = был 4-bet (можно 5-bet)
// 5+ = можно только Call, Fold, All-in
export type BettingLevel = 0 | 1 | 2 | 3 | 4 | 5;

// Информация о текущей ставке
export interface BettingInfo {
  level: BettingLevel;           // Текущий уровень ставок
  currentBet: number;            // Текущая ставка для колла
  pot: number;                   // Размер банка
  playerStack: number;           // Стек игрока
  minRaise: number;              // Минимальный размер рейза
}

// Результат действия игрока
export interface ActionResult {
  action: PlayerAction;
  amount?: number;               // Размер ставки (если применимо)
}
