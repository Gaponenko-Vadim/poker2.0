'use client';

import { useState } from 'react';
import { useAppSelector } from '@/lib/redux/hooks';
import type { RoomType, Room } from '@/lib/redux/types/multiplayerTypes';

interface CreateRoomFormProps {
  onCreateRoom: (room: Room) => void;
}

export default function CreateRoomForm({ onCreateRoom }: CreateRoomFormProps) {
  const currentUserId = useAppSelector((state) => state.multiplayer.currentUserId);
  const currentUserName = useAppSelector((state) => state.multiplayer.currentUserName);

  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<RoomType>('tournament');
  const [maxPlayers, setMaxPlayers] = useState(6); // Количество мест за столом

  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      alert('Введите название комнаты');
      return;
    }

    if (!currentUserId || !currentUserName) {
      alert('Ошибка: пользователь не инициализирован');
      return;
    }

    // Генерация ID комнаты
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Создание комнаты
    const newRoom: Room = {
      id: roomId,
      name: roomName.trim(),
      type: roomType,
      status: 'waiting',
      hostId: currentUserId,
      hostName: currentUserName,
      players: [
        {
          id: currentUserId,
          name: currentUserName,
          isHost: true,
          isReady: false,
          seatIndex: null,
        },
      ],
      maxPlayers: maxPlayers,
      createdAt: Date.now(),
      settings:
        roomType === 'tournament'
          ? {
              stage: 'early',
              category: 'micro',
              startingStack: 100,
              bounty: false,
              activeRangeSetId: null,
              activeRangeSetName: null,
              activeRangeSetData: null,
            }
          : {
              smallBlind: 0.5,
              bigBlind: 1,
              minBuyIn: 40,
              maxBuyIn: 200,
              activeRangeSetId: null,
              activeRangeSetName: null,
              activeRangeSetData: null,
            },
    };

    onCreateRoom(newRoom);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Игра с друзьями
          </h1>
          <p className="text-gray-400 text-lg">
            Создайте комнату и пригласите друзей
          </p>
        </div>

        {/* Форма создания комнаты */}
        <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
          {/* Название комнаты */}
          <div className="mb-8">
            <label className="block text-white text-lg font-semibold mb-3">
              Название комнаты
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Введите название комнаты"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              maxLength={50}
            />
          </div>

          {/* Тип игры */}
          <div className="mb-8">
            <label className="block text-white text-lg font-semibold mb-4">
              Тип игры
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Турнир */}
              <button
                onClick={() => setRoomType('tournament')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  roomType === 'tournament'
                    ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/50'
                    : 'bg-gray-900 border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">🏆</div>
                  <div className="text-white font-bold text-lg mb-1">
                    Турнир
                  </div>
                  <div className="text-gray-400 text-sm">
                    Играйте до победителя
                  </div>
                </div>
              </button>

              {/* Кэш */}
              <button
                onClick={() => setRoomType('cash')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  roomType === 'cash'
                    ? 'bg-green-600 border-green-500 shadow-lg shadow-green-500/50'
                    : 'bg-gray-900 border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">💰</div>
                  <div className="text-white font-bold text-lg mb-1">Кэш</div>
                  <div className="text-gray-400 text-sm">
                    Свободная игра
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Количество мест за столом */}
          <div className="mb-8">
            <label className="block text-white text-lg font-semibold mb-4">
              Количество мест за столом
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[2, 3, 4, 5, 6, 7, 8, 9].map((seats) => (
                <button
                  key={seats}
                  onClick={() => setMaxPlayers(seats)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    maxPlayers === seats
                      ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/50'
                      : 'bg-gray-900 border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-white font-bold text-2xl mb-1">
                      {seats}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {seats === 2 ? 'HU' : `${seats}-max`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Описание выбранного типа */}
          <div className="mb-8 p-4 bg-gray-900 rounded-lg border border-gray-700">
            {roomType === 'tournament' ? (
              <div>
                <h3 className="text-white font-semibold mb-2">
                  О турнирном режиме:
                </h3>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li>• Все начинают с одинаковым стеком</li>
                  <li>• Блайнды увеличиваются со временем</li>
                  <li>• Игра до последнего игрока</li>
                  <li>• Можно настроить стадии турнира</li>
                </ul>
              </div>
            ) : (
              <div>
                <h3 className="text-white font-semibold mb-2">
                  О кэш режиме:
                </h3>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li>• Постоянные блайнды</li>
                  <li>• Можно докупать фишки</li>
                  <li>• Играйте столько, сколько хотите</li>
                  <li>• Выходите в любой момент</li>
                </ul>
              </div>
            )}
          </div>

          {/* Кнопка создания */}
          <button
            onClick={handleCreateRoom}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold text-lg rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            Создать комнату
          </button>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            После создания комнаты вы сможете настроить параметры игры и
            пригласить друзей
          </p>
        </div>
      </div>
    </div>
  );
}
