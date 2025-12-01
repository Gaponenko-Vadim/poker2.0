# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

1. Установите зависимости: `npm install`
2. Настройте `.env.local` (см. раздел Environment Variables)
3. Инициализируйте БД: `npm run db:init`
4. Запустите dev-сервер: `npm run dev`
5. Откройте http://localhost:3000

## Project Overview

Покерное приложение-тренажер для обучения игре в покер. Позволяет симулировать игровые ситуации за столом с настраиваемыми игроками, их позициями и диапазонами рук. Поддерживает форматы 6-Max, 8-Max турниры и Cash игры (2-9 игроков).

## Technology Stack

- **Framework**: Next.js 16.0.0 (App Router)
- **React**: 19.2.0
- **TypeScript**: ^5
- **State Management**: Redux Toolkit 2.9.2 with React-Redux 9.2.0
- **Database**: PostgreSQL with node-postgres (pg 8.16.3)
- **Authentication**: JWT (jsonwebtoken 9.0.2) + bcryptjs 3.0.2 + OAuth 2.0 (Google, Yandex)
- **Styling**: Tailwind CSS 4 with PostCSS
- **Icons**: Heroicons React 2.2.0
- **Fonts**: Geist and Geist Mono

## Development Commands

- `npm run dev` - Запуск dev-сервера (http://localhost:3000)
- `npm run build` - Production сборка (включает проверку TypeScript)
- `npm start` - Запуск production сервера
- `npm run lint` - ESLint проверка
- `npx tsc --noEmit` - Проверка типов
- `npm run db:init` - Инициализация PostgreSQL БД

**WebSocket сервер для Multiplayer**:
- `cd server && npx tsx websocket.ts` - Запуск WebSocket сервера (порт 8080)
- `node server/start-websocket.js` - Альтернативный запуск через Node.js

## Critical Patterns to Follow

⚠️ **ВАЖНО**:

1. **Redux хуки**: Всегда используйте `useAppDispatch` и `useAppSelector` из `lib/redux/hooks.ts` вместо обычных Redux хуков
2. **Actions naming**: Используйте типизированные actions из `tableSlice.ts` (bet-open, raise-3bet), НЕ из `lib/types/actions.ts` (устаревшие)
3. **Диапазоны из БД**: При изменении пользовательских диапазонов - сначала сохранить данные в Redux через `setXxxActiveRangeSetData()`, затем перезагрузить диапазоны всех игроков
4. **Исследование кодовой базы**: Для поиска и анализа используйте Task tool с subagent_type=Explore, не используйте Glob/Grep напрямую
5. **Category handling**: НЕ используйте `setSixMaxCategory` напрямую - категория автоматически обновляется при изменении buy-in

## Project Structure

```
poker2.0/
├── app/                    # Next.js App Router
│   ├── tables/            # Игровые страницы (6-max, 8-max, cash, multiplayer)
│   └── api/               # API routes (auth, user-ranges)
├── server/                # WebSocket сервер для multiplayer
│   ├── websocket.ts       # WebSocket логика
│   └── start-websocket.js # Запуск сервера
├── lib/
│   ├── redux/             # Redux state management
│   │   ├── slices/        # Redux slices (tableSlice, authSlice, multiplayerSlice)
│   │   ├── types/         # TypeScript интерфейсы (tableTypes, multiplayerTypes)
│   │   ├── utils/         # Утилиты Redux (tableUtils.ts)
│   │   ├── store.ts       # Redux store
│   │   ├── hooks.ts       # Типизированные хуки (useAppDispatch, useAppSelector)
│   │   └── provider.tsx   # Redux Provider
│   ├── hooks/             # Custom React hooks (useMultiplayerWebSocket)
│   ├── types/             # Глобальные TypeScript интерфейсы
│   ├── db/                # PostgreSQL логика
│   ├── auth/              # JWT, OAuth, password hashing
│   ├── utils/             # Утилиты (карты, диапазоны, эквити, стеки)
│   └── constants/         # Константы (диапазоны рук, таблицы эквити)
├── components/            # React компоненты
│   ├── MultiplayerLobby.tsx      # Лобби мультиплеера
│   ├── MultiplayerTable.tsx      # Стол мультиплеера
│   └── CreateRoomForm.tsx        # Форма создания комнаты
└── scripts/               # Утилиты инициализации БД
```

## Architecture Overview

### Data Flow

```
User Interaction
    ↓
Component (dispatch Redux action)
    ↓
Redux Store (tableSlice/authSlice)
    ↓
Component re-renders with new state
```

### State Management (Redux Toolkit)

**Store Structure** (`lib/redux/store.ts`):
- `auth` slice - аутентификация (JWT token, email, nickname)
- `table` slice - состояние игровых столов (игроки, позиции, карты, действия)
- `multiplayer` slice - мультиплеер режим "Игра с друзьями" (комнаты, WebSocket)

**Table Slice** (`lib/redux/slices/tableSlice.ts`) - центральный слайс:

Управляет тремя типами столов: `sixMaxUsers`, `eightMaxUsers`, `cashUsers`

**Модульная архитектура:**
- `lib/redux/types/tableTypes.ts` - все типы (User, PlayerAction, TablePosition, TournamentStage, RangeSetData и т.д.)
- `lib/redux/utils/tableUtils.ts` - утилиты (getRangeWithTournamentSettings, getAvailableActions, generateUsers)
- `lib/redux/slices/tableSlice.ts` - reducers и actions (~1483 строк, оптимизирован)

**Структура игрока (User)**:
- Основные данные: `name`, `stack`, `bet`, `position` (BTN/SB/BB/UTG/etc.)
- Характеристики: `strength` (fish/amateur/regular), `playStyle` (tight/balanced/aggressor), `stackSize` (very-small/small/medium/big)
- Игровые данные: `cards` (только для Hero), `range` (массив строк ["AA", "AKs"]), `action` (fold/call/check/bet-open/raise-3bet/etc.)
- **Начальные блайнды**: SB начинает с `bet: 0.5` и `stack: 49.5`, BB с `bet: 1` и `stack: 49`

**Настройки стола** (для каждого типа):
- Турнирные: `stage`, `category`, `startingStack`, `bounty`
- Глобальные: `autoAllIn` - всегда ставить весь стек для всех игроков
- Пользовательские диапазоны: `activeRangeSetId`, `activeRangeSetName`, `activeRangeSetData` (тип: `RangeSetData | null`)

**Ключевые функции** (в `lib/redux/utils/tableUtils.ts`):
- `getRangeWithTournamentSettings(customRangeData?)` - загрузка диапазонов (из БД или дефолтных JSON)
- `getAvailableActions()` - определяет доступные действия в зависимости от состояния стола
- `generateUsers(count)` - создаёт игроков с дефолтными параметрами (amateur, balanced, medium) и блайндами
- `convertPlayerActionToPokerAction()` - конвертация между форматами действий UI ↔ JSON

### Component Architecture

**Иерархия компонентов**:
```
Page (получает данные из Redux)
  ↓
PokerTable (управляет столом)
  ↓
PlayerSeat (отдельный игрок)
  ↓
PlayerActionDropdown / RangeSelector / CardSelector
```

**Ключевые компоненты**:

- **Header**: Навигация, аутентификация, OAuth callback обработка. Клик по email → PlayerSettingsPopup
- **PokerTable**: Главный компонент стола, управляет отображением игроков и борда
- **PlayerSeat**: Отображает игрока с позицией, стеком, картами, действиями
- **RangeSelector**: Визуальная матрица 13x13 для настройки диапазонов противников
- **CardSelector / CardPickerPopup**: Выбор карт Hero и карт борда (флоп, тёрн, ривер)
- **TournamentSettings**: Настройки турнира и загрузка пользовательских диапазонов из БД
- **PlayerSettingsPopup**: Глобальные настройки (autoAllIn) + конструктор диапазонов

### Database Layer

**Таблицы**:
- `users` - пользователи (email, password, provider, google_id, yandex_id)
- `user_range_sets` - пользовательские наборы диапазонов (name, table_type, category, range_data)
- `player_defaults` - дефолтные настройки игроков

**Connection** (`lib/db/connection.ts`):
- PostgreSQL connection pool через переменные окружения
- `testConnection()` для проверки подключения

### Authentication

**JWT** (`lib/auth/jwt.ts`):
- `generateToken()` - токен со сроком 7 дней
- `verifyToken()`, `extractTokenFromHeader()`

**OAuth 2.0** (`lib/auth/oauth/`):
- Google OAuth: `getGoogleAuthUrl()`, `getGoogleAccessToken()`, `getGoogleUserInfo()`
- Yandex OAuth: `getYandexAuthUrl()`, `getYandexAccessToken()`, `getYandexUserInfo()`

**OAuth Flow**:
1. Клик "Войти через Google/Яндекс" → редирект на `/api/auth/google` или `/api/auth/yandex`
2. Редирект на страницу авторизации провайдера
3. Callback → обмен code на access token → получение данных пользователя
4. Создание/обновление записи в БД → генерация JWT → редирект с токеном
5. Header компонент перехватывает токен из URL и сохраняет в localStorage

**API Routes**:
- `POST /api/auth/register` - регистрация (email/password)
- `POST /api/auth/login` - вход (email/password)
- `GET /api/auth/google` и `/api/auth/google/callback`
- `GET /api/auth/yandex` и `/api/auth/yandex/callback`

## Range System (Критически важно)

### Основной источник данных

**Дефолтные диапазоны для оппонентов**:
- `lib/constants/tournamentRanges_*.json` - JSON файлы с диапазонами для разных категорий турниров
- `lib/utils/tournamentRangeLoader.ts` - утилита для загрузки диапазонов оппонентов

**Дефолтные диапазоны для Hero**:
- `lib/constants/heroRanges/heroRanges_*.json` - JSON файлы с Hero диапазонами (БЕЗ уровня strength)
- `lib/utils/heroRangeLoader.ts` - утилита для загрузки диапазонов Hero

**ВАЖНО**: Структура Hero диапазонов отличается от оппонентов - отсутствует уровень `strength`, путь напрямую к `playStyle`

### Структура диапазонов в JSON

**Для оппонентов (user)**:
```
ranges.user.stages.{STAGE}.positions.{POSITION}.{strength}.{playStyle}.ranges_by_stack.{stackSize}.{action}
```
**Пример пути**: `early → UTG → fish → tight → short → open_raise`

**Для Hero**:
```
ranges.hero.stages.{STAGE}.positions.{POSITION}.{playStyle}.ranges_by_stack.{stackSize}.{action}
```
**Пример пути**: `early → BTN → balanced → medium → open_raise` (БЕЗ strength)

**Стадии турнира** (stages): early, middle, pre-bubble, late, pre-final, final

**Типы действий**: open_raise, push_range, call_vs_shove, defense_vs_open, 3bet, defense_vs_3bet, 4bet, defense_vs_4bet, 5bet, defense_vs_5bet

### Конвертация действий

**Важно**: UI и JSON используют разные форматы действий!

- **UI** (`PlayerAction`): bet-open, raise-3bet, raise-4bet, raise-5bet, all-in
- **JSON** (`PokerAction`): open, threeBet, fourBet, fiveBet, allIn

Функция `convertPlayerActionToPokerAction()` автоматически конвертирует между форматами.

### Пользовательские диапазоны из БД

**Redux state**: `sixMaxActiveRangeSetData`, `eightMaxActiveRangeSetData`, `cashActiveRangeSetData`

**Механизм загрузки**:
1. Пользователь выбирает набор в TournamentSettings (дропдаун "Загрузка диапазонов")
2. useEffect загружает данные из API `/api/user-ranges/${id}`
3. Данные сохраняются через `setXxxActiveRangeSetData(rangeData)`
4. Все reducers автоматически используют `customRangeData` из state
5. При выборе "Default" очищается `customRangeData`

**Передача через props**: Page → PokerTable → PlayerSeat → RangeSelector (prop `customRangeData`)

**КРИТИЧНО**: При изменении выбора диапазонов:
- Сначала сохранить данные в Redux
- Затем принудительно перезагрузить диапазоны всех игроков

### Автоматическая загрузка диапазонов

- При изменении параметров игрока (сила, стиль, стек, действие) диапазон автоматически обновляется
- `getRangeWithTournamentSettings()` учитывает все турнирные параметры
- Если диапазон не найден в JSON → возвращается пустой массив
- При первой загрузке страницы: если у игроков пустые диапазоны → автоматически загружаются на основе текущих параметров

### Функции загрузки диапазонов

**Для оппонентов** (`lib/utils/tournamentRangeLoader.ts`):
- `getRangeForTournament()` - загружает из дефолтных JSON файлов
- `getRangeFromData()` - загружает из пользовательских данных (БД)
- `getTournamentRangeFromJSON()` - извлекает диапазон из JSON структуры

**Для Hero** (`lib/utils/heroRangeLoader.ts`):
- `getHeroRangeFromJSON()` - загружает Hero диапазон из дефолтных JSON файлов (БЕЗ strength)
- `getHeroRangeFromData()` - загружает Hero диапазон из пользовательских данных (БД)

**Общие**:
- `expandRange()` (в `lib/utils/rangeExpander.ts`) - разворачивает нотацию (например, "AKs") в массив конкретных рук
- `parseRangeString()` - конвертирует строку диапазона из JSON в массив рук

## Card System

**Формат карт**: строки типа "6hearts", "Aspades", "Kdiamonds", "2clubs"
- `CardRank`: 2-9, T (10), J, Q, K, A
- `CardSuit`: hearts, diamonds, clubs, spades

**Формат нотации диапазонов**: "AA" (пары), "AKs" (suited), "AKo" (offsuit)

**Board Cards** (карты борда):
- Локальный state в PokerTable: `boardCards` - массив из 5 карт `(Card | null)[]`
- Отображаются когда у Hero есть карты
- Флоп (3 карты), Тёрн (4 карты), Ривер (5 карты)
- При нажатии "Новая раздача" карты борда автоматически очищаются

## Key Features

### Global Auto All-In Setting

**Назначение**: Глобальная настройка "всегда ставить весь стек" для всех игроков

**Доступ**: Header → клик по email → PlayerSettingsPopup → вкладка "Основные настройки"

**Реализация**:
- Redux state: `sixMaxAutoAllIn`, `eightMaxAutoAllIn`, `cashAutoAllIn`
- Actions: `setSixMaxAutoAllIn(boolean)`, `setEightMaxAutoAllIn(boolean)`, `setCashAutoAllIn(boolean)`
- Передается через props: Page → PokerTable → PlayerSeat → PlayerActionDropdown
- Если `autoAllIn === true` → all-in выполняется сразу без попапа подтверждения

### Betting Logic

**Доступные действия** (`getAvailableActions()` в `lib/redux/utils/tableUtils.ts`):
- Базовые действия всегда доступны: fold, call, check, bet-open, all-in
- Raise-действия доступны только если:
  1. Есть соответствующее предыдущее действие на столе
  2. У игрока достаточно фишек (>80% стека)
  3. Размер raise >= 2.5x от текущей максимальной ставки
- Последовательность: bet-open → raise-3bet → raise-4bet → raise-5bet
- **Начальные блайнды**: SB и BB автоматически инициализируются с блайндами 0.5 и 1 BB соответственно

### Range Builder Workflow

**Доступ**: Header → клик по email → PlayerSettingsPopup → вкладка "Конструктор диапазонов"

**Функции**:
1. Выбор параметров: позиция, сила, стиль, стек, действие
2. Визуальная матрица 13x13 для выбора рук
3. Сохранение и редактирование множества диапазонов
4. Экспорт в JSON (копирование или скачивание)
5. Формат совместим с `lib/constants/tournamentRanges.json`

**Важно**: Конструктор для создания новых диапазонов. Для изменения диапазонов конкретных игроков → RangeSelector (клик по игроку).

## Multiplayer System (Игра с друзьями)

### Architecture Overview

Мультиплеер использует **WebSocket** для real-time синхронизации между клиентами.

**Компоненты**:
- `server/websocket.ts` - WebSocket сервер (порт 8080)
- `lib/redux/slices/multiplayerSlice.ts` - Redux state для комнат
- `lib/hooks/useMultiplayerWebSocket.ts` - React хук для WebSocket подключения
- `app/tables/multiplayer/page.tsx` - главная страница
- `components/MultiplayerLobby.tsx` - лобби с списком комнат
- `components/MultiplayerTable.tsx` - игровой стол
- `components/CreateRoomForm.tsx` - форма создания комнаты

### Redux State (multiplayerSlice)

```typescript
MultiplayerState {
  currentRoom: Room | null          // Текущая комната игрока
  availableRooms: Room[]            // Список всех комнат
  currentUserId: string | null      // ID текущего пользователя
  currentUserName: string | null    // Имя текущего пользователя
}
```

**Room Structure**:
```typescript
Room {
  id: string                        // Уникальный ID
  name: string                      // Название комнаты
  type: 'tournament' | 'cash'       // Тип игры
  status: 'waiting' | 'playing' | 'finished'
  hostId: string                    // ID создателя (неизменный)
  hostName: string                  // Имя создателя
  players: MultiplayerPlayer[]      // Игроки в комнате
  maxPlayers: number                // Максимум игроков (8)
  settings: TournamentRoomSettings | CashRoomSettings
}
```

**MultiplayerPlayer**:
```typescript
MultiplayerPlayer {
  id: string                        // ID игрока
  name: string                      // Имя игрока
  isHost: boolean                   // Является ли хостом
  isReady: boolean                  // Готов к игре
  seatIndex: number | null          // Место за столом (0-7)
  user?: User                       // Данные игрока (когда игра началась)
}
```

### WebSocket Protocol

**Client → Server Messages**:
- `register` - регистрация пользователя при подключении
- `create_room` - создание новой комнаты
- `join_room` - присоединение к комнате
- `leave_room` - покинуть комнату
- `update_room` - обновление состояния комнаты
- `game_finished` - завершение игры
- `delete_room` - удаление комнаты (только хост)

**Server → Client Messages**:
- `rooms_list` - список всех доступных комнат
- `room_created` - комната создана
- `joined_room` - успешное присоединение
- `room_updated` - комната обновлена
- `room_deleted` - комната удалена
- `game_finished` - уведомление о завершении игры
- `error` - ошибка от сервера

### Critical Multiplayer Rules

⚠️ **ВАЖНЫЕ ПРАВИЛА**:

1. **Хост комнаты неизменный**:
   - `hostId` устанавливается при создании и НЕ меняется
   - Даже если хост выходит, он остается хостом комнаты
   - Только хост может: запускать игру, удалять комнату, добавлять стеки

2. **Комнаты не удаляются автоматически**:
   - При выходе всех игроков комната остается с 0 игроков
   - Удаление только вручную через кнопку 🗑️ (хост)

3. **User ID и Name**:
   - `currentUserId` сохраняется в localStorage
   - `currentUserName` берется из `auth.user.nickname` если залогинен
   - Если не залогинен - запрашивается через prompt
   - При изменении nickname в профиле автоматически обновляется

4. **WebSocket Connection**:
   - Глобальное соединение на уровне страницы
   - Автоматическое переподключение при обрыве
   - При закрытии страницы игрок НЕ удаляется из комнаты
   - Регистрация пользователя при каждом подключении

5. **Синхронизация**:
   - При входе/выходе всегда отправляется сообщение на сервер
   - Сервер broadcast обновления всем игрокам в комнате
   - `room_updated` только для игроков в той же комнате
   - `rooms_list` отправляется всем подключенным клиентам

### User Authentication Flow

```
1. Загрузка страницы /tables/multiplayer
   ↓
2. useEffect проверяет currentUserId
   ↓
3. Если нет → проверяет authUser?.nickname
   ↓
4. Если залогинен → userName = authUser.nickname
   ↓
5. Если не залогинен → prompt для ввода ника
   ↓
6. Сохранение в localStorage и Redux
   ↓
7. WebSocket.register отправляет на сервер
```

### Room Lifecycle

```
1. CREATE: Host создает комнату
   → Server создает Room и broadcast rooms_list
   → Host получает room_created

2. JOIN: Игрок присоединяется
   → Server добавляет player в room.players
   → Broadcast room_updated игрокам в комнате
   → Broadcast rooms_list всем

3. LEAVE: Игрок выходит
   → Server удаляет player из room.players
   → Комната остается (не удаляется)
   → Broadcast room_updated и rooms_list

4. DELETE: Host удаляет комнату
   → Server отправляет room_deleted всем в комнате
   → Server удаляет room из памяти
   → Broadcast rooms_list всем
```

### Component Data Flow

```
Page
  ├─ useMultiplayerWebSocket() - WebSocket хук
  │   ├─ connect() - подключение к ws://localhost:8080
  │   ├─ sendMessage() - отправка на сервер
  │   └─ on message - обработка ответов сервера
  │
  ├─ currentRoom === null
  │   └─ MultiplayerLobby
  │       ├─ availableRooms (из Redux)
  │       ├─ CreateRoomForm - форма создания
  │       └─ Room cards - список комнат
  │
  └─ currentRoom !== null
      └─ MultiplayerTable
          ├─ Управление (старт, пауза, завершить)
          ├─ Покерный стол (визуал)
          └─ Попап завершения игры
```

### Development Notes

**Очистка localStorage для тестирования**:
```javascript
localStorage.removeItem('multiplayer_userId');
localStorage.removeItem('multiplayer_userName');
location.reload();
```

**Перезапуск WebSocket сервера**:
```bash
# Найти процесс
netstat -ano | findstr :8080

# Убить процесс (Windows)
taskkill //F //PID <PID>

# Запустить заново
cd server && npx tsx websocket.ts
```

**Отладка WebSocket**:
- Логи сервера показывают все события
- Логи клиента в консоли браузера (F12)
- `console.log` в `useMultiplayerWebSocket.ts` для debugging

## Environment Variables

Создайте `.env.local`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=poker

# JWT
JWT_SECRET=your-secret-key

# Google OAuth (опционально)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Yandex OAuth (опционально)
YANDEX_CLIENT_ID=your-yandex-client-id
YANDEX_CLIENT_SECRET=your-yandex-client-secret
YANDEX_REDIRECT_URI=http://localhost:3000/api/auth/yandex/callback
```

**Настройка OAuth**:
- См. `.env.example` для шаблона
- См. `OAUTH_SETUP.md` для подробной инструкции
- Google credentials: https://console.cloud.google.com/apis/credentials
- Yandex credentials: https://oauth.yandex.ru/

## Database Setup

1. Установить PostgreSQL и создать БД: `CREATE DATABASE poker;`
2. Настроить `.env.local` с параметрами подключения
3. Запустить инициализацию: `npm run db:init`

**Миграция для OAuth** (если БД уже существует):
```bash
psql -U postgres -d poker -f scripts/migrate-oauth.sql
```

Подробная инструкция в `DATABASE_SETUP.md`

## Naming Conventions

- **Позиции**: BTN, SB, BB, UTG, UTG+1, MP, HJ, CO (uppercase)
- **Сила игрока**: fish, amateur, regular (lowercase)
- **Стиль игры**: tight, balanced, aggressor (lowercase)
- **Размер стека**: very-small, small, medium, big (lowercase с дефисом)
- **Действия игрока (UI)**: fold, call, check, bet-open, raise-3bet, raise-4bet, raise-5bet, all-in
- **Действия для диапазонов (JSON)**: open, threeBet, fourBet, fiveBet, allIn (camelCase)
- **Стадии турнира**: early, middle, pre-bubble, late, pre-final, final (lowercase с дефисом)
- **Категории турнира**: micro, low, mid, high (lowercase)

## TypeScript Configuration

- **Path alias**: `@/*` для импорта из корня проекта
- **Strict mode**: Включен для максимальной типобезопасности
- **Target**: ES2017 с JSX: react-jsx

**Важные правила**:
- **НИКОГДА не используйте `any`** - создавайте типизированные интерфейсы
- Для динамических JSON структур используйте `Record<string, unknown>` или специальный тип `RangeSetData`
- Все неиспользуемые переменные и импорты должны быть удалены
- При работе с динамическими структурами используйте `Record<string, T>`
- Для индексации объектов с динамическими ключами: `(obj as Record<string, string>)[key]`
- Для несовместимых типов JSON используйте двойное приведение: `as unknown as TargetType`

**Специальные типы**:
- `RangeSetData` - тип для пользовательских диапазонов из БД (`Record<string, unknown>`)
- `PokerAction` - действия в формате для JSON ("open", "threeBet", "fourBet", "fiveBet", "allIn")
- `TournamentActionType` - действия в формате JSON ("open_raise", "3bet", "4bet", "5bet", "push_range")

## Common Development Patterns

### Adding New Redux Actions

1. **Для настроек стола**: Создайте три версии (sixMax, eightMax, cash)
   ```typescript
   setSixMaxNewSetting: (state, action: PayloadAction<Type>) => {
     state.sixMaxNewSetting = action.payload;
   }
   ```

2. **Для действий игрока**: Принимайте `{ index, value }`
   ```typescript
   setSixMaxPlayerProperty: (state, action: PayloadAction<{ index: number; property: Type }>) => {
     state.sixMaxUsers[action.payload.index].property = action.payload.property;
   }
   ```

3. **Экспорт**: Добавьте в `export const { ... } = tableSlice.actions;`

### Redux Usage Best Practices

- Используйте `useAppDispatch` и `useAppSelector` из `lib/redux/hooks.ts`
- Импортируйте actions из slices явно, не используйте `import *`
- Store создается через `makeStore()` для поддержки SSR
- Actions имеют префиксы: `sixMax`, `eightMax`, `cash`

### Component Structure

- Все игровые страницы - Client Components (`"use client"`)
- Получение данных из Redux, не из props
- Колбэки диспатчат Redux actions, не изменяют локальный state

### Page Structure

```
/tables/6-max   - 6-макс турнир
/tables/8-max   - 8-макс турнир
/tables/cash    - кеш игра (2-9 игроков)
/shop           - магазин диапазонов
```

## Utility Functions

### Card Utilities (`lib/utils/cardUtils.ts`)
- `parseCard()` - парсинг строки карты в объект
- `isValidCard()` - проверка валидности
- `getAllCards()` - полная колода (52 карты)

### Range Utilities
- `expandRange()` (`lib/utils/rangeExpander.ts`) - разворачивает нотацию в массив рук
- `filterCombinations()` (`lib/utils/rangeExpander.ts`) - фильтрует комбинации по использованным картам
- `filterOpponentRange()` (`lib/utils/filterOpponentRange.ts`) - фильтрует диапазон оппонента с учётом карт Hero и борда
- Поддерживает suited (s), offsuit (o), пары, диапазоны ("22+", "A2s+")

### Hand Evaluation (`lib/utils/evaluateHand.ts`)
- `evaluateHand()` - оценивает силу покерной комбинации по правилам Техасского Холдема
- `compareHands()` - сравнивает две руки и определяет победителя
- `findBestHand()` - находит лучшую комбинацию из 7 карт (2 карты игрока + 5 борда)
- Поддерживает все 10 типов комбинаций: Royal Flush, Straight Flush, Four of a Kind, Full House, Flush, Straight, Three of a Kind, Two Pair, One Pair, High Card

### Equity Calculator (`lib/utils/equityCalculator.ts`)
- Расчет эквити рук Hero против диапазонов оппонентов
- Использует предрассчитанные таблицы из `lib/constants/equityTable.ts`

### Stack Size (`lib/utils/stackSize.ts`)
- `getStackSizeCategory()` - определяет категорию стека
- Пороги: ≤10 (very-small), 10-20 (small), 20-40 (medium), >40 (big)

## Important Notes

**Устаревшие файлы** (не используются):
- `lib/constants/defaultRanges.ts` - старая TypeScript структура
- `lib/types/actions.ts` - устаревшие типы действий (НЕ использовать)
- `temp_6max_backup.tsx` - резервная копия (не в production)

**Таблица user_range_sets**:
- Стадия турнира (stage) НЕ сохраняется в БД - это внутренний фильтр
- Наборы фильтруются по: tableType, category, startingStack, bounty
- `range_data` - JSONB с полной структурой диапазонов (включая все стадии)
