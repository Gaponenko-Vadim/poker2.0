"use client";

import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import { setCurrentUser } from "@/lib/redux/slices/multiplayerSlice";
import { useMultiplayerWebSocket } from "@/lib/hooks/useMultiplayerWebSocket";
import Header from "@/components/Header";
import MultiplayerLobby from "@/components/MultiplayerLobby";
import MultiplayerTable from "@/components/MultiplayerTable";

/**
 * Страница мультиплеер режима - "Играть с друзьями"
 */
export default function MultiplayerPage() {
  const dispatch = useAppDispatch();
  const currentRoom = useAppSelector((state) => state.multiplayer.currentRoom);
  const currentUserId = useAppSelector((state) => state.multiplayer.currentUserId);
  const authUser = useAppSelector((state) => state.auth.user);

  // WebSocket подключение на уровне страницы (постоянное)
  const { isConnected, createRoom, joinRoom: joinRoomWS, leaveRoom, updateRoom, finishGame, deleteRoom, setOnGameFinished } = useMultiplayerWebSocket();

  // Инициализация пользователя при первой загрузке
  useEffect(() => {
    if (currentUserId) return; // Уже инициализирован

    // Попытаться загрузить из localStorage
    const savedUserId = localStorage.getItem('multiplayer_userId');
    const savedUserName = localStorage.getItem('multiplayer_userName');

    // Создать новый ID
    const userId = savedUserId || `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Определить имя пользователя
    let userName: string;
    if (authUser?.nickname) {
      // Если залогинен, всегда используем nickname из профиля
      userName = authUser.nickname;
    } else if (savedUserName && !savedUserName.startsWith('Игрок ')) {
      // Если не залогинен, но есть кастомное сохранённое имя
      userName = savedUserName;
    } else {
      // Запросить ник или использовать автогенерированный
      userName = prompt('Введите ваш ник для мультиплеера:') || `Игрок ${Math.floor(Math.random() * 1000)}`;
    }

    // Обновляем localStorage
    localStorage.setItem('multiplayer_userId', userId);
    localStorage.setItem('multiplayer_userName', userName);

    // Устанавливаем пользователя
    dispatch(setCurrentUser({ userId, userName }));
  }, [currentUserId, authUser, dispatch]);

  // Обновление имени при изменении nickname в профиле
  useEffect(() => {
    if (authUser?.nickname && currentUserId) {
      const savedUserName = localStorage.getItem('multiplayer_userName');

      // Если nickname изменился, обновляем
      if (savedUserName !== authUser.nickname) {
        localStorage.setItem('multiplayer_userName', authUser.nickname);
        dispatch(setCurrentUser({ userId: currentUserId, userName: authUser.nickname }));
      }
    }
  }, [authUser?.nickname, currentUserId, dispatch]);

  // Функция удаления комнаты из лобби
  const handleDeleteRoomFromLobby = (roomId: string) => {
    // Передаем roomId напрямую в deleteRoom
    deleteRoom(roomId);
  };

  // Если комнаты нет - показываем лобби (выбор: создать или присоединиться)
  if (!currentRoom) {
    return (
      <MultiplayerLobby
        isConnected={isConnected}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoomWS}
        onDeleteRoom={handleDeleteRoomFromLobby}
      />
    );
  }

  // Если комната создана - показываем стол (аналог 8-max)
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Шапка с названием комнаты */}
      <Header
        showBackButton
        backUrl="/"
        title={currentRoom.name}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Покерный стол (8-max) */}
        <MultiplayerTable
          onFinishGame={finishGame}
          onDeleteRoom={deleteRoom}
          onLeaveRoom={leaveRoom}
          onUpdateRoom={updateRoom}
          setOnGameFinished={setOnGameFinished}
        />
      </main>
    </div>
  );
}
