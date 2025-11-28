import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  convertPlayerActionToPokerAction,
  getRangeWithTournamentSettings,
  getAvailableActions,
  getStackValue,
  generateUsers,
  rotatePosition,
} from "../utils/tableUtils";
import type {
  PlayerAction,
  PlayerStrength,
  PlayerPlayStyle,
  StackSize,
  TournamentStage,
  TournamentCategory,
  TablePosition,
  User,
  Card,
  CardRank,
  CardSuit,
  ParsedCard,
  TemporaryRangeOverride,
  RangeSetData,
} from "../types/tableTypes";

// Реэкспорт типов и функций для обратной совместимости
export { getAvailableActions };
export type {
  PlayerAction,
  PlayerStrength,
  PlayerPlayStyle,
  StackSize,
  TournamentStage,
  TournamentCategory,
  TablePosition,
  User,
  Card,
  CardRank,
  CardSuit,
  ParsedCard,
  TemporaryRangeOverride,
  RangeSetData,
};

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
  // Пользовательские наборы диапазонов
  sixMaxActiveRangeSetId: number | null; // ID активного набора диапазонов из БД
  sixMaxActiveRangeSetName: string | null; // Название активного набора
  sixMaxActiveRangeSetData: RangeSetData | null; // Загруженные данные диапазонов из БД (JSON)
  sixMaxTemporaryRanges: Record<number, TemporaryRangeOverride>; // Временные изменения диапазонов (ключ - индекс игрока)

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
  // Пользовательские наборы диапазонов
  eightMaxActiveRangeSetId: number | null; // ID активного набора диапазонов из БД
  eightMaxActiveRangeSetName: string | null; // Название активного набора
  eightMaxActiveRangeSetData: RangeSetData | null; // Загруженные данные диапазонов из БД (JSON)
  eightMaxTemporaryRanges: Record<number, TemporaryRangeOverride>; // Временные изменения диапазонов (ключ - индекс игрока)

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
  // Пользовательские наборы диапазонов
  cashActiveRangeSetId: number | null; // ID активного набора диапазонов из БД
  cashActiveRangeSetName: string | null; // Название активного набора
  cashActiveRangeSetData: RangeSetData | null; // Загруженные данные диапазонов из БД (JSON)
  cashTemporaryRanges: Record<number, TemporaryRangeOverride>; // Временные изменения диапазонов (ключ - индекс игрока)
}


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

