import { WebSocketServer, WebSocket } from 'ws';
import { Room, MultiplayerPlayer } from '../lib/redux/types/multiplayerTypes';

interface Client {
  ws: WebSocket;
  userId: string;
  userName: string;
  roomId: string | null;
}

interface WSMessage {
  type: string;
  payload?: Record<string, unknown>;
}

const PORT = 8080;
const clients: Map<string, Client> = new Map();
const rooms: Map<string, Room> = new Map();

const wss = new WebSocketServer({ port: PORT });

console.log(`🚀 WebSocket сервер запущен на порту ${PORT}`);

// Broadcast сообщение всем клиентам в комнате
function broadcastToRoom(roomId: string, message: WSMessage, excludeUserId?: string) {
  let sentCount = 0;
  let totalInRoom = 0;

  clients.forEach((client) => {
    if (client.roomId === roomId && client.userId !== excludeUserId) {
      totalInRoom++;
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
        sentCount++;
      }
    }
  });

  console.log(`📤 Сообщение ${message.type} отправлено ${sentCount}/${totalInRoom} игрокам в комнате ${roomId}`);
}

// Отправить список доступных комнат всем клиентам
function broadcastRoomsList() {
  const roomsList = Array.from(rooms.values());
  const message: WSMessage = {
    type: 'rooms_list',
    payload: { rooms: roomsList },
  };

  console.log(`📡 Отправка списка комнат (${roomsList.length} комнат) клиентам (${clients.size} подключений)`);

  let sentCount = 0;
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
      sentCount++;
    }
  });

  console.log(`✉️ Список комнат отправлен ${sentCount} клиентам`);
}

