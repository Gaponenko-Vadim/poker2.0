/**
 * Утилиты для Multiplayer режима
 */

import type {
  TournamentRoomSettings,
  CashRoomSettings,
  MultiplayerPlayer,
  Room,
} from "../types/multiplayerTypes";

/**
 * Генерация уникального ID комнаты
 */
export function generateRoomId(): string {
  return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Генерация уникального ID игрока (временный, если нет auth)
 */
export function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Дефолтные настройки для турнира
 */
export function getDefaultTournamentSettings(): TournamentRoomSettings {
  return {
    stage: "early",
    category: "micro",
    startingStack: 100,
    bounty: false,
    activeRangeSetId: null,
    activeRangeSetName: null,
    activeRangeSetData: null,
  };
}

/**
 * Дефолтные настройки для cash
 */
export function getDefaultCashSettings(): CashRoomSettings {
  return {
    smallBlind: 0.5,
    bigBlind: 1,
    minBuyIn: 40,
    maxBuyIn: 200,
    activeRangeSetId: null,
    activeRangeSetName: null,
    activeRangeSetData: null,
  };
}

/**
 * Проверка, является ли место занятым
 */
export function isSeatTaken(
  players: MultiplayerPlayer[],
  seatIndex: number,
  excludePlayerId?: string
): boolean {
  return players.some(
    (p) => p.seatIndex === seatIndex && p.id !== excludePlayerId
  );
}

/**
 * Проверка, можно ли начать игру
 */
export function canStartGame(room: Room, currentUserId: string): {
  canStart: boolean;
  reason?: string;
} {
  // Проверяем, что текущий игрок - хост
  if (room.hostId !== currentUserId) {
    return { canStart: false, reason: "Only host can start the game" };
  }

  // Проверяем, что есть хотя бы 2 игрока
  if (room.players.length < 2) {
    return { canStart: false, reason: "Need at least 2 players to start" };
  }

  // Проверяем, что все игроки готовы
  const allReady = room.players.every((p) => p.isReady || p.isHost);
  if (!allReady) {
    return { canStart: false, reason: "Not all players are ready" };
  }

  // Проверяем, что у всех игроков выбраны места
  const allSeated = room.players.every((p) => p.seatIndex !== null);
  if (!allSeated) {
    return { canStart: false, reason: "Not all players have selected seats" };
  }

  return { canStart: true };
}

/**
 * Проверка валидности количества мест
 */
export function isValidMaxPlayers(maxPlayers: number): boolean {
  return maxPlayers >= 2 && maxPlayers <= 9;
}

/**
 * Получить количество занятых мест
 */
export function getOccupiedSeatsCount(players: MultiplayerPlayer[]): number {
  return players.filter((p) => p.seatIndex !== null).length;
}

/**
 * Проверка, является ли комната полной
 */
export function isRoomFull(room: Room): boolean {
  return room.players.length >= room.maxPlayers;
}

/**
 * Найти игрока по ID
 */
export function findPlayerById(
  players: MultiplayerPlayer[],
  playerId: string
): MultiplayerPlayer | undefined {
  return players.find((p) => p.id === playerId);
}

/**
 * Проверка, является ли игрок хостом комнаты
 */
export function isPlayerHost(room: Room, playerId: string): boolean {
  return room.hostId === playerId;
}
