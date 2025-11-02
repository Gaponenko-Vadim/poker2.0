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
export function getAvailableActions(users: User[], currentPlayerIndex: number): PlayerAction[] {
  // Базовые действия всегда доступны
  const baseActions: PlayerAction[] = ["fold", "call", "check", "bet-open", "all-in"];

  // Проверяем, есть ли хотя бы один игрок с действием bet-open
  const hasBetOpen = users.some(user => user.action === "bet-open");

  // Если есть bet-open, добавляем raise действия
  if (hasBetOpen) {
    return [...baseActions, "raise-3bet", "raise-4bet", "raise-5bet"];
  }

  return baseActions;
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

  // Cash игра
  cashUsersCount: number; // Количество игроков (от 2 до 9)
  cashUsers: User[]; // Массив игроков (2-9)
  cashHeroIndex: number; // Индекс Hero в массиве
  cashBuyIn: number; // Buy-in для кеша
  cashAnte: number; // Анте
  cashPot: number; // Общий банк
  cashStage: TournamentStage; // Стадия игры
  cashStartingStack: number; // Начальный стек в BB (100 или 200)
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

// Начальное состояние
const initialState: TableState = {
  // 6-Max
  sixMaxUsers: generateUsers(6),
  sixMaxHeroIndex: 0, // Hero первый в массиве
  sixMaxBuyIn: 100, // Дефолтный buy-in $100
  sixMaxAnte: 1.6, // Дефолтное анте 1.6 BB (общее на стол)
  sixMaxPot: 1.6, // Начальный базовый банк = только ante, блайнды в bet игроков
  sixMaxStage: "early", // Начальная стадия турнира
  sixMaxStartingStack: 100, // Начальный стек 100 BB
  sixMaxBounty: false, // Турнир без баунти по умолчанию
  sixMaxCategory: "micro", // Категория турнира по умолчанию

  // 8-Max
  eightMaxUsers: generateUsers(8),
  eightMaxHeroIndex: 0, // Hero первый в массиве
  eightMaxBuyIn: 100, // Дефолтный buy-in $100
  eightMaxAnte: 1.6, // Дефолтное анте 1.6 BB (общее на стол)
  eightMaxPot: 1.6, // Начальный базовый банк = только ante, блайнды в bet игроков
  eightMaxStage: "early", // Начальная стадия турнира
  eightMaxStartingStack: 200, // Начальный стек 200 BB (как в tournamentRanges.json)
  eightMaxBounty: true, // Турнир с баунти (как в tournamentRanges.json)
  eightMaxCategory: "micro", // Категория турнира (как в tournamentRanges.json)

  // Cash
  cashUsersCount: 9,
  cashUsers: generateUsers(9),
  cashHeroIndex: 0, // Hero первый в массиве
  cashBuyIn: 100, // Дефолтный buy-in $100
  cashAnte: 0, // Дефолтное анте 0 (обычно нет анте в кеше)
  cashPot: 0, // Начальный базовый банк = 0, блайнды в bet игроков
  cashStage: "early", // Начальная стадия игры
  cashStartingStack: 100, // Начальный стек 100 BB
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
    },

    // Cash: Установить количество игроков
    setCashUsersCount: (state, action: PayloadAction<number>) => {
      const count = Math.min(9, Math.max(2, action.payload));
      state.cashUsersCount = count;
      state.cashUsers = generateUsers(count);
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
    },

    // 8-Max: Установить Buy-in
    setEightMaxBuyIn: (state, action: PayloadAction<number>) => {
      state.eightMaxBuyIn = action.payload;
    },

    // 8-Max: Установить Анте (общее на стол)
    setEightMaxAnte: (state, action: PayloadAction<number>) => {
      state.eightMaxAnte = action.payload;
      // Обновляем базовый банк = только анте (блайнды в bet игроков)
      state.eightMaxPot = action.payload;
    },

    // 8-Max: Установить банк
    setEightMaxPot: (state, action: PayloadAction<number>) => {
      state.eightMaxPot = action.payload;
    },

    // 6-Max: Установить Buy-in
    setSixMaxBuyIn: (state, action: PayloadAction<number>) => {
      state.sixMaxBuyIn = action.payload;
    },

    // 6-Max: Установить Анте (общее на стол)
    setSixMaxAnte: (state, action: PayloadAction<number>) => {
      state.sixMaxAnte = action.payload;
      // Обновляем базовый банк = только анте (блайнды в bet игроков)
      state.sixMaxPot = action.payload;
    },

    // 6-Max: Установить банк
    setSixMaxPot: (state, action: PayloadAction<number>) => {
      state.sixMaxPot = action.payload;
    },

    // Cash: Установить Buy-in
    setCashBuyIn: (state, action: PayloadAction<number>) => {
      state.cashBuyIn = action.payload;
    },

    // Cash: Установить анте
    setCashAnte: (state, action: PayloadAction<number>) => {
      state.cashAnte = action.payload;
    },

    // Cash: Установить стадию игры
    setCashStage: (state, action: PayloadAction<TournamentStage>) => {
      state.cashStage = action.payload;
    },

    // Cash: Установить банк
    setCashPot: (state, action: PayloadAction<number>) => {
      state.cashPot = action.payload;
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
    },

    // Cash: Установить начальный стек
    setCashStartingStack: (state, action: PayloadAction<number>) => {
      state.cashStartingStack = action.payload;
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
} = tableSlice.actions;
export default tableSlice.reducer;
