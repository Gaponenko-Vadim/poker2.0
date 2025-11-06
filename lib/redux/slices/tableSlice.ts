import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getRangeForTournament } from "@/lib/utils/tournamentRangeLoader";

// Тип PokerAction для конвертации
type PokerAction = "open" | "threeBet" | "fourBet" | "fiveBet" | "allIn";

// Вспомогательная функция для конвертации PlayerAction в PokerAction
function convertPlayerActionToPokerAction(playerAction: PlayerAction | null): PokerAction {
  if (!playerAction) return "open";
  if (playerAction === "raise-3bet") return "threeBet";
  if (playerAction === "raise-4bet") return "fourBet";
  if (playerAction === "raise-5bet") return "fiveBet";
  if (playerAction === "all-in") return "allIn";
  if (playerAction === "bet-open") return "open";
  return "open"; // call, check, fold → open
}

// Вспомогательная функция для получения диапазона с учетом турнирных настроек
function getRangeWithTournamentSettings(
  position: TablePosition,
  strength: PlayerStrength,
  playStyle: PlayerPlayStyle,
  stackSize: StackSize,
  pokerAction: PokerAction,
  startingStack: number,
  stage: TournamentStage,
  category: TournamentCategory,
  bounty: boolean
): string[] {
  // Получаем диапазон из tournamentRanges.json
  // Если пустой или не найден - возвращаем пустой массив
  return getRangeForTournament(
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
}

// Вспомогательная функция для получения доступных действий игрока
// Правило: raise-3bet, raise-4bet, raise-5bet доступны только если кто-то сделал bet-open
// И только если у игрока достаточно фишек для этого действия
export function getAvailableActions(users: User[], currentPlayerIndex: number): PlayerAction[] {
  // Базовые действия всегда доступны
  const baseActions: PlayerAction[] = ["fold", "call", "check", "bet-open", "all-in"];

  const currentPlayer = users[currentPlayerIndex];
  if (!currentPlayer) return baseActions;

  const playerStack = currentPlayer.stack;

  // Если у игрока уже стоит all-in, то fold недоступен (игрок уже поставил все фишки)
  const availableActions = currentPlayer.action === "all-in"
    ? baseActions.filter(action => action !== "fold")
    : [...baseActions];

  // Функция для получения ставки игрока с определенным действием
  const getBetForAction = (targetAction: PlayerAction): number => {
    const user = users.find(u => u.action === targetAction && u.bet > 0);
    return user ? user.bet : 0;
  };

  // Находим ставки для каждого действия
  const openBet = getBetForAction("bet-open");
  const threeBet = getBetForAction("raise-3bet");
  const fourBet = getBetForAction("raise-4bet");
  const fiveBet = getBetForAction("raise-5bet");

  const hasBetOpen = openBet > 0;
  const hasThreeBet = threeBet > 0;
  const hasFourBet = fourBet > 0;
  const hasFiveBet = fiveBet > 0;

  // Получаем all-in ставки для расчета следующих действий
  const allInBets = users
    .filter(u => u.action === "all-in" && u.bet > 0)
    .map(u => u.bet)
    .sort((a, b) => b - a); // Сортируем по убыванию

  // Функция для определения, от какой ставки считать следующее действие
  const getEffectiveBetForNextAction = (): { level: string; bet: number; previousBet: number } => {
    // Сначала проверяем обычные действия
    if (hasFiveBet) {
      return { level: "5bet", bet: fiveBet, previousBet: fourBet };
    }
    if (hasFourBet) {
      // Проверяем, есть ли all-in больше fourBet, который может считаться 5bet
      const raiseSize = fourBet - threeBet;
      const minFiveBet = fourBet + raiseSize;
      for (const allinBet of allInBets) {
        if (allinBet >= minFiveBet && allinBet > fourBet) {
          // All-in считается как 5bet для расчета следующей ставки
          return { level: "5bet", bet: allinBet, previousBet: fourBet };
        }
      }
      return { level: "4bet", bet: fourBet, previousBet: threeBet };
    }
    if (hasThreeBet) {
      // Проверяем, есть ли all-in больше threeBet, который может считаться 4bet
      const raiseSize = threeBet - openBet;
      const minFourBet = threeBet + raiseSize;
      for (const allinBet of allInBets) {
        if (allinBet >= minFourBet && allinBet > threeBet) {
          // All-in считается как 4bet для расчета следующей ставки
          return { level: "4bet", bet: allinBet, previousBet: threeBet };
        }
      }
      return { level: "3bet", bet: threeBet, previousBet: openBet };
    }
    if (hasBetOpen) {
      // Проверяем, есть ли all-in больше openBet, который может считаться 3bet
      const raiseSize = openBet - 1;
      const minThreeBet = openBet + raiseSize;
      for (const allinBet of allInBets) {
        if (allinBet >= minThreeBet && allinBet > openBet) {
          // All-in считается как 3bet для расчета следующей ставки
          return { level: "3bet", bet: allinBet, previousBet: openBet };
        }
      }
      return { level: "open", bet: openBet, previousBet: 1 };
    }
    return { level: "none", bet: 0, previousBet: 0 };
  };

  const effectiveBet = getEffectiveBetForNextAction();

  // Рассчитываем минимальные размеры следующих ставок на основе эффективной ставки
  // Формула: минимальная следующая ставка = текущая ставка + (текущая ставка - предыдущая ставка)

  if (effectiveBet.level === "none") {
    // Нет ставок на столе - доступен только bet-open
    // bet-open уже в baseActions
  } else if (effectiveBet.level === "open") {
    // Есть open - доступен 3bet
    const raiseSize = effectiveBet.bet - effectiveBet.previousBet;
    const minThreeBetSize = effectiveBet.bet + raiseSize;
    if (playerStack > minThreeBetSize && minThreeBetSize / playerStack < 0.8) {
      availableActions.push("raise-3bet");
    }
  } else if (effectiveBet.level === "3bet") {
    // Есть 3bet (или all-in, равный 3bet) - доступен 4bet
    const raiseSize = effectiveBet.bet - effectiveBet.previousBet;
    const minFourBetSize = effectiveBet.bet + raiseSize;
    if (playerStack > minFourBetSize && minFourBetSize / playerStack < 0.8) {
      availableActions.push("raise-4bet");
    }
  } else if (effectiveBet.level === "4bet") {
    // Есть 4bet (или all-in, равный 4bet) - доступен 5bet
    const raiseSize = effectiveBet.bet - effectiveBet.previousBet;
    const minFiveBetSize = effectiveBet.bet + raiseSize;
    if (playerStack > minFiveBetSize && minFiveBetSize / playerStack < 0.8) {
      availableActions.push("raise-5bet");
    }
  }
  // Если level === "5bet", то больше нет доступных raise действий

  return availableActions;
}

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
export type CardSuit = "hearts" | "diamonds" | "clubs" | "spades"; // червы, бубны, трефы, пики

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

// Интерфейс игрока (User)
export interface User {
  name: string; // Имя игрока
  stack: number; // Стек игрока (в BB)
  stackSize: StackSize; // Размер стека (очень маленький, маленький, средний, большой)
  strength: PlayerStrength; // Сила игрока (фиксированная настройка)
  playStyle: PlayerPlayStyle; // Стиль игры (тайт, баланс, агрессор)
  position: TablePosition; // Текущая позиция за столом (меняется каждую раздачу)
  cards?: [Card | null, Card | null]; // Две карты игрока (только для Hero) - формат: ["6hearts", "5diamonds"]
  range: string[]; // Диапазон рук игрока - формат: ["AA", "AKs", "AKo", "22"]
  action: PlayerAction | null; // Выбранное действие игрока (null если не выбрано)
  bet: number; // Текущая ставка игрока в BB (блайнды/беты, анте не учитывается)
  // autoAllIn убран - теперь это глобальная настройка на уровне стола
}

// Интерфейс состояния стола
interface TableState {
  // 6-Max турнир
  sixMaxUsers: User[]; // Массив из 6 игроков
  sixMaxHeroIndex: number; // Индекс Hero в массиве (0-5)
  sixMaxBuyIn: number; // Цена турнира
  sixMaxAnte: number; // Анте
  sixMaxPot: number; // Общий банк
  sixMaxStage: TournamentStage; // Стадия турнира
  sixMaxStartingStack: number; // Начальный стек в BB (100 или 200)
  sixMaxBounty: boolean; // Турнир с баунти или нет
  sixMaxCategory: TournamentCategory; // Категория турнира по buy-in
  sixMaxAutoAllIn: boolean; // Глобальная настройка: всегда ставить весь стек для всех игроков
  sixMaxOpenRaiseSize: number; // Размер open raise в BB (по умолчанию 2.5)
  sixMaxThreeBetMultiplier: number; // Множитель для 3-bet (по умолчанию 3)
  sixMaxFourBetMultiplier: number; // Множитель для 4-bet (по умолчанию 2.7)
  sixMaxFiveBetMultiplier: number; // Множитель для 5-bet (по умолчанию 2.2)
  sixMaxEnabledPlayStyles: { tight: boolean; balanced: boolean; aggressor: boolean }; // Включенные стили игры
  sixMaxEnabledStrengths: { fish: boolean; amateur: boolean; regular: boolean }; // Включенные силы игроков

  // 8-Max турнир
  eightMaxUsers: User[]; // Массив из 8 игроков
  eightMaxHeroIndex: number; // Индекс Hero в массиве (0-7)
  eightMaxBuyIn: number; // Цена турнира
  eightMaxAnte: number; // Анте
  eightMaxPot: number; // Общий банк
  eightMaxStage: TournamentStage; // Стадия турнира
  eightMaxStartingStack: number; // Начальный стек в BB (100 или 200)
  eightMaxBounty: boolean; // Турнир с баунти или нет
  eightMaxCategory: TournamentCategory; // Категория турнира по buy-in
  eightMaxAutoAllIn: boolean; // Глобальная настройка: всегда ставить весь стек для всех игроков
  eightMaxOpenRaiseSize: number; // Размер open raise в BB (по умолчанию 2.5)
  eightMaxThreeBetMultiplier: number; // Множитель для 3-bet (по умолчанию 3)
  eightMaxFourBetMultiplier: number; // Множитель для 4-bet (по умолчанию 2.7)
  eightMaxFiveBetMultiplier: number; // Множитель для 5-bet (по умолчанию 2.2)
  eightMaxEnabledPlayStyles: { tight: boolean; balanced: boolean; aggressor: boolean }; // Включенные стили игры
  eightMaxEnabledStrengths: { fish: boolean; amateur: boolean; regular: boolean }; // Включенные силы игроков

  // Cash игра
  cashUsersCount: number; // Количество игроков (от 2 до 9)
  cashUsers: User[]; // Массив игроков (2-9)
  cashHeroIndex: number; // Индекс Hero в массиве
  cashBuyIn: number; // Buy-in для кеша
  cashAnte: number; // Анте
  cashPot: number; // Общий банк
  cashStage: TournamentStage; // Стадия игры
  cashStartingStack: number; // Начальный стек в BB (100 или 200)
  cashAutoAllIn: boolean; // Глобальная настройка: всегда ставить весь стек для всех игроков
  cashOpenRaiseSize: number; // Размер open raise в BB (по умолчанию 2.5)
  cashThreeBetMultiplier: number; // Множитель для 3-bet (по умолчанию 3)
  cashFourBetMultiplier: number; // Множитель для 4-bet (по умолчанию 2.7)
  cashFiveBetMultiplier: number; // Множитель для 5-bet (по умолчанию 2.2)
  cashEnabledPlayStyles: { tight: boolean; balanced: boolean; aggressor: boolean }; // Включенные стили игры
  cashEnabledStrengths: { fish: boolean; amateur: boolean; regular: boolean }; // Включенные силы игроков
}

// Функция для получения значения стека в BB по размеру
const getStackValue = (stackSize: StackSize): number => {
  const stackValues: Record<StackSize, number> = {
    "very-small": 10, // 10 BB
    "small": 25,      // 25 BB
    "medium": 50,     // 50 BB
    "big": 100,       // 100 BB
  };
  return stackValues[stackSize];
};

// Функция для генерации игроков по умолчанию
const generateUsers = (count: number): User[] => {
  // Позиции для 6-max
  const positions6Max: TablePosition[] = ["BTN", "SB", "BB", "UTG", "MP", "CO"];
  // Позиции для 8-max (и 9-max cash)
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

  return Array.from({ length: count }, (_, i) => {
    const position = positions[i % positions.length];
    const isHero = i === 0;
    const defaultStrength: PlayerStrength = "amateur";
    const defaultPlayStyle: PlayerPlayStyle = "balanced";
    const defaultStackSize: StackSize = "medium";

    // Автоматически устанавливаем ставку для блайндов
    let initialBet = 0;
    if (position === "SB") initialBet = 0.5;
    if (position === "BB") initialBet = 1;

    return {
      name: `Игрок ${i + 1}`,
      stack: 50, // По умолчанию средний стек (50 BB)
      stackSize: defaultStackSize, // По умолчанию средний размер стека
      strength: defaultStrength, // По умолчанию все средние
      playStyle: defaultPlayStyle, // По умолчанию баланс
      position, // Присвоение начальной позиции
      // Карты только для Hero (первый игрок)
      ...(isHero && { cards: [null, null] as [Card | null, Card | null] }),
      // Диапазон будет загружен из tournamentRanges.json при изменении параметров
      range: [],
      action: null as PlayerAction | null, // По умолчанию действие не выбрано
      bet: initialBet, // Ставка: SB=0.5, BB=1, остальные=0
    };
  });
};

// Функция для загрузки настроек из localStorage
const loadSettingsFromLocalStorage = () => {
  if (typeof window === 'undefined') return null;

  try {
    const saved = localStorage.getItem('pokerTableSettings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
  }
  return null;
};

// Функция для сохранения настроек в localStorage
const saveSettingsToLocalStorage = (state: TableState) => {
  if (typeof window === 'undefined') return;

  try {
    const settings = {
      // 6-Max полное состояние
      sixMaxUsers: state.sixMaxUsers,
      sixMaxHeroIndex: state.sixMaxHeroIndex,
      sixMaxBuyIn: state.sixMaxBuyIn,
      sixMaxAnte: state.sixMaxAnte,
      sixMaxPot: state.sixMaxPot,
      sixMaxStage: state.sixMaxStage,
      sixMaxStartingStack: state.sixMaxStartingStack,
      sixMaxBounty: state.sixMaxBounty,
      sixMaxCategory: state.sixMaxCategory,
      sixMaxAutoAllIn: state.sixMaxAutoAllIn,
      sixMaxOpenRaiseSize: state.sixMaxOpenRaiseSize,
      sixMaxThreeBetMultiplier: state.sixMaxThreeBetMultiplier,
      sixMaxFourBetMultiplier: state.sixMaxFourBetMultiplier,
      sixMaxFiveBetMultiplier: state.sixMaxFiveBetMultiplier,
      sixMaxEnabledPlayStyles: state.sixMaxEnabledPlayStyles,
      sixMaxEnabledStrengths: state.sixMaxEnabledStrengths,

      // 8-Max полное состояние
      eightMaxUsers: state.eightMaxUsers,
      eightMaxHeroIndex: state.eightMaxHeroIndex,
      eightMaxBuyIn: state.eightMaxBuyIn,
      eightMaxAnte: state.eightMaxAnte,
      eightMaxPot: state.eightMaxPot,
      eightMaxStage: state.eightMaxStage,
      eightMaxStartingStack: state.eightMaxStartingStack,
      eightMaxBounty: state.eightMaxBounty,
      eightMaxCategory: state.eightMaxCategory,
      eightMaxAutoAllIn: state.eightMaxAutoAllIn,
      eightMaxOpenRaiseSize: state.eightMaxOpenRaiseSize,
      eightMaxThreeBetMultiplier: state.eightMaxThreeBetMultiplier,
      eightMaxFourBetMultiplier: state.eightMaxFourBetMultiplier,
      eightMaxFiveBetMultiplier: state.eightMaxFiveBetMultiplier,
      eightMaxEnabledPlayStyles: state.eightMaxEnabledPlayStyles,
      eightMaxEnabledStrengths: state.eightMaxEnabledStrengths,

      // Cash полное состояние
      cashUsersCount: state.cashUsersCount,
      cashUsers: state.cashUsers,
      cashHeroIndex: state.cashHeroIndex,
      cashBuyIn: state.cashBuyIn,
      cashAnte: state.cashAnte,
      cashPot: state.cashPot,
      cashStage: state.cashStage,
      cashStartingStack: state.cashStartingStack,
      cashAutoAllIn: state.cashAutoAllIn,
      cashOpenRaiseSize: state.cashOpenRaiseSize,
      cashThreeBetMultiplier: state.cashThreeBetMultiplier,
      cashFourBetMultiplier: state.cashFourBetMultiplier,
      cashFiveBetMultiplier: state.cashFiveBetMultiplier,
      cashEnabledPlayStyles: state.cashEnabledPlayStyles,
      cashEnabledStrengths: state.cashEnabledStrengths,
    };

    localStorage.setItem('pokerTableSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
  }
};

// Загружаем сохраненные настройки
const savedSettings = loadSettingsFromLocalStorage();

// Начальное состояние
const initialState: TableState = {
  // 6-Max
  sixMaxUsers: savedSettings?.sixMaxUsers ?? generateUsers(6),
  sixMaxHeroIndex: savedSettings?.sixMaxHeroIndex ?? 0,
  sixMaxBuyIn: savedSettings?.sixMaxBuyIn ?? 100,
  sixMaxAnte: savedSettings?.sixMaxAnte ?? 1.6,
  sixMaxPot: savedSettings?.sixMaxPot ?? 1.6,
  sixMaxStage: savedSettings?.sixMaxStage ?? "early",
  sixMaxStartingStack: savedSettings?.sixMaxStartingStack ?? 100,
  sixMaxBounty: savedSettings?.sixMaxBounty ?? false,
  sixMaxCategory: savedSettings?.sixMaxCategory ?? "micro",
  sixMaxAutoAllIn: savedSettings?.sixMaxAutoAllIn ?? false,
  sixMaxOpenRaiseSize: savedSettings?.sixMaxOpenRaiseSize ?? 2.5,
  sixMaxThreeBetMultiplier: savedSettings?.sixMaxThreeBetMultiplier ?? 3,
  sixMaxFourBetMultiplier: savedSettings?.sixMaxFourBetMultiplier ?? 2.7,
  sixMaxFiveBetMultiplier: savedSettings?.sixMaxFiveBetMultiplier ?? 2.2,
  sixMaxEnabledPlayStyles: savedSettings?.sixMaxEnabledPlayStyles ?? { tight: false, balanced: true, aggressor: false },
  sixMaxEnabledStrengths: savedSettings?.sixMaxEnabledStrengths ?? { fish: false, amateur: true, regular: false },

  // 8-Max
  eightMaxUsers: savedSettings?.eightMaxUsers ?? generateUsers(8),
  eightMaxHeroIndex: savedSettings?.eightMaxHeroIndex ?? 0,
  eightMaxBuyIn: savedSettings?.eightMaxBuyIn ?? 100,
  eightMaxAnte: savedSettings?.eightMaxAnte ?? 1.6,
  eightMaxPot: savedSettings?.eightMaxPot ?? 1.6,
  eightMaxStage: savedSettings?.eightMaxStage ?? "early",
  eightMaxStartingStack: savedSettings?.eightMaxStartingStack ?? 200,
  eightMaxBounty: savedSettings?.eightMaxBounty ?? true,
  eightMaxCategory: savedSettings?.eightMaxCategory ?? "micro",
  eightMaxAutoAllIn: savedSettings?.eightMaxAutoAllIn ?? false,
  eightMaxOpenRaiseSize: savedSettings?.eightMaxOpenRaiseSize ?? 2.5,
  eightMaxThreeBetMultiplier: savedSettings?.eightMaxThreeBetMultiplier ?? 3,
  eightMaxFourBetMultiplier: savedSettings?.eightMaxFourBetMultiplier ?? 2.7,
  eightMaxFiveBetMultiplier: savedSettings?.eightMaxFiveBetMultiplier ?? 2.2,
  eightMaxEnabledPlayStyles: savedSettings?.eightMaxEnabledPlayStyles ?? { tight: false, balanced: true, aggressor: false },
  eightMaxEnabledStrengths: savedSettings?.eightMaxEnabledStrengths ?? { fish: false, amateur: true, regular: false },

  // Cash
  cashUsersCount: savedSettings?.cashUsersCount ?? 9,
  cashUsers: savedSettings?.cashUsers ?? generateUsers(9),
  cashHeroIndex: savedSettings?.cashHeroIndex ?? 0,
  cashBuyIn: savedSettings?.cashBuyIn ?? 100,
  cashAnte: savedSettings?.cashAnte ?? 0,
  cashPot: savedSettings?.cashPot ?? 0,
  cashStage: savedSettings?.cashStage ?? "early",
  cashStartingStack: savedSettings?.cashStartingStack ?? 100,
  cashAutoAllIn: savedSettings?.cashAutoAllIn ?? false,
  cashOpenRaiseSize: savedSettings?.cashOpenRaiseSize ?? 2.5,
  cashThreeBetMultiplier: savedSettings?.cashThreeBetMultiplier ?? 3,
  cashFourBetMultiplier: savedSettings?.cashFourBetMultiplier ?? 2.7,
  cashFiveBetMultiplier: savedSettings?.cashFiveBetMultiplier ?? 2.2,
  cashEnabledPlayStyles: savedSettings?.cashEnabledPlayStyles ?? { tight: false, balanced: true, aggressor: false },
  cashEnabledStrengths: savedSettings?.cashEnabledStrengths ?? { fish: false, amateur: true, regular: false },
};

// Функция для ротации позиций
const rotatePosition = (
  position: TablePosition,
  positions: TablePosition[]
): TablePosition => {
  const currentIndex = positions.indexOf(position);
  const nextIndex = (currentIndex + 1) % positions.length;
  return positions[nextIndex];
};

// Слайс для управления состоянием стола
const tableSlice = createSlice({
  name: "table",
  initialState,
  reducers: {
    // 6-Max: Вращать стол (ротировать позиции игроков)
    rotateSixMaxTable: (state) => {
      const positions: TablePosition[] = ["BTN", "SB", "BB", "UTG", "MP", "CO"];
      state.sixMaxUsers = state.sixMaxUsers.map((user) => ({
        ...user,
        position: rotatePosition(user.position, positions),
      }));
      saveSettingsToLocalStorage(state);
    },

    // 8-Max: Вращать стол (ротировать позиции игроков)
    rotateEightMaxTable: (state) => {
      const positions: TablePosition[] = [
        "BTN",
        "SB",
        "BB",
        "UTG",
        "UTG+1",
        "MP",
        "HJ",
        "CO",
      ];
      state.eightMaxUsers = state.eightMaxUsers.map((user) => ({
        ...user,
        position: rotatePosition(user.position, positions),
      }));
      saveSettingsToLocalStorage(state);
    },

    // Cash: Установить количество игроков
    setCashUsersCount: (state, action: PayloadAction<number>) => {
      const count = Math.min(9, Math.max(2, action.payload));
      state.cashUsersCount = count;
      state.cashUsers = generateUsers(count);
      saveSettingsToLocalStorage(state);
    },
    // Cash: Вращать стол (ротировать позиции игроков)
    rotateCashTable: (state) => {
      const positions: TablePosition[] = [
        "BTN",
        "SB",
        "BB",
        "UTG",
        "UTG+1",
        "MP",
        "HJ",
        "CO",
      ];
      state.cashUsers = state.cashUsers.map((user) => ({
        ...user,
        position: rotatePosition(user.position, positions),
      }));
      saveSettingsToLocalStorage(state);
    },

    // 6-Max: Изменить силу игрока
    setSixMaxPlayerStrength: (
      state,
      action: PayloadAction<{ index: number; strength: PlayerStrength }>
    ) => {
      const { index, strength } = action.payload;
      if (state.sixMaxUsers[index]) {
        state.sixMaxUsers[index].strength = strength;
        // Автоматически обновляем диапазон на основе позиции, новой силы, текущего стека и текущего действия
        const position = state.sixMaxUsers[index].position;
        const playStyle = state.sixMaxUsers[index].playStyle;
        const stackSize = state.sixMaxUsers[index].stackSize;
        const currentAction = state.sixMaxUsers[index].action;
        const pokerAction = convertPlayerActionToPokerAction(currentAction);
        state.sixMaxUsers[index].range = getRangeWithTournamentSettings(
          position,
          strength,
          playStyle,
          stackSize,
          pokerAction,
          state.sixMaxStartingStack,
          state.sixMaxStage,
          state.sixMaxCategory,
          state.sixMaxBounty
        );
      }
      saveSettingsToLocalStorage(state);
    },

    // 8-Max: Изменить силу игрока
    setEightMaxPlayerStrength: (
      state,
      action: PayloadAction<{ index: number; strength: PlayerStrength }>
    ) => {
      const { index, strength } = action.payload;
      if (state.eightMaxUsers[index]) {
        state.eightMaxUsers[index].strength = strength;
        // Автоматически обновляем диапазон на основе позиции, новой силы, текущего стека и текущего действия
        const position = state.eightMaxUsers[index].position;
        const playStyle = state.eightMaxUsers[index].playStyle;
        const stackSize = state.eightMaxUsers[index].stackSize;
        const currentAction = state.eightMaxUsers[index].action;
        const pokerAction = convertPlayerActionToPokerAction(currentAction);
        state.eightMaxUsers[index].range = getRangeWithTournamentSettings(
          position,
          strength,
          playStyle,
          stackSize,
          pokerAction,
          state.eightMaxStartingStack,
          state.eightMaxStage,
          state.eightMaxCategory,
          state.eightMaxBounty
        );
      }
      saveSettingsToLocalStorage(state);
    },

    // Cash: Изменить силу игрока
    setCashPlayerStrength: (
      state,
      action: PayloadAction<{ index: number; strength: PlayerStrength }>
    ) => {
      const { index, strength } = action.payload;
      if (state.cashUsers[index]) {
        state.cashUsers[index].strength = strength;
        // Для Cash игр используем только defaultRanges (турнирные настройки не применяются)
        const position = state.cashUsers[index].position;
        const playStyle = state.cashUsers[index].playStyle;
        const stackSize = state.cashUsers[index].stackSize;
        const currentAction = state.cashUsers[index].action;
        const pokerAction = convertPlayerActionToPokerAction(currentAction);
        // Cash игры не используют турнирные диапазоны, поэтому передаем несовпадающие настройки
        state.cashUsers[index].range = getRangeWithTournamentSettings(
          position,
          strength,
          playStyle,
          stackSize,
          pokerAction,
          0, // Несовпадающее значение для Cash
          "early",
          "micro",
          false
        );
      }
      saveSettingsToLocalStorage(state);
    },

    // 6-Max: Изменить стиль игры
    setSixMaxPlayerPlayStyle: (
      state,
      action: PayloadAction<{ index: number; playStyle: PlayerPlayStyle }>
    ) => {
      const { index, playStyle } = action.payload;
      if (state.sixMaxUsers[index]) {
        state.sixMaxUsers[index].playStyle = playStyle;
        // Автоматически обновляем диапазон с учетом нового стиля игры
        const position = state.sixMaxUsers[index].position;
        const strength = state.sixMaxUsers[index].strength;
        const stackSize = state.sixMaxUsers[index].stackSize;
        const currentAction = state.sixMaxUsers[index].action;
        const pokerAction = convertPlayerActionToPokerAction(currentAction);
        state.sixMaxUsers[index].range = getRangeWithTournamentSettings(
          position,
          strength,
          playStyle,
          stackSize,
          pokerAction,
          state.sixMaxStartingStack,
          state.sixMaxStage,
          state.sixMaxCategory,
          state.sixMaxBounty
        );
      }
      saveSettingsToLocalStorage(state);
    },

    // 8-Max: Изменить стиль игры
    setEightMaxPlayerPlayStyle: (
      state,
      action: PayloadAction<{ index: number; playStyle: PlayerPlayStyle }>
    ) => {
      const { index, playStyle } = action.payload;
      if (state.eightMaxUsers[index]) {
        state.eightMaxUsers[index].playStyle = playStyle;
        // Автоматически обновляем диапазон с учетом нового стиля игры
        const position = state.eightMaxUsers[index].position;
        const strength = state.eightMaxUsers[index].strength;
        const stackSize = state.eightMaxUsers[index].stackSize;
        const currentAction = state.eightMaxUsers[index].action;
        const pokerAction = convertPlayerActionToPokerAction(currentAction);
        state.eightMaxUsers[index].range = getRangeWithTournamentSettings(
          position,
          strength,
          playStyle,
          stackSize,
          pokerAction,
          state.eightMaxStartingStack,
          state.eightMaxStage,
          state.eightMaxCategory,
          state.eightMaxBounty
        );
      }
      saveSettingsToLocalStorage(state);
    },

    // Cash: Изменить стиль игры
    setCashPlayerPlayStyle: (
      state,
      action: PayloadAction<{ index: number; playStyle: PlayerPlayStyle }>
    ) => {
      const { index, playStyle } = action.payload;
      if (state.cashUsers[index]) {
        state.cashUsers[index].playStyle = playStyle;
        // Для Cash игр используем только defaultRanges
        const position = state.cashUsers[index].position;
        const strength = state.cashUsers[index].strength;
        const stackSize = state.cashUsers[index].stackSize;
        const currentAction = state.cashUsers[index].action;
        const pokerAction = convertPlayerActionToPokerAction(currentAction);
        state.cashUsers[index].range = getRangeWithTournamentSettings(
          position,
          strength,
          playStyle,
          stackSize,
          pokerAction,
          0, // Несовпадающее значение для Cash
          "early",
          "micro",
          false
        );
      }
      saveSettingsToLocalStorage(state);
    },

    // 6-Max: Установить карты игрока
    setSixMaxPlayerCards: (
      state,
      action: PayloadAction<{
        index: number;
        cards: [Card | null, Card | null];
      }>
    ) => {
      const { index, cards } = action.payload;
      if (state.sixMaxUsers[index]) {
        state.sixMaxUsers[index].cards = cards;
      }
      saveSettingsToLocalStorage(state);
    },

    // 8-Max: Установить карты игрока
    setEightMaxPlayerCards: (
      state,
      action: PayloadAction<{
        index: number;
        cards: [Card | null, Card | null];
      }>
    ) => {
      const { index, cards } = action.payload;
      if (state.eightMaxUsers[index]) {
        state.eightMaxUsers[index].cards = cards;
      }
      saveSettingsToLocalStorage(state);
    },

    // Cash: Установить карты игрока
    setCashPlayerCards: (
      state,
      action: PayloadAction<{
        index: number;
        cards: [Card | null, Card | null];
      }>
    ) => {
      const { index, cards } = action.payload;
      if (state.cashUsers[index]) {
        state.cashUsers[index].cards = cards;
      }
      saveSettingsToLocalStorage(state);
    },

    // 6-Max: Установить диапазон игрока
    setSixMaxPlayerRange: (
      state,
      action: PayloadAction<{ index: number; range: string[] }>
    ) => {
      const { index, range } = action.payload;
      if (state.sixMaxUsers[index]) {
        state.sixMaxUsers[index].range = range;
      }
      saveSettingsToLocalStorage(state);
    },

    // 8-Max: Установить диапазон игрока
    setEightMaxPlayerRange: (
      state,
      action: PayloadAction<{ index: number; range: string[] }>
    ) => {
      const { index, range } = action.payload;
      if (state.eightMaxUsers[index]) {
        state.eightMaxUsers[index].range = range;
      }
      saveSettingsToLocalStorage(state);
    },

    // Cash: Установить диапазон игрока
    setCashPlayerRange: (
      state,
      action: PayloadAction<{ index: number; range: string[] }>
    ) => {
      const { index, range } = action.payload;
      if (state.cashUsers[index]) {
        state.cashUsers[index].range = range;
      }
      saveSettingsToLocalStorage(state);
    },

    // 6-Max: Установить действие игрока
    setSixMaxPlayerAction: (
      state,
      action: PayloadAction<{ index: number; action: PlayerAction | null }>
    ) => {
      const { index, action: playerAction } = action.payload;
      if (state.sixMaxUsers[index]) {
        state.sixMaxUsers[index].action = playerAction;

        // Автоматически обновляем диапазон на основе нового действия
        const position = state.sixMaxUsers[index].position;
        const strength = state.sixMaxUsers[index].strength;
        const playStyle = state.sixMaxUsers[index].playStyle;
        const stackSize = state.sixMaxUsers[index].stackSize;
        const pokerAction = convertPlayerActionToPokerAction(playerAction);

        state.sixMaxUsers[index].range = getRangeWithTournamentSettings(
          position,
          strength,
          playStyle,
          stackSize,
          pokerAction,
          state.sixMaxStartingStack,
          state.sixMaxStage,
          state.sixMaxCategory,
          state.sixMaxBounty
        );
      }
      saveSettingsToLocalStorage(state);
    },

    // 8-Max: Установить действие игрока
    setEightMaxPlayerAction: (
      state,
      action: PayloadAction<{ index: number; action: PlayerAction | null }>
    ) => {
      const { index, action: playerAction } = action.payload;
      if (state.eightMaxUsers[index]) {
        state.eightMaxUsers[index].action = playerAction;

        // Автоматически обновляем диапазон на основе нового действия
        const position = state.eightMaxUsers[index].position;
        const strength = state.eightMaxUsers[index].strength;
        const playStyle = state.eightMaxUsers[index].playStyle;
        const stackSize = state.eightMaxUsers[index].stackSize;
        const pokerAction = convertPlayerActionToPokerAction(playerAction);

        state.eightMaxUsers[index].range = getRangeWithTournamentSettings(
          position,
          strength,
          playStyle,
          stackSize,
          pokerAction,
          state.eightMaxStartingStack,
          state.eightMaxStage,
          state.eightMaxCategory,
          state.eightMaxBounty
        );
      }
      saveSettingsToLocalStorage(state);
    },

    // Cash: Установить действие игрока
    setCashPlayerAction: (
      state,
      action: PayloadAction<{ index: number; action: PlayerAction | null }>
    ) => {
      const { index, action: playerAction } = action.payload;
      if (state.cashUsers[index]) {
        state.cashUsers[index].action = playerAction;

        // Автоматически обновляем диапазон на основе нового действия
        const position = state.cashUsers[index].position;
        const strength = state.cashUsers[index].strength;
        const playStyle = state.cashUsers[index].playStyle;
        const stackSize = state.cashUsers[index].stackSize;
        const pokerAction = convertPlayerActionToPokerAction(playerAction);

        state.cashUsers[index].range = getRangeWithTournamentSettings(
          position,
          strength,
          playStyle,
          stackSize,
          pokerAction,
          0, // Несовпадающее значение для Cash
          "early",
          "micro",
          false
        );
      }
      saveSettingsToLocalStorage(state);
    },

    // 6-Max: Установить глобальный автоматический all-in для всех игроков
    setSixMaxAutoAllIn: (state, action: PayloadAction<boolean>) => {
      state.sixMaxAutoAllIn = action.payload;
      saveSettingsToLocalStorage(state);
    },

    // 8-Max: Установить глобальный автоматический all-in для всех игроков
    setEightMaxAutoAllIn: (state, action: PayloadAction<boolean>) => {
      state.eightMaxAutoAllIn = action.payload;
      saveSettingsToLocalStorage(state);
    },

    // Cash: Установить глобальный автоматический all-in для всех игроков
    setCashAutoAllIn: (state, action: PayloadAction<boolean>) => {
      state.cashAutoAllIn = action.payload;
      saveSettingsToLocalStorage(state);
    },

    // 6-Max: Установить размер открытия и множители для рейзов
    setSixMaxOpenRaiseSize: (state, action: PayloadAction<number>) => {
      state.sixMaxOpenRaiseSize = action.payload;
      saveSettingsToLocalStorage(state);
    },
    setSixMaxThreeBetMultiplier: (state, action: PayloadAction<number>) => {
      state.sixMaxThreeBetMultiplier = action.payload;
      saveSettingsToLocalStorage(state);
    },
    setSixMaxFourBetMultiplier: (state, action: PayloadAction<number>) => {
      state.sixMaxFourBetMultiplier = action.payload;
      saveSettingsToLocalStorage(state);
    },
    setSixMaxFiveBetMultiplier: (state, action: PayloadAction<number>) => {
      state.sixMaxFiveBetMultiplier = action.payload;
      saveSettingsToLocalStorage(state);
    },

    // 8-Max: Установить размер открытия и множители для рейзов
    setEightMaxOpenRaiseSize: (state, action: PayloadAction<number>) => {
      state.eightMaxOpenRaiseSize = action.payload;
      saveSettingsToLocalStorage(state);
    },
    setEightMaxThreeBetMultiplier: (state, action: PayloadAction<number>) => {
      state.eightMaxThreeBetMultiplier = action.payload;
      saveSettingsToLocalStorage(state);
    },
    setEightMaxFourBetMultiplier: (state, action: PayloadAction<number>) => {
      state.eightMaxFourBetMultiplier = action.payload;
      saveSettingsToLocalStorage(state);
    },
    setEightMaxFiveBetMultiplier: (state, action: PayloadAction<number>) => {
      state.eightMaxFiveBetMultiplier = action.payload;
      saveSettingsToLocalStorage(state);
    },

    // Cash: Установить размер открытия и множители для рейзов
    setCashOpenRaiseSize: (state, action: PayloadAction<number>) => {
      state.cashOpenRaiseSize = action.payload;
      saveSettingsToLocalStorage(state);
    },
    setCashThreeBetMultiplier: (state, action: PayloadAction<number>) => {
      state.cashThreeBetMultiplier = action.payload;
      saveSettingsToLocalStorage(state);
    },
    setCashFourBetMultiplier: (state, action: PayloadAction<number>) => {
      state.cashFourBetMultiplier = action.payload;
      saveSettingsToLocalStorage(state);
    },
    setCashFiveBetMultiplier: (state, action: PayloadAction<number>) => {
      state.cashFiveBetMultiplier = action.payload;
      saveSettingsToLocalStorage(state);
    },

    // 6-Max: Изменить размер стека игрока
    setSixMaxPlayerStackSize: (
      state,
      action: PayloadAction<{ index: number; stackSize: StackSize }>
    ) => {
      const { index, stackSize } = action.payload;
      if (state.sixMaxUsers[index]) {
        state.sixMaxUsers[index].stackSize = stackSize;
        state.sixMaxUsers[index].stack = getStackValue(stackSize);
        // Автоматически обновляем диапазон на основе позиции, текущей силы, нового размера стека и текущего действия
        const position = state.sixMaxUsers[index].position;
        const strength = state.sixMaxUsers[index].strength;
        const playStyle = state.sixMaxUsers[index].playStyle;
        const currentAction = state.sixMaxUsers[index].action;
        const pokerAction = convertPlayerActionToPokerAction(currentAction);
        state.sixMaxUsers[index].range = getRangeWithTournamentSettings(
          position,
          strength,
          playStyle,
          stackSize,
          pokerAction,
          state.sixMaxStartingStack,
          state.sixMaxStage,
          state.sixMaxCategory,
          state.sixMaxBounty
        );
      }
      saveSettingsToLocalStorage(state);
    },

    // 8-Max: Изменить размер стека игрока
    setEightMaxPlayerStackSize: (
      state,
      action: PayloadAction<{ index: number; stackSize: StackSize }>
    ) => {
      const { index, stackSize } = action.payload;
      if (state.eightMaxUsers[index]) {
        state.eightMaxUsers[index].stackSize = stackSize;
        state.eightMaxUsers[index].stack = getStackValue(stackSize);
        // Автоматически обновляем диапазон на основе позиции, текущей силы, нового размера стека и текущего действия
        const position = state.eightMaxUsers[index].position;
        const strength = state.eightMaxUsers[index].strength;
        const playStyle = state.eightMaxUsers[index].playStyle;
        const currentAction = state.eightMaxUsers[index].action;
        const pokerAction = convertPlayerActionToPokerAction(currentAction);
        state.eightMaxUsers[index].range = getRangeWithTournamentSettings(
          position,
          strength,
          playStyle,
          stackSize,
          pokerAction,
          state.eightMaxStartingStack,
          state.eightMaxStage,
          state.eightMaxCategory,
          state.eightMaxBounty
        );
      }
      saveSettingsToLocalStorage(state);
    },

    // Cash: Изменить размер стека игрока
    setCashPlayerStackSize: (
      state,
      action: PayloadAction<{ index: number; stackSize: StackSize }>
    ) => {
      const { index, stackSize } = action.payload;
      if (state.cashUsers[index]) {
        state.cashUsers[index].stackSize = stackSize;
        state.cashUsers[index].stack = getStackValue(stackSize);
        // Автоматически обновляем диапазон на основе позиции, текущей силы, нового размера стека и текущего действия
        const position = state.cashUsers[index].position;
        const strength = state.cashUsers[index].strength;
        const playStyle = state.cashUsers[index].playStyle;
        const currentAction = state.cashUsers[index].action;
        const pokerAction = convertPlayerActionToPokerAction(currentAction);
        state.cashUsers[index].range = getRangeWithTournamentSettings(
          position,
          strength,
          playStyle,
          stackSize,
          pokerAction,
          0, // Несовпадающее значение для Cash
          "early",
          "micro",
          false
        );
      }
      saveSettingsToLocalStorage(state);
    },

    // 8-Max: Установить Buy-in
    setEightMaxBuyIn: (state, action: PayloadAction<number>) => {
      state.eightMaxBuyIn = action.payload;
      saveSettingsToLocalStorage(state);
    },

    // 8-Max: Установить Анте (общее на стол)
    setEightMaxAnte: (state, action: PayloadAction<number>) => {
      state.eightMaxAnte = action.payload;
      // Обновляем базовый банк = только анте (блайнды в bet игроков)
      state.eightMaxPot = action.payload;
      saveSettingsToLocalStorage(state);
    },

    // 8-Max: Установить банк
    setEightMaxPot: (state, action: PayloadAction<number>) => {
      state.eightMaxPot = action.payload;
      saveSettingsToLocalStorage(state);
    },

    // 6-Max: Установить Buy-in
    setSixMaxBuyIn: (state, action: PayloadAction<number>) => {
      state.sixMaxBuyIn = action.payload;
      saveSettingsToLocalStorage(state);
    },

    // 6-Max: Установить Анте (общее на стол)
    setSixMaxAnte: (state, action: PayloadAction<number>) => {
      state.sixMaxAnte = action.payload;
      // Обновляем базовый банк = только анте (блайнды в bet игроков)
      state.sixMaxPot = action.payload;
      saveSettingsToLocalStorage(state);
    },

    // 6-Max: Установить банк
    setSixMaxPot: (state, action: PayloadAction<number>) => {
      state.sixMaxPot = action.payload;
      saveSettingsToLocalStorage(state);
    },

    // Cash: Установить Buy-in
    setCashBuyIn: (state, action: PayloadAction<number>) => {
      state.cashBuyIn = action.payload;
      saveSettingsToLocalStorage(state);
    },

    // Cash: Установить анте
    setCashAnte: (state, action: PayloadAction<number>) => {
      state.cashAnte = action.payload;
      saveSettingsToLocalStorage(state);
    },

    // Cash: Установить стадию игры
    setCashStage: (state, action: PayloadAction<TournamentStage>) => {
      state.cashStage = action.payload;
      saveSettingsToLocalStorage(state);
    },

    // Cash: Установить банк
    setCashPot: (state, action: PayloadAction<number>) => {
      state.cashPot = action.payload;
      saveSettingsToLocalStorage(state);
    },

    // 6-Max: Установить ставку игрока
    setSixMaxPlayerBet: (
      state,
      action: PayloadAction<{ index: number; bet: number }>
    ) => {
      const { index, bet } = action.payload;
      if (state.sixMaxUsers[index]) {
        state.sixMaxUsers[index].bet = bet;
      }
      saveSettingsToLocalStorage(state);
    },

    // 8-Max: Установить ставку игрока
    setEightMaxPlayerBet: (
      state,
      action: PayloadAction<{ index: number; bet: number }>
    ) => {
      const { index, bet } = action.payload;
      if (state.eightMaxUsers[index]) {
        state.eightMaxUsers[index].bet = bet;
      }
      saveSettingsToLocalStorage(state);
    },

    // Cash: Установить ставку игрока
    setCashPlayerBet: (
      state,
      action: PayloadAction<{ index: number; bet: number }>
    ) => {
      const { index, bet } = action.payload;
      if (state.cashUsers[index]) {
        state.cashUsers[index].bet = bet;
      }
      saveSettingsToLocalStorage(state);
    },

    // 6-Max: Установить стадию турнира
    setSixMaxStage: (state, action: PayloadAction<TournamentStage>) => {
      state.sixMaxStage = action.payload;
      // Обновляем диапазоны всех игроков (кроме Hero)
      state.sixMaxUsers.forEach((user, index) => {
        if (index !== state.sixMaxHeroIndex) {
          const pokerAction = convertPlayerActionToPokerAction(user.action);
          user.range = getRangeWithTournamentSettings(
            user.position,
            user.strength,
            user.playStyle,
            user.stackSize,
            pokerAction,
            state.sixMaxStartingStack,
            action.payload,
            state.sixMaxCategory,
            state.sixMaxBounty
          );
        }
      });
      saveSettingsToLocalStorage(state);
    },

    // 8-Max: Установить стадию турнира
    setEightMaxStage: (state, action: PayloadAction<TournamentStage>) => {
      state.eightMaxStage = action.payload;
      // Обновляем диапазоны всех игроков (кроме Hero)
      state.eightMaxUsers.forEach((user, index) => {
        if (index !== state.eightMaxHeroIndex) {
          const pokerAction = convertPlayerActionToPokerAction(user.action);
          user.range = getRangeWithTournamentSettings(
            user.position,
            user.strength,
            user.playStyle,
            user.stackSize,
            pokerAction,
            state.eightMaxStartingStack,
            action.payload,
            state.eightMaxCategory,
            state.eightMaxBounty
          );
        }
      });
      saveSettingsToLocalStorage(state);
    },

    // 6-Max: Установить начальный стек
    setSixMaxStartingStack: (state, action: PayloadAction<number>) => {
      state.sixMaxStartingStack = action.payload;
      // Обновляем диапазоны всех игроков (кроме Hero)
      state.sixMaxUsers.forEach((user, index) => {
        if (index !== state.sixMaxHeroIndex) {
          const pokerAction = convertPlayerActionToPokerAction(user.action);
          user.range = getRangeWithTournamentSettings(
            user.position,
            user.strength,
            user.playStyle,
            user.stackSize,
            pokerAction,
            action.payload,
            state.sixMaxStage,
            state.sixMaxCategory,
            state.sixMaxBounty
          );
        }
      });
      saveSettingsToLocalStorage(state);
    },

    // 8-Max: Установить начальный стек
    setEightMaxStartingStack: (state, action: PayloadAction<number>) => {
      state.eightMaxStartingStack = action.payload;
      // Обновляем диапазоны всех игроков (кроме Hero)
      state.eightMaxUsers.forEach((user, index) => {
        if (index !== state.eightMaxHeroIndex) {
          const pokerAction = convertPlayerActionToPokerAction(user.action);
          user.range = getRangeWithTournamentSettings(
            user.position,
            user.strength,
            user.playStyle,
            user.stackSize,
            pokerAction,
            action.payload,
            state.eightMaxStage,
            state.eightMaxCategory,
            state.eightMaxBounty
          );
        }
      });
      saveSettingsToLocalStorage(state);
    },

    // Cash: Установить начальный стек
    setCashStartingStack: (state, action: PayloadAction<number>) => {
      state.cashStartingStack = action.payload;
      saveSettingsToLocalStorage(state);
    },

    // 6-Max: Установить bounty
    setSixMaxBounty: (state, action: PayloadAction<boolean>) => {
      state.sixMaxBounty = action.payload;
      // Обновляем диапазоны всех игроков (кроме Hero)
      state.sixMaxUsers.forEach((user, index) => {
        if (index !== state.sixMaxHeroIndex) {
          const pokerAction = convertPlayerActionToPokerAction(user.action);
          user.range = getRangeWithTournamentSettings(
            user.position,
            user.strength,
            user.playStyle,
            user.stackSize,
            pokerAction,
            state.sixMaxStartingStack,
            state.sixMaxStage,
            state.sixMaxCategory,
            action.payload
          );
        }
      });
      saveSettingsToLocalStorage(state);
    },

    // 8-Max: Установить bounty
    setEightMaxBounty: (state, action: PayloadAction<boolean>) => {
      state.eightMaxBounty = action.payload;
      // Обновляем диапазоны всех игроков (кроме Hero)
      state.eightMaxUsers.forEach((user, index) => {
        if (index !== state.eightMaxHeroIndex) {
          const pokerAction = convertPlayerActionToPokerAction(user.action);
          user.range = getRangeWithTournamentSettings(
            user.position,
            user.strength,
            user.playStyle,
            user.stackSize,
            pokerAction,
            state.eightMaxStartingStack,
            state.eightMaxStage,
            state.eightMaxCategory,
            action.payload
          );
        }
      });
      saveSettingsToLocalStorage(state);
    },

    // 6-Max: Установить категорию турнира
    setSixMaxCategory: (state, action: PayloadAction<TournamentCategory>) => {
      state.sixMaxCategory = action.payload;
      // Обновляем диапазоны всех игроков (кроме Hero)
      state.sixMaxUsers.forEach((user, index) => {
        if (index !== state.sixMaxHeroIndex) {
          const pokerAction = convertPlayerActionToPokerAction(user.action);
          user.range = getRangeWithTournamentSettings(
            user.position,
            user.strength,
            user.playStyle,
            user.stackSize,
            pokerAction,
            state.sixMaxStartingStack,
            state.sixMaxStage,
            action.payload,
            state.sixMaxBounty
          );
        }
      });
      saveSettingsToLocalStorage(state);
    },

    // 8-Max: Установить категорию турнира
    setEightMaxCategory: (state, action: PayloadAction<TournamentCategory>) => {
      state.eightMaxCategory = action.payload;
      // Обновляем диапазоны всех игроков (кроме Hero)
      state.eightMaxUsers.forEach((user, index) => {
        if (index !== state.eightMaxHeroIndex) {
          const pokerAction = convertPlayerActionToPokerAction(user.action);
          user.range = getRangeWithTournamentSettings(
            user.position,
            user.strength,
            user.playStyle,
            user.stackSize,
            pokerAction,
            state.eightMaxStartingStack,
            state.eightMaxStage,
            action.payload,
            state.eightMaxBounty
          );
        }
      });
      saveSettingsToLocalStorage(state);
    },

    // 6-Max: Новая раздача (очистка и ротация)
    newSixMaxDeal: (state) => {
      // Ротация позиций
      const positions: TablePosition[] = ["BTN", "SB", "BB", "UTG", "MP", "CO"];
      state.sixMaxUsers = state.sixMaxUsers.map((user) => ({
        ...user,
        position: rotatePosition(user.position, positions),
      }));

      // Очистка карт, диапазонов, действий и ставок
      state.sixMaxUsers.forEach((user, index) => {
        // Очистить карты Hero
        if (index === state.sixMaxHeroIndex && user.cards) {
          user.cards = [null, null];
        }
        // Очистить диапазоны всех игроков
        user.range = [];
        // Очистить действия
        user.action = null;
        // Сбросить ставки: SB=0.5, BB=1, остальные=0
        if (user.position === "SB") {
          user.bet = 0.5;
        } else if (user.position === "BB") {
          user.bet = 1;
        } else {
          user.bet = 0;
        }
      });
      saveSettingsToLocalStorage(state);
    },

    // 8-Max: Новая раздача (очистка и ротация)
    newEightMaxDeal: (state) => {
      // Ротация позиций
      const positions: TablePosition[] = [
        "BTN",
        "SB",
        "BB",
        "UTG",
        "UTG+1",
        "MP",
        "HJ",
        "CO",
      ];
      state.eightMaxUsers = state.eightMaxUsers.map((user) => ({
        ...user,
        position: rotatePosition(user.position, positions),
      }));

      // Очистка карт, диапазонов, действий и ставок
      state.eightMaxUsers.forEach((user, index) => {
        // Очистить карты Hero
        if (index === state.eightMaxHeroIndex && user.cards) {
          user.cards = [null, null];
        }
        // Очистить диапазоны всех игроков
        user.range = [];
        // Очистить действия
        user.action = null;
        // Сбросить ставки: SB=0.5, BB=1, остальные=0
        if (user.position === "SB") {
          user.bet = 0.5;
        } else if (user.position === "BB") {
          user.bet = 1;
        } else {
          user.bet = 0;
        }
      });
      saveSettingsToLocalStorage(state);
    },

    // Cash: Новая раздача (очистка и ротация)
    newCashDeal: (state) => {
      // Ротация позиций
      const positions: TablePosition[] = [
        "BTN",
        "SB",
        "BB",
        "UTG",
        "UTG+1",
        "MP",
        "HJ",
        "CO",
      ];
      state.cashUsers = state.cashUsers.map((user) => ({
        ...user,
        position: rotatePosition(user.position, positions),
      }));

      // Очистка карт, диапазонов, действий и ставок
      state.cashUsers.forEach((user, index) => {
        // Очистить карты Hero
        if (index === state.cashHeroIndex && user.cards) {
          user.cards = [null, null];
        }
        // Очистить диапазоны всех игроков
        user.range = [];
        // Очистить действия
        user.action = null;
        // Сбросить ставки: SB=0.5, BB=1, остальные=0
        if (user.position === "SB") {
          user.bet = 0.5;
        } else if (user.position === "BB") {
          user.bet = 1;
        } else {
          user.bet = 0;
        }
      });
      saveSettingsToLocalStorage(state);
    },

    // 6-Max: Управление включенными стилями игры
    setSixMaxEnabledPlayStyles: (state, action: PayloadAction<{ tight: boolean; balanced: boolean; aggressor: boolean }>) => {
      state.sixMaxEnabledPlayStyles = action.payload;
      saveSettingsToLocalStorage(state);
    },

    // 6-Max: Управление включенными силами игроков
    setSixMaxEnabledStrengths: (state, action: PayloadAction<{ fish: boolean; amateur: boolean; regular: boolean }>) => {
      state.sixMaxEnabledStrengths = action.payload;
      saveSettingsToLocalStorage(state);
    },

    // 8-Max: Управление включенными стилями игры
    setEightMaxEnabledPlayStyles: (state, action: PayloadAction<{ tight: boolean; balanced: boolean; aggressor: boolean }>) => {
      state.eightMaxEnabledPlayStyles = action.payload;
      saveSettingsToLocalStorage(state);
    },

    // 8-Max: Управление включенными силами игроков
    setEightMaxEnabledStrengths: (state, action: PayloadAction<{ fish: boolean; amateur: boolean; regular: boolean }>) => {
      state.eightMaxEnabledStrengths = action.payload;
      saveSettingsToLocalStorage(state);
    },

    // Cash: Управление включенными стилями игры
    setCashEnabledPlayStyles: (state, action: PayloadAction<{ tight: boolean; balanced: boolean; aggressor: boolean }>) => {
      state.cashEnabledPlayStyles = action.payload;
      saveSettingsToLocalStorage(state);
    },

    // Cash: Управление включенными силами игроков
    setCashEnabledStrengths: (state, action: PayloadAction<{ fish: boolean; amateur: boolean; regular: boolean }>) => {
      state.cashEnabledStrengths = action.payload;
      saveSettingsToLocalStorage(state);
    },
  },
});

export const {
  rotateSixMaxTable,
  rotateEightMaxTable,
  setCashUsersCount,
  rotateCashTable,
  setSixMaxPlayerStrength,
  setEightMaxPlayerStrength,
  setCashPlayerStrength,
  setSixMaxPlayerPlayStyle,
  setEightMaxPlayerPlayStyle,
  setCashPlayerPlayStyle,
  setSixMaxPlayerCards,
  setEightMaxPlayerCards,
  setCashPlayerCards,
  setSixMaxPlayerRange,
  setEightMaxPlayerRange,
  setCashPlayerRange,
  setSixMaxPlayerAction,
  setEightMaxPlayerAction,
  setCashPlayerAction,
  setSixMaxAutoAllIn,
  setEightMaxAutoAllIn,
  setCashAutoAllIn,
  setSixMaxOpenRaiseSize,
  setEightMaxOpenRaiseSize,
  setCashOpenRaiseSize,
  setSixMaxThreeBetMultiplier,
  setSixMaxFourBetMultiplier,
  setSixMaxFiveBetMultiplier,
  setEightMaxThreeBetMultiplier,
  setEightMaxFourBetMultiplier,
  setEightMaxFiveBetMultiplier,
  setCashThreeBetMultiplier,
  setCashFourBetMultiplier,
  setCashFiveBetMultiplier,
  setSixMaxPlayerStackSize,
  setEightMaxPlayerStackSize,
  setCashPlayerStackSize,
  setEightMaxBuyIn,
  setEightMaxAnte,
  setEightMaxPot,
  setSixMaxBuyIn,
  setSixMaxAnte,
  setSixMaxPot,
  setCashBuyIn,
  setCashAnte,
  setCashPot,
  setCashStage,
  setSixMaxPlayerBet,
  setEightMaxPlayerBet,
  setCashPlayerBet,
  setSixMaxStage,
  setEightMaxStage,
  setSixMaxStartingStack,
  setEightMaxStartingStack,
  setCashStartingStack,
  setSixMaxBounty,
  setEightMaxBounty,
  setSixMaxCategory,
  setEightMaxCategory,
  newSixMaxDeal,
  newEightMaxDeal,
  newCashDeal,
  setSixMaxEnabledPlayStyles,
  setSixMaxEnabledStrengths,
  setEightMaxEnabledPlayStyles,
  setEightMaxEnabledStrengths,
  setCashEnabledPlayStyles,
  setCashEnabledStrengths,
} = tableSlice.actions;
export default tableSlice.reducer;
