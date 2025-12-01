'use client';

import { useState } from 'react';
import { useAppSelector } from '@/lib/redux/hooks';
import type { Room } from '@/lib/redux/types/multiplayerTypes';
import CreateRoomForm from './CreateRoomForm';

interface MultiplayerLobbyProps {
  isConnected: boolean;
  onCreateRoom: (room: Room) => void;
  onJoinRoom: (roomId: string) => void;
  onDeleteRoom: (roomId: string) => void;
}

/**
 * Лобби мультиплеера - выбор создать комнату или присоединиться
 */
export default function MultiplayerLobby({
  isConnected,
  onCreateRoom,
  onJoinRoom,
  onDeleteRoom,
}: MultiplayerLobbyProps) {
  const availableRooms = useAppSelector((state) => state.multiplayer.availableRooms);
  const currentUserId = useAppSelector((state) => state.multiplayer.currentUserId);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Разделить комнаты на мои и чужие
  const myRooms = availableRooms.filter((room) => room.hostId === currentUserId);
  const otherRooms = availableRooms.filter((room) => room.hostId !== currentUserId);

  const handleJoinRoom = (roomId: string) => {
    // Всегда присоединяемся через WebSocket, чтобы сервер знал о нашем входе
    onJoinRoom(roomId);
  };

  // Если показываем форму создания
  if (showCreateForm) {
    return (
      <div>
        <button
          onClick={() => setShowCreateForm(false)}
          className="mb-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          ← Назад к лобби
        </button>
        <CreateRoomForm onCreateRoom={onCreateRoom} />
      </div>
    );
  }

  // Показываем лобби
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Игра с друзьями
          </h1>
          <p className="text-gray-400 text-lg mb-2">
            Создайте комнату или присоединитесь к существующей
          </p>
          {/* Индикатор подключения */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            ></div>
            <span className="text-sm text-gray-500">
              {isConnected ? 'Подключено к серверу' : 'Подключение...'}
            </span>
          </div>
        </div>

        {/* Кнопка создания комнаты */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full py-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold text-xl rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            ➕ Создать новую комнату
          </button>
        </div>

        {/* Мои комнаты */}
        {myRooms.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span>👑</span>
              Мои комнаты
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myRooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-gray-800 rounded-xl p-6 border-2 border-blue-600 hover:border-blue-500 transition-colors"
                >
                  {/* Заголовок комнаты */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-white font-bold text-xl mb-1">
                        {room.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm px-2 py-1 rounded ${
                            room.type === 'tournament'
                              ? 'bg-blue-600/20 text-blue-400'
                              : 'bg-green-600/20 text-green-400'
                          }`}
                        >
                          {room.type === 'tournament' ? '🏆 Турнир' : '💰 Кэш'}
                        </span>
                        <span
                          className={`text-sm px-2 py-1 rounded ${
                            room.status === 'waiting'
                              ? 'bg-yellow-600/20 text-yellow-400'
                              : room.status === 'playing'
                              ? 'bg-green-600/20 text-green-400'
                              : 'bg-gray-600/20 text-gray-400'
                          }`}
                        >
                          {room.status === 'waiting'
                            ? 'Ожидание'
                            : room.status === 'playing'
                            ? 'Идёт игра'
                            : 'Завершена'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Информация о комнате */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Создатель:</span>
                      <span className="text-white font-semibold">
                        {room.hostName || room.players.find((p) => p.isHost)?.name || 'Неизвестно'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Игроки:</span>
                      <span className="text-white font-semibold">
                        {room.players.length} / {room.maxPlayers}
                      </span>
                    </div>
                  </div>

                  {/* Кнопки управления комнатой */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleJoinRoom(room.id)}
                      className="flex-1 py-3 rounded-lg font-bold transition-all bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg hover:shadow-xl"
                    >
                      Войти
                    </button>
                    <button
                      onClick={() => onDeleteRoom(room.id)}
                      className="px-6 py-3 rounded-lg font-bold transition-all bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg hover:shadow-xl"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Разделитель */}
        {myRooms.length > 0 && otherRooms.length > 0 && (
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
          </div>
        )}

        {/* Доступные комнаты */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🎮</span>
            Доступные комнаты
          </h2>
          {otherRooms.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
              <div className="text-gray-500 text-6xl mb-4">🎲</div>
              <p className="text-gray-400 text-lg mb-2">
                Нет доступных комнат
              </p>
              <p className="text-gray-500 text-sm">
                Создайте первую комнату и пригласите друзей
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {otherRooms.map((room) => (
              <div
                key={room.id}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                {/* Заголовок комнаты */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-bold text-xl mb-1">
                      {room.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm px-2 py-1 rounded ${
                          room.type === 'tournament'
                            ? 'bg-blue-600/20 text-blue-400'
                            : 'bg-green-600/20 text-green-400'
                        }`}
                      >
                        {room.type === 'tournament' ? '🏆 Турнир' : '💰 Кэш'}
                      </span>
                      <span
                        className={`text-sm px-2 py-1 rounded ${
                          room.status === 'waiting'
                            ? 'bg-yellow-600/20 text-yellow-400'
                            : room.status === 'playing'
                            ? 'bg-green-600/20 text-green-400'
                            : 'bg-gray-600/20 text-gray-400'
                        }`}
                      >
                        {room.status === 'waiting'
                          ? 'Ожидание'
                          : room.status === 'playing'
                          ? 'Идёт игра'
                          : 'Завершена'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Информация о комнате */}
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Создатель:</span>
                    <span className="text-white font-semibold">
                      {room.hostName || room.players.find((p) => p.isHost)?.name || 'Неизвестно'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Игроки:</span>
                    <span className="text-white font-semibold">
                      {room.players.length} / {room.maxPlayers}
                    </span>
                  </div>
                </div>

                {/* Кнопка присоединения */}
                <button
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={
                    room.players.length >= room.maxPlayers ||
                    room.status === 'finished'
                  }
                  className={`w-full py-3 rounded-lg font-bold transition-all ${
                    room.players.length >= room.maxPlayers ||
                    room.status === 'finished'
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  {room.players.length >= room.maxPlayers
                    ? 'Комната заполнена'
                    : room.status === 'finished'
                    ? 'Игра завершена'
                    : 'Присоединиться'}
                </button>
              </div>
            ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
