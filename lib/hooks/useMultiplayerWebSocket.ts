import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  setAvailableRooms,
  setCurrentRoom,
  clearCurrentRoom,
  createRoom as createRoomAction,
  joinRoom as joinRoomAction,
  leaveRoom as leaveRoomAction,
} from '../redux/slices/multiplayerSlice';
import type { Room, MultiplayerPlayer } from '../redux/types/multiplayerTypes';

// Колбэк для показа попапа завершения игры
let onGameFinishedCallback: (() => void) | null = null;

const WS_URL = 'ws://localhost:8080';

interface WSMessage {
  type: string;
  payload?: Record<string, unknown>;
}

// Глобальное хранилище для одного WebSocket соединения
let globalWS: WebSocket | null = null;
let globalReconnectTimeout: NodeJS.Timeout | null = null;

/**
 * Хук для работы с WebSocket подключением мультиплеера
 */
export function useMultiplayerWebSocket() {
  const dispatch = useAppDispatch();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const mountedRef = useRef(true);

  const currentUserId = useAppSelector((state) => state.multiplayer.currentUserId);
  const currentUserName = useAppSelector((state) => state.multiplayer.currentUserName);
  const currentRoom = useAppSelector((state) => state.multiplayer.currentRoom);

  // Отправить сообщение на сервер
  const sendMessage = (message: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket не подключен');
    }
  };

  // Подключение к WebSocket
  const connect = () => {
    // Использовать глобальное соединение если оно активно
    if (globalWS && (globalWS.readyState === WebSocket.OPEN || globalWS.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket уже подключен (глобально)');
      wsRef.current = globalWS;
      if (globalWS.readyState === WebSocket.OPEN) {
        setIsConnected(true);
      }
      return;
    }

    // Закрыть старое глобальное соединение если оно есть
    if (globalWS) {
      globalWS.close();
      globalWS = null;
    }

    console.log('🔌 Подключение к WebSocket серверу...');
    const ws = new WebSocket(WS_URL);
    globalWS = ws;
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket подключен');
      setIsConnected(true);

      // Зарегистрировать пользователя на сервере (используем прямой ws.send)
      if (currentUserId && currentUserName) {
        ws.send(JSON.stringify({
          type: 'register',
          payload: {
            userId: currentUserId,
            userName: currentUserName,
          },
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        console.log('📨 WebSocket сообщение:', message.type);

        switch (message.type) {
          case 'rooms_list':
            // Обновить список доступных комнат
            {
              const { rooms } = message.payload as { rooms: Room[] };
              dispatch(setAvailableRooms(rooms));
            }
            break;

          case 'room_created':
            // Комната создана
            {
              const { room } = message.payload as { room: Room };
              dispatch(setCurrentRoom(room));
            }
            break;

          case 'joined_room':
            // Присоединились к комнате
            {
              const { room } = message.payload as { room: Room };
              dispatch(setCurrentRoom(room));
            }
            break;

          case 'room_updated':
            // Комната обновлена
            {
              const { room } = message.payload as { room: Room };
              console.log('📥 Получено обновление комнаты:', room.name, 'игроков:', room.players.length);
              // Обновить комнату (сервер отправляет только игрокам в этой комнате)
              dispatch(setCurrentRoom(room));
            }
            break;

          case 'game_finished':
            // Игра завершена - показать попап
            {
              console.log('🏁 Получено уведомление о завершении игры');
              // Вызвать колбэк для показа попапа
              if (onGameFinishedCallback) {
                onGameFinishedCallback();
              }
            }
            break;

          case 'room_deleted':
            // Комната удалена
            {
              const { roomId } = message.payload as { roomId: string };
              // Если мы были в этой комнате - вернуться в лобби
              if (currentRoom?.id === roomId) {
                dispatch(clearCurrentRoom());
                console.log('🚪 Комната удалена, возврат в лобби');
              }
            }
            break;

          case 'error':
            {
              const { message: errorMessage } = message.payload as { message: string };
              console.error('❌ Ошибка от сервера:', errorMessage);
              alert(errorMessage);
            }
            break;

          default:
            console.log('⚠️ Неизвестный тип сообщения:', message.type);
        }
      } catch (error) {
        console.error('❌ Ошибка обработки WebSocket сообщения:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket ошибка:', error);
      console.error('WebSocket состояние:', ws.readyState);
    };

    ws.onclose = (event) => {
      console.log('❌ WebSocket отключен. Код:', event.code, 'Причина:', event.reason);

      if (mountedRef.current) {
        setIsConnected(false);
      }

      wsRef.current = null;
      if (globalWS === ws) {
        globalWS = null;
      }

      // Переподключение через 3 секунды (только если не было нормального закрытия и компонент смонтирован)
      if (event.code !== 1000 && mountedRef.current) {
        if (globalReconnectTimeout) {
          clearTimeout(globalReconnectTimeout);
        }

        globalReconnectTimeout = setTimeout(() => {
          console.log('🔄 Переподключение к WebSocket...');
          if (mountedRef.current) {
            connect();
          }
        }, 3000);

        reconnectTimeoutRef.current = globalReconnectTimeout;
      }
    };
  };

  // Создать комнату
  const createRoom = useCallback(
    (room: Room) => {
      // НЕ создаем локально, только отправляем на сервер
      // Сервер создаст комнату и вернет room_created, который установит currentRoom
      sendMessage({
        type: 'create_room',
        payload: room as unknown as Record<string, unknown>,
      });
    },
    []
  );

  // Присоединиться к комнате
  const joinRoom = useCallback(
    (roomId: string) => {
      if (!currentUserId || !currentUserName) {
        console.error('Пользователь не зарегистрирован');
        return;
      }

      const player: MultiplayerPlayer = {
        id: currentUserId,
        name: currentUserName,
        isHost: false,
        isReady: false,
        seatIndex: null,
      };

      sendMessage({
        type: 'join_room',
        payload: { roomId, player },
      });
    },
    [currentUserId, currentUserName]
  );

  // Покинуть комнату
  const leaveRoom = useCallback(() => {
    if (currentRoom && currentUserId) {
      sendMessage({
        type: 'leave_room',
        payload: { roomId: currentRoom.id, userId: currentUserId },
      });

      // Очистить локально
      dispatch(leaveRoomAction());
    }
  }, [currentRoom, currentUserId, dispatch]);

  // Обновить состояние комнаты
  const updateRoom = useCallback((room: Room) => {
    sendMessage({
      type: 'update_room',
      payload: room as unknown as Record<string, unknown>,
    });
  }, []);

  // Завершить игру (показать попап всем)
  const finishGame = useCallback(() => {
    if (currentRoom) {
      sendMessage({
        type: 'game_finished',
        payload: { roomId: currentRoom.id },
      });
    }
  }, [currentRoom]);

  // Удалить комнату
  const deleteRoom = useCallback((roomId?: string) => {
    const targetRoomId = roomId || currentRoom?.id;
    if (targetRoomId) {
      sendMessage({
        type: 'delete_room',
        payload: { roomId: targetRoomId },
      });
    }
  }, [currentRoom]);

  // Установить колбэк для попапа завершения
  const setOnGameFinished = useCallback((callback: () => void) => {
    onGameFinishedCallback = callback;
  }, []);

  // Подключение при монтировании
  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      // Отключение при размонтировании
      mountedRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (globalReconnectTimeout) {
        clearTimeout(globalReconnectTimeout);
        globalReconnectTimeout = null;
      }

      // НЕ закрываем глобальное соединение - оно может использоваться другими экземплярами
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Регистрация пользователя при изменении userId/userName
  useEffect(() => {
    // Отправить регистрацию если WebSocket открыт и данные пользователя установлены
    if (isConnected && currentUserId && currentUserName && wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('📝 Регистрация пользователя:', currentUserName, currentUserId);
      wsRef.current.send(JSON.stringify({
        type: 'register',
        payload: {
          userId: currentUserId,
          userName: currentUserName,
        },
      }));
    }
  }, [isConnected, currentUserId, currentUserName]);

  return {
    isConnected,
    createRoom,
    joinRoom,
    leaveRoom,
    updateRoom,
    finishGame,
    deleteRoom,
    setOnGameFinished,
  };
}
