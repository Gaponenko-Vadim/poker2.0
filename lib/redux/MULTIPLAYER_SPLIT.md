# Multiplayer Slices Separation

## Обзор изменений

Модуль multiplayer был разделен на два независимых slice для улучшения разделения ответственности и типобезопасности:

- **Tournament Multiplayer** - для турнирных игр
- **Cash Multiplayer** - для cash игр

## Структура файлов

```
lib/redux/
├── slices/
│   ├── multiplayerSlice.ts                  # ⚠️ DEPRECATED (оставлен для совместимости)
│   ├── tournamentMultiplayerSlice.ts        # ✅ НОВЫЙ (Tournament)
│   └── cashMultiplayerSlice.ts              # ✅ НОВЫЙ (Cash)
├── types/
│   ├── multiplayerTypes.ts                  # ⚠️ DEPRECATED
│   ├── tournamentMultiplayerTypes.ts        # ✅ НОВЫЙ
│   └── cashMultiplayerTypes.ts              # ✅ НОВЫЙ
├── selectors/
│   ├── multiplayerSelectors.ts              # ⚠️ DEPRECATED
│   ├── tournamentMultiplayerSelectors.ts    # ✅ НОВЫЙ
│   └── cashMultiplayerSelectors.ts          # ✅ НОВЫЙ
├── utils/
│   └── multiplayerUtils.ts                  # Общие утилиты (используются обоими slices)
└── store.ts                                 # Обновлен для подключения обоих slices
```

## Ключевые различия

### Tournament Multiplayer

**Особенности:**
- Фиксированное количество мест: **8-max**
- Специфичные настройки турнира (stage, category, starting stack, bounty)
- Настройки диапазонов с учетом турнирных параметров

**State:**
```typescript
interface TournamentMultiplayerState {
  currentRoom: TournamentRoom | null;
  availableRooms: TournamentRoom[];
  currentUserId: string | null;
  currentUserName: string | null;
}
```

**Настройки:**
```typescript
interface TournamentRoomSettings {
  stage: TournamentStage;
  category: TournamentCategory;
  startingStack: number;
  bounty: boolean;
  activeRangeSetId: number | null;
  activeRangeSetName: string | null;
  activeRangeSetData: RangeSetData | null;
}
```

### Cash Multiplayer

**Особенности:**
- Динамическое количество мест: **2-9 игроков**
- Специфичные настройки cash (blinds, buy-ins)
- Возможность изменять количество мест (только хост)

**State:**
```typescript
interface CashMultiplayerState {
  currentRoom: CashRoom | null;
  availableRooms: CashRoom[];
  currentUserId: string | null;
  currentUserName: string | null;
}
```

**Настройки:**
```typescript
interface CashRoomSettings {
  smallBlind: number;
  bigBlind: number;
  minBuyIn: number;
  maxBuyIn: number;
  activeRangeSetId: number | null;
  activeRangeSetName: string | null;
  activeRangeSetData: RangeSetData | null;
}
```

**Эксклюзивный action:**
```typescript
updateMaxPlayers({ maxPlayers: number }); // Только для cash
```

## Redux Store

### Структура state

```typescript
{
  auth: AuthState;
  table: TableState;
  multiplayer: MultiplayerState;          // ⚠️ DEPRECATED
  tournamentMultiplayer: TournamentMultiplayerState;  // ✅ НОВЫЙ
  cashMultiplayer: CashMultiplayerState;              // ✅ НОВЫЙ
}
```

### Доступ к state

**Tournament:**
```typescript
state.tournamentMultiplayer.currentRoom
state.tournamentMultiplayer.availableRooms
state.tournamentMultiplayer.currentUserId
state.tournamentMultiplayer.currentUserName
```

**Cash:**
```typescript
state.cashMultiplayer.currentRoom
state.cashMultiplayer.availableRooms
state.cashMultiplayer.currentUserId
state.cashMultiplayer.currentUserName
```

## Actions

### Общие actions (доступны в обоих slices)

```typescript
// User management
setCurrentUser({ userId, userName })

// Room management
createRoom({ roomName, maxPlayers? })
joinRoom({ roomId })
leaveRoom()
clearCurrentRoom()

// Game flow
selectSeat({ seatIndex })
togglePlayerReady()
startGame()
endGame()
resetRoom()

// WebSocket sync
setAvailableRooms(rooms)
setCurrentRoom(room)
```

### Tournament-specific actions

```typescript
updateSettings(Partial<TournamentRoomSettings>)
```

### Cash-specific actions

```typescript
updateSettings(Partial<CashRoomSettings>)
updateMaxPlayers({ maxPlayers })  // Эксклюзивно для cash
```

## Использование

### Пример: Tournament Multiplayer

```typescript
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import {
  createRoom,
  selectSeat,
  updateSettings,
} from "@/lib/redux/slices/tournamentMultiplayerSlice";
import {
  selectCurrentRoom,
  selectIsCurrentUserHost,
} from "@/lib/redux/selectors/tournamentMultiplayerSelectors";

function TournamentLobby() {
  const dispatch = useAppDispatch();
  const currentRoom = useAppSelector(selectCurrentRoom);
  const isHost = useAppSelector(selectIsCurrentUserHost);

  const handleCreateRoom = () => {
    dispatch(createRoom({
      roomName: "Турнир 1",
      maxPlayers: 8, // Фиксировано для турниров
    }));
  };

  const handleUpdateStage = (stage: TournamentStage) => {
    dispatch(updateSettings({ stage }));
  };

  return (
    <div>
      {/* UI */}
    </div>
  );
}
```

