/**
 * Redux slice для Cash Multiplayer (Cash игра с друзьями)
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  CashMultiplayerState,
  CashRoom,
  CashMultiplayerPlayer,
  CashRoomSettings,
} from "../types/cashMultiplayerTypes";
import { generateUsers } from "../utils/tableUtils";
import {
  generateRoomId,
  generatePlayerId,
  getDefaultCashSettings,
  isSeatTaken,
  canStartGame,
  isValidMaxPlayers,
  findPlayerById,
} from "../utils/multiplayerUtils";

// Начальное состояние
const initialState: CashMultiplayerState = {
  currentRoom: null,
  availableRooms: [],
  currentUserId: null,
  currentUserName: null,
};

const cashMultiplayerSlice = createSlice({
  name: "cashMultiplayer",
  initialState,
  reducers: {
    /**
     * Установить текущего пользователя
     */
    setCurrentUser: (
      state,
      action: PayloadAction<{ userId: string; userName: string }>
    ) => {
      state.currentUserId = action.payload.userId;
      state.currentUserName = action.payload.userName;
    },

    /**
     * Создать комнату
     */
    createRoom: (
      state,
      action: PayloadAction<{
        roomName: string;
        maxPlayers?: number;
      }>
    ) => {
      const { roomName, maxPlayers = 6 } = action.payload;

      // Генерируем ID пользователя если его нет
      if (!state.currentUserId) {
        state.currentUserId = generatePlayerId();
      }
      if (!state.currentUserName) {
        state.currentUserName = "Игрок";
      }

      // Создаем игрока-хоста
      const hostPlayer: CashMultiplayerPlayer = {
        id: state.currentUserId,
        name: state.currentUserName,
        isHost: true,
        isReady: false,
        seatIndex: null,
      };

      // Создаем комнату
      const newRoom: CashRoom = {
        id: generateRoomId(),
        name: roomName,
        status: "waiting",
        hostId: state.currentUserId,
        hostName: state.currentUserName,
        players: [hostPlayer],
        maxPlayers,
        createdAt: Date.now(),
        settings: getDefaultCashSettings(),
      };

      // Устанавливаем как текущую комнату
      state.currentRoom = newRoom;

      // Добавляем в список доступных комнат
      state.availableRooms.push(newRoom);
    },

    /**
     * Присоединиться к комнате
     */
    joinRoom: (state, action: PayloadAction<{ roomId: string }>) => {
      const room = state.availableRooms.find(
        (r) => r.id === action.payload.roomId
      );

      if (!room) {
        console.error("Room not found");
        return;
      }

      if (room.players.length >= room.maxPlayers) {
        console.error("Room is full");
        return;
      }

      // Генерируем ID пользователя если его нет
      if (!state.currentUserId) {
        state.currentUserId = generatePlayerId();
      }
      if (!state.currentUserName) {
        state.currentUserName = `Игрок ${room.players.length + 1}`;
      }

      // Проверяем, является ли текущий пользователь оригинальным хостом комнаты
      const isOriginalHost = room.hostId === state.currentUserId;

      // Создаем игрока
      const newPlayer: CashMultiplayerPlayer = {
        id: state.currentUserId,
        name: state.currentUserName,
        isHost: isOriginalHost,
        isReady: false,
        seatIndex: null,
      };

      // Добавляем игрока в комнату
      room.players.push(newPlayer);

      // Устанавливаем как текущую комнату
      state.currentRoom = room;
    },

    /**
     * Покинуть комнату
     */
    leaveRoom: (state) => {
      if (!state.currentRoom || !state.currentUserId) {
        return;
      }

      const room = state.currentRoom;

      // Удаляем игрока из комнаты
      room.players = room.players.filter((p) => p.id !== state.currentUserId);

      // Очищаем текущую комнату
      state.currentRoom = null;
    },

    /**
     * Обновить настройки cash комнаты
     */
    updateSettings: (
      state,
      action: PayloadAction<Partial<CashRoomSettings>>
    ) => {
      if (!state.currentRoom) {
        return;
      }

      state.currentRoom.settings = {
        ...state.currentRoom.settings,
        ...action.payload,
      };
    },

    /**
     * Переключить готовность игрока
     */
    togglePlayerReady: (state) => {
      if (!state.currentRoom || !state.currentUserId) {
        return;
      }

      const player = findPlayerById(
        state.currentRoom.players,
        state.currentUserId
      );

      if (player) {
        player.isReady = !player.isReady;
      }
    },

    /**
     * Выбрать место за столом
     */
    selectSeat: (state, action: PayloadAction<{ seatIndex: number }>) => {
      if (!state.currentRoom || !state.currentUserId) {
        return;
      }

      const { seatIndex } = action.payload;

      // Проверяем, не занято ли место
      if (
        isSeatTaken(state.currentRoom.players, seatIndex, state.currentUserId)
      ) {
        console.error("Seat is already taken");
        return;
      }

      // Находим текущего игрока
      const player = findPlayerById(
        state.currentRoom.players,
        state.currentUserId
      );

      if (player) {
        player.seatIndex = seatIndex;
      }
    },

    /**
     * Изменить количество мест за столом (только для хоста)
     */
    updateMaxPlayers: (
      state,
      action: PayloadAction<{ maxPlayers: number }>
    ) => {
      if (!state.currentRoom) {
        return;
      }

      const { maxPlayers } = action.payload;

      // Валидация
      if (!isValidMaxPlayers(maxPlayers)) {
        console.error("maxPlayers должно быть от 2 до 9");
        return;
      }

      // Обновить количество мест
      state.currentRoom.maxPlayers = maxPlayers;

      // НЕ убираем игроков с их мест - они остаются на своих местах
      // Просто уменьшается количество свободных мест
    },

    /**
     * Начать игру
     */
    startGame: (state) => {
      if (!state.currentRoom || !state.currentUserId) {
        return;
      }

      const room = state.currentRoom;

      // Проверяем возможность старта игры
      const { canStart, reason } = canStartGame(room, state.currentUserId);
      if (!canStart) {
        console.error(reason);
        return;
      }

      // Генерируем игроков для стола (максимум 9)
      const tableUsers = generateUsers(Math.max(9, room.maxPlayers));

      // Заполняем места игроков
      room.players.forEach((player) => {
        if (player.seatIndex !== null) {
          tableUsers[player.seatIndex] = {
            ...tableUsers[player.seatIndex],
            name: player.name,
          };
          player.user = tableUsers[player.seatIndex];
        }
      });

      // Меняем статус комнаты
      room.status = "playing";
    },

    /**
     * Завершить игру
     */
    endGame: (state) => {
      if (!state.currentRoom) {
        return;
      }

      state.currentRoom.status = "finished";
    },

    /**
     * Сбросить комнату (вернуться в лобби)
     */
    resetRoom: (state) => {
      if (!state.currentRoom) {
        return;
      }

      // Сбрасываем готовность игроков
      state.currentRoom.players.forEach((p) => {
        p.isReady = false;
        p.user = undefined;
      });

      // Возвращаем статус в ожидание
      state.currentRoom.status = "waiting";
    },

    /**
     * Установить список доступных комнат (от WebSocket сервера)
     */
    setAvailableRooms: (state, action: PayloadAction<CashRoom[]>) => {
      state.availableRooms = action.payload;
    },

    /**
     * Установить текущую комнату (от WebSocket сервера)
     */
    setCurrentRoom: (state, action: PayloadAction<CashRoom>) => {
      state.currentRoom = action.payload;
    },

    /**
     * Очистить текущую комнату
     */
    clearCurrentRoom: (state) => {
      state.currentRoom = null;
    },
  },
});

export const {
  setCurrentUser,
  createRoom,
  joinRoom,
  leaveRoom,
  updateSettings,
  togglePlayerReady,
  selectSeat,
  updateMaxPlayers,
  startGame,
  endGame,
  resetRoom,
  setAvailableRooms,
  setCurrentRoom,
  clearCurrentRoom,
} = cashMultiplayerSlice.actions;

export default cashMultiplayerSlice.reducer;
