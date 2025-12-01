/**
 * TypeScript типы для Cash Multiplayer
 */

import type { User, RangeSetData } from "./tableTypes";

// Статус комнаты
export type RoomStatus = "waiting" | "playing" | "finished";

// Игрок в cash multiplayer комнате
export interface CashMultiplayerPlayer {
  id: string; // Уникальный ID игрока (из auth или временный)
  name: string; // Имя игрока
  isHost: boolean; // Создатель комнаты
  isReady: boolean; // Готов к игре
  seatIndex: number | null; // Место за столом (0-8) или null если не выбрано
  user?: User; // Данные игрока за столом (когда игра началась)
}

// Настройки cash комнаты
export interface CashRoomSettings {
  smallBlind: number;
  bigBlind: number;
  minBuyIn: number;
  maxBuyIn: number;
  activeRangeSetId: number | null;
  activeRangeSetName: string | null;
  activeRangeSetData: RangeSetData | null;
}

// Cash комната
export interface CashRoom {
  id: string; // Уникальный ID комнаты
  name: string; // Название комнаты
  status: RoomStatus; // Статус комнаты
  hostId: string; // ID создателя комнаты
  hostName: string; // Имя создателя комнаты
  players: CashMultiplayerPlayer[]; // Игроки в комнате
  maxPlayers: number; // Максимум игроков (2-9 для cash)
  createdAt: number; // Timestamp создания
  settings: CashRoomSettings; // Настройки cash игры
}

// Cash Multiplayer state
export interface CashMultiplayerState {
  // Текущая комната (если игрок в комнате)
  currentRoom: CashRoom | null;

  // Доступные комнаты (для списка)
  availableRooms: CashRoom[];

  // ID текущего пользователя
  currentUserId: string | null;

  // Имя текущего пользователя
  currentUserName: string | null;
}
