/**
 * Redux slice для Multiplayer (Игра с друзьями)
 * Рефакторинг: вынесены утилиты в отдельный файл для улучшения читаемости
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  MultiplayerState,
  Room,
  RoomType,
  MultiplayerPlayer,
  TournamentRoomSettings,
  CashRoomSettings,
} from "../types/multiplayerTypes";
import { generateUsers } from "../utils/tableUtils";
import {
  generateRoomId,
  generatePlayerId,
  getDefaultTournamentSettings,
  getDefaultCashSettings,
  isSeatTaken,
  canStartGame,
  isValidMaxPlayers,
  findPlayerById,
} from "../utils/multiplayerUtils";

// Начальное состояние
const initialState: MultiplayerState = {
  currentRoom: null,
  availableRooms: [],
  currentUserId: null,
  currentUserName: null,
};

const multiplayerSlice = createSlice({
  name: "multiplayer",
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
        roomType: RoomType;
        maxPlayers?: number;
      }>
    ) => {
      const { roomName, roomType, maxPlayers = 8 } = action.payload;

      // Генерируем ID пользователя если его нет
      if (!state.currentUserId) {
        state.currentUserId = generatePlayerId();
      }
      if (!state.currentUserName) {
        state.currentUserName = "Игрок";
      }

      // Создаем игрока-хоста
      const hostPlayer: MultiplayerPlayer = {
        id: state.currentUserId,
        name: state.currentUserName,
        isHost: true,
        isReady: false,
        seatIndex: null,
      };

      // Создаем комнату
      const newRoom: Room = {
        id: generateRoomId(),
        name: roomName,
        type: roomType,
        status: "waiting",
        hostId: state.currentUserId,
        hostName: state.currentUserName,
        players: [hostPlayer],
        maxPlayers,
        createdAt: Date.now(),
        settings:
          roomType === "tournament"
            ? getDefaultTournamentSettings()
            : getDefaultCashSettings(),
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
      const newPlayer: MultiplayerPlayer = {
        id: state.currentUserId,
        name: state.currentUserName,
        isHost: isOriginalHost, // Хост только если это оригинальный создатель комнаты
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

      // Хост комнаты не меняется, даже если он вышел
      // room.hostId остается неизменным

      // Комната остается в списке, даже если в ней 0 игроков
      // Удалять комнату можно только вручную через deleteRoom

      // Очищаем текущую комнату
      state.currentRoom = null;
    },

    /**
     * Обновить настройки турнирной комнаты
     */
    updateTournamentSettings: (
      state,
      action: PayloadAction<Partial<TournamentRoomSettings>>
    ) => {
      if (!state.currentRoom || state.currentRoom.type !== "tournament") {
        return;
      }

      state.currentRoom.settings = {
        ...state.currentRoom.settings,
        ...action.payload,
      } as TournamentRoomSettings;
    },

    /**
     * Обновить настройки cash комнаты
     */
    updateCashSettings: (
      state,
      action: PayloadAction<Partial<CashRoomSettings>>
    ) => {
      if (!state.currentRoom || state.currentRoom.type !== "cash") {
        return;
      }

      state.currentRoom.settings = {
        ...state.currentRoom.settings,
        ...action.payload,
      } as CashRoomSettings;
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

      // Генерируем игроков для стола (8-max)
      const tableUsers = generateUsers(8);

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
    setAvailableRooms: (state, action: PayloadAction<Room[]>) => {
      state.availableRooms = action.payload;
    },

    /**
     * Установить текущую комнату (от WebSocket сервера)
     */
    setCurrentRoom: (state, action: PayloadAction<Room>) => {
      state.currentRoom = action.payload;
    },

    /**
     * Изменить количество мест за столом
     * (только для cash-режима и только хостом)
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
  updateTournamentSettings,
  updateCashSettings,
  togglePlayerReady,
  selectSeat,
  startGame,
  endGame,
  resetRoom,
  setAvailableRooms,
  setCurrentRoom,
  updateMaxPlayers,
  clearCurrentRoom,
} = multiplayerSlice.actions;

export default multiplayerSlice.reducer;
