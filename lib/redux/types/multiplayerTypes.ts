/**
 * TypeScript типы для Multiplayer (Игра с друзьями)
 */

import type {
  User,
  TournamentStage,
  TournamentCategory,
  RangeSetData,
} from "./tableTypes";

// Тип комнаты
export type RoomType = "tournament" | "cash";

// Статус комнаты
export type RoomStatus = "waiting" | "playing" | "finished";

// Игрок в multiplayer комнате
export interface MultiplayerPlayer {
  id: string; // Уникальный ID игрока (из auth или временный)
  name: string; // Имя игрока
  isHost: boolean; // Создатель комнаты
  isReady: boolean; // Готов к игре
  seatIndex: number | null; // Место за столом (0-7) или null если не выбрано
  user?: User; // Данные игрока за столом (когда игра началась)
}

// Настройки турнирной комнаты
export interface TournamentRoomSettings {
  stage: TournamentStage;
  category: TournamentCategory;
  startingStack: number;
  bounty: boolean;
  activeRangeSetId: number | null;
  activeRangeSetName: string | null;
  activeRangeSetData: RangeSetData | null;
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

// Комната
export interface Room {
  id: string; // Уникальный ID комнаты
  name: string; // Название комнаты
  type: RoomType; // Тип: tournament или cash
  status: RoomStatus; // Статус комнаты
  hostId: string; // ID создателя комнаты
  hostName: string; // Имя создателя комнаты
  players: MultiplayerPlayer[]; // Игроки в комнате
  maxPlayers: number; // Максимум игроков (обычно 8)
  createdAt: number; // Timestamp создания
  settings: TournamentRoomSettings | CashRoomSettings; // Настройки в зависимости от типа
}

// Multiplayer state
export interface MultiplayerState {
  // Текущая комната (если игрок в комнате)
  currentRoom: Room | null;

  // Доступные комнаты (для списка)
  availableRooms: Room[];

  // ID текущего пользователя
  currentUserId: string | null;

  // Имя текущего пользователя
  currentUserName: string | null;
}
