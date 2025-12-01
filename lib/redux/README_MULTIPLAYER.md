# Multiplayer Module Refactoring

## Обзор рефакторинга

Модуль multiplayer был реорганизован для улучшения читаемости, переиспользуемости и производительности кода.

## Структура файлов

```
lib/redux/
├── slices/
│   └── multiplayerSlice.ts          # Redux slice (рефакторинг)
├── utils/
│   └── multiplayerUtils.ts          # Утилиты для multiplayer (НОВЫЙ)
├── selectors/
│   └── multiplayerSelectors.ts      # Селекторы для multiplayer (НОВЫЙ)
└── types/
    └── multiplayerTypes.ts          # Типы (существующий)
```

## Что изменилось

### 1. `multiplayerUtils.ts` - Вспомогательные функции

Вынесены все вспомогательные функции из slice в отдельный файл:

**Генерация ID:**
- `generateRoomId()` - генерация уникального ID комнаты
- `generatePlayerId()` - генерация уникального ID игрока

**Дефолтные настройки:**
- `getDefaultTournamentSettings()` - настройки турнирной комнаты
- `getDefaultCashSettings()` - настройки cash комнаты

**Валидация:**
- `isSeatTaken()` - проверка, занято ли место
- `canStartGame()` - проверка, можно ли начать игру
- `isValidMaxPlayers()` - валидация количества мест (2-9)

**Вспомогательные:**
- `getOccupiedSeatsCount()` - количество занятых мест
- `isRoomFull()` - проверка, полна ли комната
- `findPlayerById()` - поиск игрока по ID
- `isPlayerHost()` - проверка, является ли игрок хостом

### 2. `multiplayerSelectors.ts` - Мемоизированные селекторы

Созданы селекторы для эффективного получения производных данных из state:

**Базовые селекторы:**
- `selectCurrentRoom` - текущая комната
- `selectAvailableRooms` - доступные комнаты
- `selectCurrentUserId` - ID текущего пользователя
- `selectCurrentUserName` - имя текущего пользователя

**Мемоизированные селекторы (createSelector):**
- `selectIsCurrentUserHost` - является ли текущий пользователь хостом
- `selectCurrentPlayer` - текущий игрок
- `selectHasSelectedSeat` - занял ли текущий пользователь место
- `selectOccupiedSeatsCount` - количество занятых мест
- `selectCanStartGame` - можно ли начать игру
- `selectCurrentRoomPlayers` - список игроков текущей комнаты
- `selectCurrentRoomSettings` - настройки текущей комнаты
- `selectAllPlayersReady` - все ли игроки готовы
- `selectAllPlayersSeated` - все ли игроки заняли места
- `selectCurrentRoomPlayersCount` - количество игроков в комнате
- `selectIsCurrentRoomFull` - полная ли комната

### 3. `multiplayerSlice.ts` - Оптимизированный slice

**Улучшения:**
- ✅ Импорт утилит из `multiplayerUtils.ts`
- ✅ Использование вспомогательных функций вместо встроенной логики
- ✅ Улучшенная читаемость reducers
- ✅ JSDoc комментарии для всех actions
- ✅ Централизованная валидация
- ✅ Уменьшение дублирования кода

**Размер файла:**
- До рефакторинга: ~392 строк
- После рефакторинга: ~386 строк (основной код)
- Вынесено в utils: ~130 строк

## Как использовать

### Использование селекторов

**До рефакторинга:**
```typescript
const currentRoom = useAppSelector((state) => state.multiplayer.currentRoom);
const isHost = currentRoom?.hostId === currentUserId;
```

**После рефакторинга:**
```typescript
import { selectIsCurrentUserHost } from "@/lib/redux/selectors/multiplayerSelectors";

const isHost = useAppSelector(selectIsCurrentUserHost);
```

### Использование утилит

**До рефакторинга:**
```typescript
// Логика встроена в компонент
const isSeatTaken = currentRoom.players.some(
  (p) => p.seatIndex === seatIndex && p.id !== currentUserId
);
```

**После рефакторинга:**
```typescript
import { isSeatTaken } from "@/lib/redux/utils/multiplayerUtils";

const taken = isSeatTaken(currentRoom.players, seatIndex, currentUserId);
```

## Преимущества