### Пример: Cash Multiplayer

```typescript
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import {
  createRoom,
  selectSeat,
  updateSettings,
  updateMaxPlayers,
} from "@/lib/redux/slices/cashMultiplayerSlice";
import {
  selectCurrentRoom,
  selectIsCurrentUserHost,
  selectOccupiedSeatsCount,
} from "@/lib/redux/selectors/cashMultiplayerSelectors";

function CashLobby() {
  const dispatch = useAppDispatch();
  const currentRoom = useAppSelector(selectCurrentRoom);
  const isHost = useAppSelector(selectIsCurrentUserHost);
  const occupiedSeats = useAppSelector(selectOccupiedSeatsCount);

  const handleCreateRoom = () => {
    dispatch(createRoom({
      roomName: "Cash 1",
      maxPlayers: 6, // По умолчанию 6-max
    }));
  };

  const handleChangeMaxPlayers = (maxPlayers: number) => {
    // Только для cash! Не доступно в tournament
    dispatch(updateMaxPlayers({ maxPlayers }));
  };

  const handleUpdateBlinds = (smallBlind: number, bigBlind: number) => {
    dispatch(updateSettings({ smallBlind, bigBlind }));
  };

  return (
    <div>
      {isHost && (
        <button onClick={() => handleChangeMaxPlayers(9)}>
          Изменить на 9-max
        </button>
      )}
    </div>
  );
}
```

## Миграция с старого multiplayerSlice

### Шаг 1: Определить тип комнаты

```typescript
// Старый код
const currentRoom = useAppSelector((state) => state.multiplayer.currentRoom);

// Новый код
// Для tournament
const currentRoom = useAppSelector((state) => state.tournamentMultiplayer.currentRoom);

// Для cash
const currentRoom = useAppSelector((state) => state.cashMultiplayer.currentRoom);
```

### Шаг 2: Обновить импорты

```typescript
// Старый код
import { createRoom } from "@/lib/redux/slices/multiplayerSlice";
import { selectCurrentRoom } from "@/lib/redux/selectors/multiplayerSelectors";

// Новый код - Tournament
import { createRoom } from "@/lib/redux/slices/tournamentMultiplayerSlice";
import { selectCurrentRoom } from "@/lib/redux/selectors/tournamentMultiplayerSelectors";

// Новый код - Cash
import { createRoom } from "@/lib/redux/slices/cashMultiplayerSlice";
import { selectCurrentRoom } from "@/lib/redux/selectors/cashMultiplayerSelectors";
```

### Шаг 3: Обновить типы

```typescript
// Старый код
import type { Room, MultiplayerPlayer } from "@/lib/redux/types/multiplayerTypes";

// Новый код - Tournament
import type {
  TournamentRoom,
  TournamentMultiplayerPlayer,
} from "@/lib/redux/types/tournamentMultiplayerTypes";

// Новый код - Cash
import type {
  CashRoom,
  CashMultiplayerPlayer,
} from "@/lib/redux/types/cashMultiplayerTypes";
```

## Преимущества разделения

### 1. Типобезопасность

✅ **До:** Один тип `Room` с union `settings: TournamentRoomSettings | CashRoomSettings`
```typescript
// Нужны type guards для доступа к настройкам
if (room.type === "tournament") {
  const stage = (room.settings as TournamentRoomSettings).stage;
}
```

✅ **После:** Отдельные типы с строгой типизацией
```typescript
// Прямой доступ без type guards
const stage = room.settings.stage; // TypeScript знает, что это TournamentRoom
```

### 2. Разделение ответственности

- Каждый slice отвечает только за свой тип игры
- Нет логики проверки типа комнаты внутри reducers
- Упрощенная структура actions

### 3. Гибкость

- Cash может иметь уникальные функции (например, `updateMaxPlayers`)
- Tournament может иметь специфичные поля без влияния на Cash
- Легче добавлять новые функции для конкретного типа

### 4. Производительность

- Меньше вычислений при проверке типов
- Селекторы работают только с нужным state
- Нет необходимости фильтровать комнаты по типу

### 5. Масштабируемость

- Легко добавить новые типы игр (Sit&Go, Spin&Go и т.д.)
- Каждый тип - независимый модуль
- Проще тестировать изолированно

## Обратная совместимость

⚠️ Старый `multiplayerSlice` оставлен в store для обратной совместимости, но помечен как **DEPRECATED**.

**Рекомендуется:**
1. Мигрировать все компоненты на новые slices
2. После миграции удалить старый `multiplayerSlice`
3. Удалить deprecated файлы:
   - `lib/redux/slices/multiplayerSlice.ts`
   - `lib/redux/types/multiplayerTypes.ts`
   - `lib/redux/selectors/multiplayerSelectors.ts`

## Checklist миграции

- [ ] Определить все компоненты, использующие старый `multiplayerSlice`
- [ ] Разделить компоненты на tournament и cash
- [ ] Обновить импорты actions
- [ ] Обновить импорты селекторов
- [ ] Обновить типы (Room → TournamentRoom / CashRoom)
- [ ] Протестировать функциональность
- [ ] Удалить deprecated файлы
- [ ] Удалить `multiplayer` из store.ts

## Дополнительные улучшения

В будущем можно добавить:

1. **Sit&Go Multiplayer** (6-max/9-max турниры)
2. **Heads-Up Multiplayer** (1 на 1)
3. **Multi-Table Tournaments** (несколько столов)
4. **Satellite Tournaments** (с уникальными правилами)

Каждый тип будет своим slice с собственной логикой и настройками.
