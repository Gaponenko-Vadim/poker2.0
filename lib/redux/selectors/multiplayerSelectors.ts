/**
 * Селекторы для Multiplayer режима
 * Используются для вычисления производных данных из state
 */

import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type { MultiplayerPlayer } from "../types/multiplayerTypes";
import {
  isPlayerHost,
  getOccupiedSeatsCount,
  canStartGame,
} from "../utils/multiplayerUtils";

// Базовые селекторы
export const selectCurrentRoom = (state: RootState) =>
  state.multiplayer.currentRoom;

export const selectAvailableRooms = (state: RootState) =>
  state.multiplayer.availableRooms;

export const selectCurrentUserId = (state: RootState) =>
  state.multiplayer.currentUserId;

export const selectCurrentUserName = (state: RootState) =>
  state.multiplayer.currentUserName;

// Мемоизированные селекторы

/**
 * Проверка, является ли текущий пользователь хостом
 */
export const selectIsCurrentUserHost = createSelector(
  [selectCurrentRoom, selectCurrentUserId],
  (currentRoom, currentUserId) => {
    if (!currentRoom || !currentUserId) return false;
    return isPlayerHost(currentRoom, currentUserId);
  }
);

/**
 * Получить текущего игрока
 */
export const selectCurrentPlayer = createSelector(
  [selectCurrentRoom, selectCurrentUserId],
  (currentRoom, currentUserId): MultiplayerPlayer | undefined => {
    if (!currentRoom || !currentUserId) return undefined;
    return currentRoom.players.find((p) => p.id === currentUserId);
  }
);

/**
 * Проверка, занял ли текущий пользователь место
 */
export const selectHasSelectedSeat = createSelector(
  [selectCurrentPlayer],
  (currentPlayer) => {
    return currentPlayer?.seatIndex !== null;
  }
);

/**
 * Получить количество занятых мест
 */
export const selectOccupiedSeatsCount = createSelector(
  [selectCurrentRoom],
  (currentRoom) => {
    if (!currentRoom) return 0;
    return getOccupiedSeatsCount(currentRoom.players);
  }
);

/**
 * Проверка, можно ли начать игру
 */
export const selectCanStartGame = createSelector(
  [selectCurrentRoom, selectCurrentUserId],
  (currentRoom, currentUserId) => {
    if (!currentRoom || !currentUserId) {
      return { canStart: false, reason: "No room or user" };
    }
    return canStartGame(currentRoom, currentUserId);
  }
);

/**
 * Получить список игроков текущей комнаты
 */
export const selectCurrentRoomPlayers = createSelector(
  [selectCurrentRoom],
  (currentRoom) => {
    return currentRoom?.players ?? [];
  }
);

/**
 * Получить настройки текущей комнаты
 */
export const selectCurrentRoomSettings = createSelector(
  [selectCurrentRoom],
  (currentRoom) => {
    return currentRoom?.settings;
  }
);

/**
 * Проверка, все ли игроки готовы
 */
export const selectAllPlayersReady = createSelector(
  [selectCurrentRoomPlayers],
  (players) => {
    if (players.length === 0) return false;
    return players.every((p) => p.isReady || p.isHost);
  }
);

/**
 * Проверка, все ли игроки заняли места
 */
export const selectAllPlayersSeated = createSelector(
  [selectCurrentRoomPlayers],
  (players) => {
    if (players.length === 0) return false;
    return players.every((p) => p.seatIndex !== null);
  }
);

/**
 * Получить количество игроков в текущей комнате
 */
export const selectCurrentRoomPlayersCount = createSelector(
  [selectCurrentRoomPlayers],
  (players) => players.length
);

/**
 * Проверка, полная ли комната
 */
export const selectIsCurrentRoomFull = createSelector(
  [selectCurrentRoom],
  (currentRoom) => {
    if (!currentRoom) return false;
    return currentRoom.players.length >= currentRoom.maxPlayers;
  }
);