### 1. Переиспользуемость
- Утилиты можно использовать в любых компонентах
- Селекторы автоматически мемоизируются
- Единый источник логики валидации

### 2. Производительность
- Мемоизированные селекторы предотвращают лишние ререндеры
- Вычисления производятся только при изменении зависимостей

### 3. Тестируемость
- Утилиты можно тестировать независимо
- Селекторы легко покрыть unit-тестами
- Reducers стали проще и понятнее

### 4. Читаемость
- Slice содержит только бизнес-логику
- Вспомогательные функции вынесены отдельно
- JSDoc комментарии для всех функций

## Миграция существующего кода

### Шаг 1: Обновить импорты в компонентах

Замените прямые обращения к state на селекторы:

```typescript
// Было
const currentRoom = useAppSelector((state) => state.multiplayer.currentRoom);
const currentUserId = useAppSelector((state) => state.multiplayer.currentUserId);
const isHost = currentRoom?.hostId === currentUserId;

// Стало
import {
  selectCurrentRoom,
  selectIsCurrentUserHost
} from "@/lib/redux/selectors/multiplayerSelectors";

const currentRoom = useAppSelector(selectCurrentRoom);
const isHost = useAppSelector(selectIsCurrentUserHost);
```

### Шаг 2: Использовать утилиты вместо встроенной логики

```typescript
// Было
const player = currentRoom.players.find((p) => p.id === currentUserId);
const hasSelectedSeat = player?.seatIndex !== null;

// Стало
import {
  findPlayerById
} from "@/lib/redux/utils/multiplayerUtils";
import {
  selectHasSelectedSeat
} from "@/lib/redux/selectors/multiplayerSelectors";

const hasSelectedSeat = useAppSelector(selectHasSelectedSeat);
```

## Совместимость

✅ Рефакторинг **полностью обратно совместим**:
- Все существующие actions работают без изменений
- Redux state структура не изменилась
- API slice остался прежним
- Существующие компоненты продолжат работать

## Рекомендации

1. **При добавлении новой логики:**
   - Добавляйте утилиты в `multiplayerUtils.ts`
   - Создавайте селекторы в `multiplayerSelectors.ts`
   - Используйте их в slice и компонентах

2. **При работе с state:**
   - Предпочитайте селекторы прямому обращению к state
   - Используйте мемоизированные селекторы для производных данных

3. **При валидации:**
   - Используйте централизованные функции из utils
   - Не дублируйте логику валидации в компонентах

## Пример полного использования

```typescript
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import { selectSeat } from "@/lib/redux/slices/multiplayerSlice";
import {
  selectCurrentRoom,
  selectHasSelectedSeat,
  selectIsCurrentUserHost,
  selectCanStartGame,
} from "@/lib/redux/selectors/multiplayerSelectors";
import { isSeatTaken } from "@/lib/redux/utils/multiplayerUtils";

function MultiplayerTable() {
  const dispatch = useAppDispatch();
  const currentRoom = useAppSelector(selectCurrentRoom);
  const hasSelectedSeat = useAppSelector(selectHasSelectedSeat);
  const isHost = useAppSelector(selectIsCurrentUserHost);
  const { canStart, reason } = useAppSelector(selectCanStartGame);

  const handleSelectSeat = (seatIndex: number) => {
    if (!currentRoom) return;

    if (isSeatTaken(currentRoom.players, seatIndex)) {
      console.error("Seat is taken");
      return;
    }

    dispatch(selectSeat({ seatIndex }));
  };

  return (
    <div>
      {/* UI */}
    </div>
  );
}
```

## Дальнейшие улучшения

Возможные направления для дальнейшего развития:

1. **Добавить unit-тесты:**
   - Тестирование утилит (`multiplayerUtils.test.ts`)
   - Тестирование селекторов (`multiplayerSelectors.test.ts`)
   - Тестирование reducers

2. **Типизация ошибок:**
   - Создать enum для типов ошибок
   - Добавить error handling middleware

3. **Оптимизация:**
   - Использовать `Immer` для иммутабельных обновлений (уже есть в RTK)
   - Добавить батчинг для множественных обновлений

4. **Документация:**
   - Добавить примеры использования в компонентах
   - Создать storybook для UI компонентов multiplayer
