import { getRangeForTournament, getRangeFromData } from "@/lib/utils/tournamentRangeLoader";
import type {
  PlayerAction,
  PlayerStrength,
  PlayerPlayStyle,
  StackSize,
  TournamentStage,
  TournamentCategory,
  TablePosition,
  User,
  RangeSetData,
} from "../types/tableTypes";

// Тип PokerAction для конвертации
export type PokerAction = "open" | "threeBet" | "fourBet" | "fiveBet" | "allIn";

// Тип действия турнира
export type TournamentActionType =
  | "open_raise"
  | "push_range"
  | "call_vs_shove"
  | "defense_vs_open"
  | "3bet"
  | "defense_vs_3bet"
  | "4bet"
  | "defense_vs_4bet"
  | "5bet"
  | "defense_vs_5bet";

// Вспомогательная функция для конвертации PlayerAction в PokerAction
export function convertPlayerActionToPokerAction(playerAction: PlayerAction | null): PokerAction {
  if (!playerAction) return "open";
  if (playerAction === "raise-3bet") return "threeBet";
  if (playerAction === "raise-4bet") return "fourBet";
  if (playerAction === "raise-5bet") return "fiveBet";
  if (playerAction === "all-in") return "allIn";
  if (playerAction === "bet-open") return "open";
  return "open"; // call, check, fold → open
}

// Вспомогательная функция для конвертации PokerAction в TournamentActionType
export function convertPokerActionToTournamentAction(action: PokerAction): TournamentActionType {
  const actionMap: Record<PokerAction, TournamentActionType> = {
    open: "open_raise",
    threeBet: "3bet",
    fourBet: "4bet",
    fiveBet: "5bet",
    allIn: "push_range",
  };
  return actionMap[action];
}

// Вспомогательная функция для получения диапазона с учетом турнирных настроек
export function getRangeWithTournamentSettings(
  position: TablePosition,
  strength: PlayerStrength,
  playStyle: PlayerPlayStyle,
  stackSize: StackSize,
  pokerAction: PokerAction,
  startingStack: number,
  stage: TournamentStage,
  category: TournamentCategory,
  bounty: boolean,
  customRangeData?: RangeSetData | null
): string[] {
  // Если переданы пользовательские данные диапазонов из БД, используем их
  if (customRangeData) {
    const tournamentAction = convertPokerActionToTournamentAction(pokerAction);
    console.log(`📥 getRangeWithTournamentSettings: Используются данные из БД`);
    console.log(`   - Позиция: ${position}, Сила: ${strength}, Стиль: ${playStyle}`);
    console.log(`   - Размер стека: ${stackSize}, Действие: ${tournamentAction}, Стадия: ${stage}`);
    const range = getRangeFromData(
      stage,
      position,
      strength,
      playStyle,
      stackSize,
      tournamentAction,
      customRangeData
    );
    console.log(`   ✅ Получен диапазон: ${range.length} комбинаций`);
    return range;
  }

  // Иначе получаем диапазон из дефолтных JSON файлов
  console.log(`📂 getRangeWithTournamentSettings: Используются дефолтные JSON файлы`);
  console.log(`   - Позиция: ${position}, Сила: ${strength}, Стиль: ${playStyle}`);
  console.log(`   - Размер стека: ${stackSize}, Действие: ${pokerAction}, Стадия: ${stage}`);
  const range = getRangeForTournament(
    position,
    strength,
    playStyle,
    stackSize,
    pokerAction,
    startingStack,
    stage,
    category,
    bounty
  );
  console.log(`   ✅ Получен диапазон: ${range.length} комбинаций`);
  return range;
}

