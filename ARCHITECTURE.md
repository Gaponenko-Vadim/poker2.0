# Архитектура Poker Trainer

Этот документ описывает техническую архитектуру приложения, паттерны проектирования и ключевые решения.

## Оглавление

- [Общая архитектура](#общая-архитектура)
- [Data Flow](#data-flow)
- [Redux State Management](#redux-state-management)
- [Система диапазонов](#система-диапазонов)
- [API Layer](#api-layer)
- [База данных](#база-данных)
- [Аутентификация](#аутентификация)

---

## Общая архитектура

### Технологический стек

```
┌─────────────────────────────────────────────┐
│           Frontend (Client Side)            │
├─────────────────────────────────────────────┤
│  Next.js 16 (App Router) + React 19         │
│  Redux Toolkit 2.9.2                        │
│  Tailwind CSS 4                             │
│  TypeScript 5                               │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│           Backend (Server Side)             │
├─────────────────────────────────────────────┤
│  Next.js API Routes                         │
│  JWT + OAuth 2.0 (Google, Yandex)           │
│  PostgreSQL (node-postgres)                 │
└─────────────────────────────────────────────┘
```

### Модульная структура

```
poker2.0/
│
├── app/                          # Next.js App Router
│   ├── tables/                   # Игровые страницы
│   │   ├── 6-max/page.tsx       # 6-Max турнир
│   │   ├── 8-max/page.tsx       # 8-Max турнир
│   │   ├── cash/page.tsx        # Cash игра
│   │   └── multiplayer/page.tsx # Multiplayer (будущее)
│   │
│   └── api/                      # API Routes
│       ├── auth/                 # Аутентификация
│       │   ├── register/
│       │   ├── login/
│       │   ├── google/
│       │   └── yandex/
│       └── user-ranges/          # Управление диапазонами
│
├── lib/                          # Бизнес-логика
│   ├── redux/                    # State management
│   │   ├── slices/              # Redux slices
│   │   │   ├── tableSlice.ts   # Состояние столов (~1483 строк)
│   │   │   └── authSlice.ts    # Состояние аутентификации
│   │   ├── types/               # TypeScript типы
│   │   │   └── tableTypes.ts   # User, TablePosition, etc.
│   │   ├── utils/               # Утилиты Redux
│   │   │   └── tableUtils.ts   # getAvailableActions, generateUsers
│   │   ├── store.ts             # Redux store
│   │   ├── hooks.ts             # Типизированные хуки
│   │   └── provider.tsx         # Redux Provider
│   │
│   ├── db/                       # Database layer
│   │   ├── connection.ts        # PostgreSQL pool
│   │   └── schema.sql           # Схема БД
│   │
│   ├── auth/                     # Аутентификация
│   │   ├── jwt.ts               # JWT токены
│   │   ├── password.ts          # Bcrypt hashing
│   │   └── oauth/               # OAuth 2.0
│   │       ├── google.ts
│   │       └── yandex.ts
│   │
│   ├── utils/                    # Утилиты
│   │   ├── tournamentRangeLoader.ts  # Загрузка диапазонов оппонентов
│   │   ├── heroRangeLoader.ts        # Загрузка Hero диапазонов
│   │   ├── rangeExpander.ts          # Разворачивание нотации
│   │   ├── cardUtils.ts              # Работа с картами
│   │   ├── equityCalculator.ts       # Расчёт эквити
│   │   └── stackSize.ts              # Категории стеков
│   │
│   └── constants/                # Константы
│       ├── tournamentRanges_*.json   # Диапазоны оппонентов
│       ├── heroRanges/               # Hero диапазоны
│       │   ├── heroRanges_micro_100bb.json
│       │   ├── heroRanges_micro_200bb.json
│       │   └── heroRanges_low_100bb.json
│       └── equityTable.ts            # Таблицы эквити
│
└── components/                   # React компоненты
    ├── Header.tsx               # Навигация + Auth
    ├── PokerTable.tsx           # Главный компонент стола
    ├── PlayerSeat.tsx           # Компонент игрока
    ├── RangeSelector.tsx        # Матрица 13x13 для диапазонов
    ├── CardSelector.tsx         # Выбор карт Hero
    ├── BoardCardSelector.tsx    # Выбор карт борда
    ├── TournamentSettings.tsx   # Настройки турнира
    └── PlayerSettingsPopup.tsx  # Глобальные настройки + конструктор
```

---

## Data Flow

### Client-Server взаимодействие

```
┌──────────────┐
│    User      │
│  Interaction │
└──────┬───────┘
       │
       ↓
┌──────────────────────────────┐
│   React Component            │
│   (PokerTable, PlayerSeat)   │
└──────┬───────────────────────┘
       │ dispatch(action)
       ↓
┌──────────────────────────────┐
│   Redux Store (tableSlice)   │
│   - State update             │
│   - Middleware execution     │
└──────┬───────────────────────┘
       │ state change
       ↓
┌──────────────────────────────┐
│   Component Re-render        │
│   (useAppSelector)           │
└──────────────────────────────┘
```

### API Request Flow

```
┌──────────────┐
│  Component   │
└──────┬───────┘
       │ fetch('/api/...')
       ↓
┌──────────────────────────────┐
│   Next.js API Route          │
│   - JWT verification         │
│   - Request validation       │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│   Database Query             │
│   (PostgreSQL)               │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│   Response + Redux update    │
└──────────────────────────────┘
```

---

## Redux State Management

### Store Structure

```typescript
{
  auth: {
    token: string | null,
    email: string | null
  },
  table: {
    // 6-Max состояние
    sixMaxUsers: User[],
    sixMaxStage: TournamentStage,
    sixMaxCategory: TournamentCategory,
    sixMaxStartingStack: number,
    sixMaxBounty: boolean,
    sixMaxAutoAllIn: boolean,
    sixMaxActiveRangeSetId: number | null,
    sixMaxActiveRangeSetName: string | null,
    sixMaxActiveRangeSetData: RangeSetData | null,

    // 8-Max состояние (аналогично)
    eightMaxUsers: User[],
    // ...

    // Cash состояние (аналогично)
    cashUsers: User[],
    // ...
  }
}
```

### Action Pattern

**Для настроек стола:**
```typescript
setSixMaxStage: (state, action: PayloadAction<TournamentStage>) => {
  state.sixMaxStage = action.payload;
}
```

**Для игроков:**
```typescript
setSixMaxPlayerAction: (state, action: PayloadAction<{
  index: number;
  action: PlayerAction
}>) => {
  state.sixMaxUsers[action.payload.index].action = action.payload.action;
}
```

### Модульная архитектура Redux

**До рефакторинга:**
- `tableSlice.ts`: 1809 строк (всё в одном файле)

**После рефакторинга:**
- `tableSlice.ts`: 1483 строк (только reducers и actions)
- `tableTypes.ts`: 104 строки (все типы)
- `tableUtils.ts`: 257 строк (утилиты)

**Преимущества:**
- Улучшенная читаемость
- Легче тестировать
- Re-usability утилит
- Лучшая типизация

---

## Система диапазонов

### Двухуровневая архитектура

```
┌─────────────────────────────────────────────┐
│         Range System Architecture           │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────┐    ┌──────────────────┐ │
│  │  Opponent     │    │  Hero Ranges     │ │
│  │  Ranges       │    │  (No strength)   │ │
│  │               │    │                  │ │
│  │  Structure:   │    │  Structure:      │ │
│  │  user.stages  │    │  hero.stages     │ │
│  │    .positions │    │    .positions    │ │
│  │    .strength  │    │    .playStyle    │ │
│  │    .playStyle │    │    .stack        │ │
│  │    .stack     │    │    .action       │ │
│  │    .action    │    │                  │ │
│  └───────────────┘    └──────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

### Range Sources Priority

```
1. Custom DB Ranges (if activeRangeSetData !== null)
   ↓
2. Default JSON Ranges (tournamentRanges_*.json)
   ↓
3. Empty Range ([])
```

### Range Loading Flow

```typescript
// Component вызывает
dispatch(setSixMaxPlayerStrength({ index: 0, strength: 'amateur' }));

// Reducer в tableSlice.ts
setSixMaxPlayerStrength: (state, action) => {
  const user = state.sixMaxUsers[action.payload.index];
  user.strength = action.payload.strength;

  // Автоматическая перезагрузка диапазона
  if (user.action) {
    const pokerAction = convertPlayerActionToPokerAction(user.action);
    user.range = getRangeWithTournamentSettings(
      user.position,
      user.strength,
      user.playStyle,
      user.stackSize,
      pokerAction,
      state.sixMaxStartingStack,
      state.sixMaxStage,
      state.sixMaxCategory,
      state.sixMaxBounty,
      state.sixMaxActiveRangeSetData // Custom DB data или null
    );
  }
}
```

### Range Filtering with Blockers

```typescript
// Новая функция для фильтрации диапазона с учётом блокеров
import { filterOpponentRange } from '@/lib/utils/filterOpponentRange';

const result = filterOpponentRange({
  opponentRange: ['AA', 'KK', 'QQ', 'AKs'],
  heroCards: ['Ahearts', 'Kdiamonds'],
  boardCards: ['Qhearts', 'Jhearts', 'Thearts', null, null]
});

// Результат содержит:
// - filteredCombinations: массив возможных комбинаций
// - filteredCount: количество после фильтрации
// - remainingPercentage: процент оставшихся рук
// - blockers: список блокирующих карт

// Flow фильтрации:
// 1. expandRange(['AA', 'KK']) → все комбинации
// 2. Собрать блокеры (Hero cards + board cards)
// 3. filterCombinations(combinations, blockers)
// 4. Вернуть результат со статистикой
```

---

## API Layer

### Endpoint Structure

```
/api/
├── auth/
│   ├── register         POST   - Регистрация (email/password)
│   ├── login            POST   - Вход (email/password)
│   ├── google           GET    - OAuth Google redirect
│   ├── google/callback  GET    - OAuth Google callback
│   ├── yandex           GET    - OAuth Yandex redirect
│   └── yandex/callback  GET    - OAuth Yandex callback
│
└── user-ranges/
    ├── get              GET    - Список всех диапазонов
    ├── create           POST   - Создание набора
    ├── update           PUT    - Обновление набора
    ├── [id]             GET    - Получение по ID
    └── [id]             DELETE - Удаление по ID
```

### Authentication Middleware

```typescript
// Каждый защищённый endpoint проверяет JWT
const token = extractTokenFromHeader(request);
const decoded = verifyToken(token);

if (!decoded) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// decoded.userId доступен для query
```

---

## База данных

### Schema Overview

```sql
-- Пользователи
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),              -- NULL для OAuth
  provider VARCHAR(50),               -- 'email' | 'google' | 'yandex'
  google_id VARCHAR(255),             -- Google user ID
  yandex_id VARCHAR(255),             -- Yandex user ID
  created_at TIMESTAMP DEFAULT NOW()
);

-- Пользовательские диапазоны
CREATE TABLE user_range_sets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  table_type VARCHAR(20) NOT NULL,    -- '6-max' | '8-max' | 'cash'
  category VARCHAR(20) NOT NULL,      -- 'micro' | 'low' | 'mid' | 'high'
  starting_stack INTEGER NOT NULL,
  bounty BOOLEAN NOT NULL,
  range_data JSONB NOT NULL,          -- Полная структура диапазонов
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_range_sets_user_id ON user_range_sets(user_id);
CREATE INDEX idx_user_range_sets_table_type ON user_range_sets(table_type);
```

### JSONB Range Data

Преимущества хранения в JSONB:
- Гибкость структуры
- Поддержка сложных вложенных объектов
- Индексирование для быстрого поиска
- Обратная совместимость (старый формат без stages)

---

## Аутентификация

### JWT Flow

```
1. User login/register
   ↓
2. Server generates JWT (7 days expiry)
   ↓
3. Client stores token in localStorage
   ↓
4. Client sends token in Authorization header
   ↓
5. Server verifies token on protected endpoints
```

### OAuth 2.0 Flow

```
1. User clicks "Login with Google/Yandex"
   ↓
2. Redirect to /api/auth/google or /api/auth/yandex
   ↓
3. Server redirects to provider's authorization page
   ↓
4. User approves access
   ↓
5. Provider redirects to callback URL with code
   ↓
6. Server exchanges code for access_token
   ↓
7. Server fetches user info from provider
   ↓
8. Server creates/updates user in DB
   ↓
9. Server generates JWT
   ↓
10. Redirect to homepage with token in URL
    ↓
11. Client extracts token and saves to localStorage
```

---

## Performance Optimizations

### Redux
- Используем `immer` (встроен в Redux Toolkit) для immutable updates
- Мemoization с `useMemo` для дорогих вычислений
- Selective re-renders с правильными селекторами

### Database
- Индексы на часто используемые поля (user_id, table_type)
- JSONB для гибких структур данных
- Connection pooling с node-postgres

### Frontend
- Next.js App Router для автоматического code splitting
- Dynamic imports для тяжёлых компонентов
- Tailwind CSS для minimal CSS bundle

---

## Будущие улучшения

### Планируемые фичи
- [ ] Real-time multiplayer через WebSockets
- [ ] Unit и integration тесты
- [ ] Rate limiting для API
- [ ] Кэширование диапазонов на клиенте
- [ ] PWA поддержка
- [ ] Экспорт/импорт диапазонов в различных форматах
- [ ] Анализ истории игр
- [ ] AI-powered рекомендации

### Технический долг
- [ ] Добавить E2E тесты (Playwright)
- [ ] Улучшить error handling
- [ ] Добавить logging system
- [ ] Настроить CI/CD pipeline
- [ ] Docker контейнеризация

---

## Диаграммы

### Component Hierarchy

```
App
└── Layout
    ├── Header
    │   ├── AuthButtons
    │   └── PlayerSettingsPopup
    │       ├── RangeBuilder
    │       └── GlobalSettings
    │
    └── Page (6-max/8-max/cash)
        └── PokerTable
            ├── PlayerSeat (x6 или x8)
            │   ├── CardSelector (Hero only)
            │   ├── PlayerActionDropdown
            │   └── RangeSelector
            │
            ├── BoardCardSelector
            └── TournamentSettings
```

---

## Заключение

Эта архитектура обеспечивает:
- **Модульность**: Легко добавлять новые фичи
- **Масштабируемость**: Redux для state, PostgreSQL для данных
- **Типобезопасность**: Strict TypeScript без `any`
- **Производительность**: Оптимизированный Redux, индексы БД
- **Безопасность**: JWT + OAuth 2.0, bcrypt hashing

Для детальной информации см. [CLAUDE.md](./CLAUDE.md).