wss.on('connection', (ws: WebSocket) => {
  console.log('✅ Новое подключение');

  let currentClient: Client | null = null;

  ws.on('message', (data: Buffer) => {
    try {
      const message: WSMessage = JSON.parse(data.toString());
      console.log('📨 Получено сообщение:', message.type);

      switch (message.type) {
        case 'register':
          // Регистрация клиента
          {
            const { userId, userName } = message.payload as { userId: string; userName: string };
            currentClient = {
              ws,
              userId,
              userName,
              roomId: null,
            };
            clients.set(userId, currentClient);
            console.log(`👤 Зарегистрирован пользователь: ${userName} (${userId})`);

            // Отправить список комнат новому клиенту
            const roomsList = Array.from(rooms.values());
            ws.send(JSON.stringify({
              type: 'rooms_list',
              payload: { rooms: roomsList },
            }));
          }
          break;

        case 'create_room':
          // Создание комнаты
          {
            const room = message.payload as unknown as Room;
            rooms.set(room.id, room);
            console.log(`🏠 Создана комната: ${room.name} (${room.id})`);

            if (currentClient) {
              currentClient.roomId = room.id;
              console.log(`  → Хост ${currentClient.userName} (${currentClient.userId}) установлен в комнату ${room.id}`);
            }

            // Уведомить всех о новой комнате
            broadcastRoomsList();

            // Подтвердить создателю
            ws.send(JSON.stringify({
              type: 'room_created',
              payload: { room },
            }));
          }
          break;

        case 'join_room':
          // Присоединение к комнате
          {
            const { roomId, player } = message.payload as { roomId: string; player: MultiplayerPlayer };
            const room = rooms.get(roomId);

            if (!room) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Комната не найдена' },
              }));
              return;
            }

            if (room.players.length >= room.maxPlayers) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Комната заполнена' },
              }));
              return;
            }

            // Проверить, является ли игрок оригинальным хостом комнаты
            if (player.id === room.hostId) {
              player.isHost = true;
              console.log(`👑 Хост ${player.name} вернулся в комнату ${room.name}`);
            } else {
              player.isHost = false;
            }

            // Добавить игрока в комнату
            room.players.push(player);
            rooms.set(roomId, room);

            if (currentClient) {
              currentClient.roomId = roomId;
            }

            console.log(`👥 Игрок ${player.name} присоединился к комнате ${room.name} (всего игроков: ${room.players.length})`);

            // Уведомить всех в комнате об обновлении
            broadcastToRoom(roomId, {
              type: 'room_updated',
              payload: { room },
            });

            // Подтвердить присоединившемуся
            ws.send(JSON.stringify({
              type: 'joined_room',
              payload: { room },
            }));

            // Обновить список комнат для всех
            broadcastRoomsList();
          }
          break;

        case 'leave_room':
          // Покинуть комнату
          {
            const { roomId, userId } = message.payload as { roomId: string; userId: string };
            const room = rooms.get(roomId);

            if (!room) return;

            // Удалить игрока из комнаты
            room.players = room.players.filter((p) => p.id !== userId);

            // Хост комнаты не меняется, даже если он вышел
            // room.hostId остается неизменным

            // Комната остается даже если пустая (не удаляем)
            rooms.set(roomId, room);

            const isHost = room.hostId === userId;
            console.log(`👋 ${isHost ? 'Хост' : 'Игрок'} покинул комнату ${room.name} (осталось ${room.players.length} игроков)`);

            // Уведомить оставшихся игроков (если есть)
            if (room.players.length > 0) {
              broadcastToRoom(roomId, {
                type: 'room_updated',
                payload: { room },
              });
            }

            if (currentClient) {
              currentClient.roomId = null;
            }

            // Обновить список комнат
            broadcastRoomsList();
          }
          break;

        case 'update_room':
          // Обновление состояния комнаты (настройки, статус игры и т.д.)
          {
            const room = message.payload as unknown as Room;
            rooms.set(room.id, room);

            console.log(`🔄 Комната ${room.name} обновлена, игроков: ${room.players.length}, мест: ${room.maxPlayers}`);

            // Уведомить всех в комнате (включая отправителя)
            broadcastToRoom(room.id, {
              type: 'room_updated',
              payload: { room },
            });

            // Также отправить отправителю
            if (currentClient && currentClient.ws.readyState === WebSocket.OPEN) {
              currentClient.ws.send(JSON.stringify({
                type: 'room_updated',
                payload: { room },
              }));
            }

            // Обновить список комнат для всех
            broadcastRoomsList();
          }
          break;

        case 'game_finished':
          // Игра завершена - показать попап всем игрокам
          {
            const { roomId } = message.payload as { roomId: string };
            const room = rooms.get(roomId);

            if (room) {
              console.log(`🏁 Игра в комнате ${room.name} завершена`);

              // Уведомить всех игроков в комнате о завершении
              broadcastToRoom(roomId, {
                type: 'game_finished',
                payload: { roomId },
              });
            }
          }
          break;

        case 'delete_room':
          // Удаление комнаты
          {
            const { roomId } = message.payload as { roomId: string };
            const room = rooms.get(roomId);

            if (room) {
              // Уведомить всех игроков в комнате об удалении
              broadcastToRoom(roomId, {
                type: 'room_deleted',
                payload: { roomId },
              });

              // Очистить roomId у всех клиентов этой комнаты
              clients.forEach((client) => {
                if (client.roomId === roomId) {
                  client.roomId = null;
                }
              });

              // Удалить комнату
              rooms.delete(roomId);
              console.log(`🗑️ Комната ${room.name} удалена по запросу хоста`);

              // Обновить список комнат для всех
              broadcastRoomsList();
            }
          }
          break;

        default:
          console.log('⚠️ Неизвестный тип сообщения:', message.type);
      }
    } catch (error) {
      console.error('❌ Ошибка обработки сообщения:', error);
    }
  });

  ws.on('close', () => {
    console.log('❌ Подключение закрыто');

    if (currentClient) {
      // НЕ удаляем игрока из комнаты при закрытии соединения
      // Это может быть просто обновление страницы
      // Комната будет сохранена, игрок сможет переподключиться

      // Только удаляем клиента из списка активных подключений
      clients.delete(currentClient.userId);
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket ошибка:', error);
  });
});