// Вспомогательная функция для получения доступных действий игрока
export function getAvailableActions(users: User[], currentPlayerIndex: number): PlayerAction[] {
  const baseActions: PlayerAction[] = ["fold", "call", "check", "bet-open", "all-in"];

  const currentPlayer = users[currentPlayerIndex];
  if (!currentPlayer) return baseActions;

  const playerStack = currentPlayer.stack;

  const availableActions = currentPlayer.action === "all-in"
    ? baseActions.filter(action => action !== "fold")
    : [...baseActions];

  const getBetForAction = (targetAction: PlayerAction): number => {
    const user = users.find(u => u.action === targetAction && u.bet > 0);
    return user ? user.bet : 0;
  };

  const openBet = getBetForAction("bet-open");
  const threeBet = getBetForAction("raise-3bet");
  const fourBet = getBetForAction("raise-4bet");
  const fiveBet = getBetForAction("raise-5bet");

  const hasBetOpen = openBet > 0;
  const hasThreeBet = threeBet > 0;
  const hasFourBet = fourBet > 0;
  const hasFiveBet = fiveBet > 0;

  const allInBets = users
    .filter(u => u.action === "all-in" && u.bet > 0)
    .map(u => u.bet)
    .sort((a, b) => b - a);

  const getEffectiveBetForNextAction = (): { level: string; bet: number; previousBet: number } => {
    if (hasFiveBet) {
      return { level: "5bet", bet: fiveBet, previousBet: fourBet };
    }
    if (hasFourBet) {
      const raiseSize = fourBet - threeBet;
      const minFiveBet = fourBet + raiseSize;
      for (const allinBet of allInBets) {
        if (allinBet >= minFiveBet && allinBet > fourBet) {
          return { level: "5bet", bet: allinBet, previousBet: fourBet };
        }
      }
      return { level: "4bet", bet: fourBet, previousBet: threeBet };
    }
    if (hasThreeBet) {
      const raiseSize = threeBet - openBet;
      const minFourBet = threeBet + raiseSize;
      for (const allinBet of allInBets) {
        if (allinBet >= minFourBet && allinBet > threeBet) {
          return { level: "4bet", bet: allinBet, previousBet: threeBet };
        }
      }
      return { level: "3bet", bet: threeBet, previousBet: openBet };
    }
    if (hasBetOpen) {
      const raiseSize = openBet - 1;
      const minThreeBet = openBet + raiseSize;
      for (const allinBet of allInBets) {
        if (allinBet >= minThreeBet && allinBet > openBet) {
          return { level: "3bet", bet: allinBet, previousBet: openBet };
        }
      }
      return { level: "open", bet: openBet, previousBet: 1 };
    }
    return { level: "none", bet: 0, previousBet: 0 };
  };

  const effectiveBet = getEffectiveBetForNextAction();

  if (effectiveBet.level === "none") {
    // Нет ставок на столе - доступен только bet-open
  } else if (effectiveBet.level === "open") {
    const raiseSize = effectiveBet.bet - effectiveBet.previousBet;
    const minThreeBetSize = effectiveBet.bet + raiseSize;
    if (playerStack > minThreeBetSize && minThreeBetSize / playerStack < 0.8) {
      availableActions.push("raise-3bet");
    }
  } else if (effectiveBet.level === "3bet") {
    const raiseSize = effectiveBet.bet - effectiveBet.previousBet;
    const minFourBetSize = effectiveBet.bet + raiseSize;
    if (playerStack > minFourBetSize && minFourBetSize / playerStack < 0.8) {
      availableActions.push("raise-4bet");
    }
  } else if (effectiveBet.level === "4bet") {
    const raiseSize = effectiveBet.bet - effectiveBet.previousBet;
    const minFiveBetSize = effectiveBet.bet + raiseSize;
    if (playerStack > minFiveBetSize && minFiveBetSize / playerStack < 0.8) {
      availableActions.push("raise-5bet");
    }
  }

  return availableActions;
}

// Функция для получения значения стека в BB по размеру
export function getStackValue(stackSize: StackSize): number {
  const stackValues: Record<StackSize, number> = {
    "very-small": 10,
    "small": 25,
    "medium": 50,
    "big": 100,
  };
  return stackValues[stackSize];
}

// Функция для генерации игроков по умолчанию
export function generateUsers(count: number): User[] {
  const positions6Max: TablePosition[] = ["BTN", "SB", "BB", "UTG", "MP", "CO"];
  const positions8Max: TablePosition[] = [
    "BTN",
    "SB",
    "BB",
    "UTG",
    "UTG+1",
    "MP",
    "HJ",
    "CO",
  ];

  const positions = count <= 6 ? positions6Max : positions8Max;
  const actualPositions = positions.slice(0, count);

  return Array.from({ length: count }, (_, i) => {
    // Все игроки имеют одинаковые начальные параметры
    const strength: PlayerStrength = "amateur";
    const playStyle: PlayerPlayStyle = "balanced";
    const stackSize: StackSize = "medium";

    return {
      name: i === 0 ? "Hero" : `Игрок ${i}`,
      stack: getStackValue(stackSize),
      stackSize,
      strength,
      playStyle,
      position: actualPositions[i] || "BTN",
      range: [],
      action: null,
      bet: 0,
    };
  });
}

// Функция для ротации позиций
export function rotatePosition(
  currentPosition: TablePosition,
  positions: TablePosition[]
): TablePosition {
  const currentIndex = positions.indexOf(currentPosition);
  if (currentIndex === -1) return currentPosition;
  const nextIndex = (currentIndex + 1) % positions.length;
  return positions[nextIndex];
}
