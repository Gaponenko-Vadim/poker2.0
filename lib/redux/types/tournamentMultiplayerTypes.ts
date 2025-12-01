/**
 * TypeScript типы для Tournament Multiplayer
 */

import type {
  User,
  TournamentStage,
  TournamentCategory,
  RangeSetData,
} from "./tableTypes";

// Статус комнаты
export type RoomStatus = "waiting" | "playing" | "finished";

// Игрок в tournament multiplayer комнате
export interface TournamentMultiplayerPlayer {
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

// Турнирная комната
export interface TournamentRoom {
  id: string; // Уникальный ID комнаты
  name: string; // Название комнаты
  status: RoomStatus; // Статус комнаты
  hostId: string; // ID создателя комнаты
  hostName: string; // Имя создателя комнаты
  players: TournamentMultiplayerPlayer[]; // Игроки в комнате
  maxPlayers: number; // Максимум игроков (обычно 8)
  createdAt: number; // Timestamp создания
  settings: TournamentRoomSettings; // Настройки турнира
}

// Tournament Multiplayer state
export interface TournamentMultiplayerState {
  // Текущая комната (если игрок в комнате)
  currentRoom: TournamentRoom | null;

  // Доступные комнаты (для списка)
  availableRooms: TournamentRoom[];

  // ID текущего пользователя
  currentUserId: string | null;

  // Имя текущего пользователя
  currentUserName: string | null;
}