// Начальное состояние (без загрузки из localStorage для предотвращения ошибок гидратации)
const initialState: TableState = {
  // 6-Max
  sixMaxUsers: generateUsers(6),
  sixMaxHeroIndex: 0,
  sixMaxBuyIn: 100,
  sixMaxAnte: 1.6,
  sixMaxPot: 1.6,
  sixMaxStage: "early",
  sixMaxStartingStack: 100,
  sixMaxBounty: true,
  sixMaxCategory: "micro",
  sixMaxAutoAllIn: false,
  sixMaxOpenRaiseSize: 2.5,
  sixMaxThreeBetMultiplier: 3,
  sixMaxFourBetMultiplier: 2.7,
  sixMaxFiveBetMultiplier: 2.2,
  sixMaxEnabledPlayStyles: { tight: false, balanced: true, aggressor: false },
  sixMaxEnabledStrengths: { fish: false, amateur: true, regular: false },
  sixMaxActiveRangeSetId: null,
  sixMaxActiveRangeSetName: null,
  sixMaxActiveRangeSetData: null,
  sixMaxTemporaryRanges: {},

  // 8-Max
  eightMaxUsers: generateUsers(8),
  eightMaxHeroIndex: 0,
  eightMaxBuyIn: 100,
  eightMaxAnte: 1.6,
  eightMaxPot: 1.6,
  eightMaxStage: "early",
  eightMaxStartingStack: 100,
  eightMaxBounty: true,
  eightMaxCategory: "micro",
  eightMaxAutoAllIn: false,
  eightMaxOpenRaiseSize: 2.5,
  eightMaxThreeBetMultiplier: 3,
  eightMaxFourBetMultiplier: 2.7,
  eightMaxFiveBetMultiplier: 2.2,
  eightMaxEnabledPlayStyles: { tight: false, balanced: true, aggressor: false },
  eightMaxEnabledStrengths: { fish: false, amateur: true, regular: false },
  eightMaxActiveRangeSetId: null,
  eightMaxActiveRangeSetName: null,
  eightMaxActiveRangeSetData: null,
  eightMaxTemporaryRanges: {},

  // Cash
  cashUsersCount: 9,
  cashUsers: generateUsers(9),
  cashHeroIndex: 0,
  cashBuyIn: 100,
  cashAnte: 0,
  cashPot: 0,
  cashStage: "early",
  cashStartingStack: 100,
  cashAutoAllIn: false,
  cashOpenRaiseSize: 2.5,
  cashThreeBetMultiplier: 3,
  cashFourBetMultiplier: 2.7,
  cashFiveBetMultiplier: 2.2,
  cashEnabledPlayStyles: { tight: false, balanced: true, aggressor: false },
  cashEnabledStrengths: { fish: false, amateur: true, regular: false },
  cashActiveRangeSetId: null,
  cashActiveRangeSetName: null,
  cashActiveRangeSetData: null,
  cashTemporaryRanges: {},
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
        console.log(`\n🔄 [6-Max] Изменение СИЛЫ игрока ${index}: ${state.sixMaxUsers[index].strength} → ${strength}`);
        console.log(`   Источник данных: ${state.sixMaxActiveRangeSetData ? 'БД (' + state.sixMaxActiveRangeSetName + ')' : 'Дефолтные JSON файлы'}`);
        state.sixMaxUsers[index].strength = strength;

        // Автоматически обновляем диапазон ТОЛЬКО если у игрока выбрано действие
        const currentAction = state.sixMaxUsers[index].action;

        if (currentAction === null) {
          state.sixMaxUsers[index].range = [];
          console.log(`   ⚠️ Действие не выбрано - диапазон пустой (Нет действия)`);
        } else {
          const position = state.sixMaxUsers[index].position;
          const playStyle = state.sixMaxUsers[index].playStyle;
          const stackSize = state.sixMaxUsers[index].stackSize;
          const pokerAction = convertPlayerActionToPokerAction(currentAction);
          console.log(`🔄 Обновляю диапазон для игрока ${index} (действие: ${currentAction})...`);
          state.sixMaxUsers[index].range = getRangeWithTournamentSettings(
            position,
            strength,
            playStyle,
            stackSize,
            pokerAction,
            state.sixMaxStartingStack,
            state.sixMaxStage,
            state.sixMaxCategory,
            state.sixMaxBounty,
            state.sixMaxActiveRangeSetData // Передаем данные из БД если они есть
          );
          console.log(`   ✅ Загружен диапазон: ${state.sixMaxUsers[index].range.length} комбинаций`);
        }
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

        // Автоматически обновляем диапазон ТОЛЬКО если у игрока выбрано действие
        const currentAction = state.eightMaxUsers[index].action;

        if (currentAction === null) {
          state.eightMaxUsers[index].range = [];
        } else {
          const position = state.eightMaxUsers[index].position;
          const playStyle = state.eightMaxUsers[index].playStyle;
          const stackSize = state.eightMaxUsers[index].stackSize;
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
            state.eightMaxBounty,
            state.eightMaxActiveRangeSetData // Передаем данные из БД если они есть
          );
        }
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

        // Автоматически обновляем диапазон ТОЛЬКО если у игрока выбрано действие
        const currentAction = state.cashUsers[index].action;

        if (currentAction === null) {
          state.cashUsers[index].range = [];
        } else {
          const position = state.cashUsers[index].position;
          const playStyle = state.cashUsers[index].playStyle;
          const stackSize = state.cashUsers[index].stackSize;
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
            false,
            state.cashActiveRangeSetData // Передаем данные из БД если они есть
          );
        }
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

        // Автоматически обновляем диапазон ТОЛЬКО если у игрока выбрано действие
        const currentAction = state.sixMaxUsers[index].action;

        if (currentAction === null) {
          state.sixMaxUsers[index].range = [];
        } else {
          const position = state.sixMaxUsers[index].position;
          const strength = state.sixMaxUsers[index].strength;
          const stackSize = state.sixMaxUsers[index].stackSize;
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
            state.sixMaxBounty,
            state.sixMaxActiveRangeSetData // Передаем данные из БД если они есть
          );
        }
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

        // Автоматически обновляем диапазон ТОЛЬКО если у игрока выбрано действие
        const currentAction = state.eightMaxUsers[index].action;

        if (currentAction === null) {
          state.eightMaxUsers[index].range = [];
        } else {
          const position = state.eightMaxUsers[index].position;
          const strength = state.eightMaxUsers[index].strength;
          const stackSize = state.eightMaxUsers[index].stackSize;
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
            state.eightMaxBounty,
            state.eightMaxActiveRangeSetData // Передаем данные из БД если они есть
          );
        }
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

        // Автоматически обновляем диапазон ТОЛЬКО если у игрока выбрано действие
        const currentAction = state.cashUsers[index].action;

        if (currentAction === null) {
          state.cashUsers[index].range = [];
        } else {
          const position = state.cashUsers[index].position;
          const strength = state.cashUsers[index].strength;
          const stackSize = state.cashUsers[index].stackSize;
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
            false,
            state.cashActiveRangeSetData // Передаем данные из БД если они есть
          );
        }
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

        // Автоматически обновляем диапазон (используя дефолтные JSON или данные из БД)
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
          state.sixMaxBounty,
          state.sixMaxActiveRangeSetData // Передаем данные из БД если они есть
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

        // Автоматически обновляем диапазон (используя дефолтные JSON или данные из БД)
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
          state.eightMaxBounty,
          state.eightMaxActiveRangeSetData // Передаем данные из БД если они есть
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

        // Автоматически обновляем диапазон ТОЛЬКО если у игрока выбрано действие
        const currentAction = state.sixMaxUsers[index].action;

        if (currentAction === null) {
          state.sixMaxUsers[index].range = [];
        } else {
          const position = state.sixMaxUsers[index].position;
          const strength = state.sixMaxUsers[index].strength;
          const playStyle = state.sixMaxUsers[index].playStyle;
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
            state.sixMaxBounty,
            state.sixMaxActiveRangeSetData // Передаем данные из БД если они есть
          );
        }
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

        // Автоматически обновляем диапазон ТОЛЬКО если у игрока выбрано действие
        const currentAction = state.eightMaxUsers[index].action;

        if (currentAction === null) {
          state.eightMaxUsers[index].range = [];
        } else {
          const position = state.eightMaxUsers[index].position;
          const strength = state.eightMaxUsers[index].strength;
          const playStyle = state.eightMaxUsers[index].playStyle;
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
            state.eightMaxBounty,
            state.eightMaxActiveRangeSetData // Передаем данные из БД если они есть
          );
        }
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

        // Автоматически обновляем диапазон ТОЛЬКО если у игрока выбрано действие
        const currentAction = state.cashUsers[index].action;

        if (currentAction === null) {
          state.cashUsers[index].range = [];
        } else {
          const position = state.cashUsers[index].position;
          const strength = state.cashUsers[index].strength;
          const playStyle = state.cashUsers[index].playStyle;
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
            false,
            state.cashActiveRangeSetData // Передаем данные из БД если они есть
          );
        }
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
      // Обновляем диапазоны всех игроков (кроме Hero), но ТОЛЬКО если у них выбрано действие
      state.sixMaxUsers.forEach((user, index) => {
        if (index !== state.sixMaxHeroIndex) {
          if (user.action === null) {
            user.range = [];
          } else {
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
              state.sixMaxBounty,
              state.sixMaxActiveRangeSetData // Передаем данные из БД если они есть
            );
          }
        }
      });
      saveSettingsToLocalStorage(state);
    },

    // 8-Max: Установить стадию турнира
    setEightMaxStage: (state, action: PayloadAction<TournamentStage>) => {
      state.eightMaxStage = action.payload;
      // Обновляем диапазоны всех игроков (кроме Hero), но ТОЛЬКО если у них выбрано действие
      state.eightMaxUsers.forEach((user, index) => {
        if (index !== state.eightMaxHeroIndex) {
          if (user.action === null) {
            user.range = [];
          } else {
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
              state.eightMaxBounty,
              state.eightMaxActiveRangeSetData // Передаем данные из БД если они есть
            );
          }
        }
      });
      saveSettingsToLocalStorage(state);
    },

    // 6-Max: Установить начальный стек
    setSixMaxStartingStack: (state, action: PayloadAction<number>) => {
      state.sixMaxStartingStack = action.payload;
      // Обновляем диапазоны всех игроков (кроме Hero), но ТОЛЬКО если у них выбрано действие
      state.sixMaxUsers.forEach((user, index) => {
        if (index !== state.sixMaxHeroIndex) {
          if (user.action === null) {
            user.range = [];
          } else {
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
              state.sixMaxBounty,
              state.sixMaxActiveRangeSetData // Передаем данные из БД если они есть
            );
          }
        }
      });
      saveSettingsToLocalStorage(state);
    },

    // 8-Max: Установить начальный стек
    setEightMaxStartingStack: (state, action: PayloadAction<number>) => {
      state.eightMaxStartingStack = action.payload;
      // Обновляем диапазоны всех игроков (кроме Hero), но ТОЛЬКО если у них выбрано действие
      state.eightMaxUsers.forEach((user, index) => {
        if (index !== state.eightMaxHeroIndex) {
          if (user.action === null) {
            user.range = [];
          } else {
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
              state.eightMaxBounty,
              state.eightMaxActiveRangeSetData // Передаем данные из БД если они есть
            );
          }
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

    // 6-Max: Установить активный набор диапазонов
    setSixMaxActiveRangeSet: (state, action: PayloadAction<{ id: number | null; name: string | null }>) => {
      state.sixMaxActiveRangeSetId = action.payload.id;
      state.sixMaxActiveRangeSetName = action.payload.name;
      // Если выбран дефолтный набор (id === null), очищаем данные
      if (action.payload.id === null) {
        state.sixMaxActiveRangeSetData = null;
      }
      saveSettingsToLocalStorage(state);
    },

    // 6-Max: Установить данные активного набора диапазонов
    setSixMaxActiveRangeSetData: (state, action: PayloadAction<RangeSetData | null>) => {
      if (action.payload === null) {
        console.log("🗑️ [Redux] Очистка данных диапазонов из БД (переключение на дефолтные)");
      } else {
        console.log("💾 [Redux] Сохранение данных диапазонов из БД");
        console.log("   Структура данных:", Object.keys(action.payload));
      }
      state.sixMaxActiveRangeSetData = action.payload;
      saveSettingsToLocalStorage(state);
    },

    // 8-Max: Установить активный набор диапазонов
    setEightMaxActiveRangeSet: (state, action: PayloadAction<{ id: number | null; name: string | null }>) => {
      state.eightMaxActiveRangeSetId = action.payload.id;
      state.eightMaxActiveRangeSetName = action.payload.name;
      // Если выбран дефолтный набор (id === null), очищаем данные
      if (action.payload.id === null) {
        state.eightMaxActiveRangeSetData = null;
      }
      saveSettingsToLocalStorage(state);
    },

    // 8-Max: Установить данные активного набора диапазонов
    setEightMaxActiveRangeSetData: (state, action: PayloadAction<RangeSetData | null>) => {
      state.eightMaxActiveRangeSetData = action.payload;
      saveSettingsToLocalStorage(state);
    },

    // Cash: Установить активный набор диапазонов
    setCashActiveRangeSet: (state, action: PayloadAction<{ id: number | null; name: string | null }>) => {
      state.cashActiveRangeSetId = action.payload.id;
      state.cashActiveRangeSetName = action.payload.name;
      // Если выбран дефолтный набор (id === null), очищаем данные
      if (action.payload.id === null) {
        state.cashActiveRangeSetData = null;
      }
      saveSettingsToLocalStorage(state);
    },

    // Cash: Установить данные активного набора диапазонов
    setCashActiveRangeSetData: (state, action: PayloadAction<RangeSetData | null>) => {
      state.cashActiveRangeSetData = action.payload;
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
  setSixMaxActiveRangeSet,
  setSixMaxActiveRangeSetData,
  setEightMaxActiveRangeSet,
  setEightMaxActiveRangeSetData,
  setCashActiveRangeSet,
  setCashActiveRangeSetData,
} = tableSlice.actions;
export default tableSlice.reducer;
