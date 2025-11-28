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
├── lib/
│   ├── redux/             # Redux store, slices, hooks, provider
│   ├── types/             # TypeScript интерфейсы
│   ├── db/                # PostgreSQL логика
│   ├── auth/              # JWT, OAuth, password hashing
│   ├── utils/             # Утилиты (карты, диапазоны, эквити, стеки)
│   └── constants/         # Константы (диапазоны рук, таблицы эквити)
├── components/            # React компоненты
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
- `auth` slice - аутентификация (JWT token, email)
- `table` slice - состояние игровых столов (игроки, позиции, карты, действия)

**Table Slice** (`lib/redux/slices/tableSlice.ts`) - центральный слайс:

Управляет тремя типами столов: `sixMaxUsers`, `eightMaxUsers`, `cashUsers`

**Структура игрока (User)**:
- Основные данные: `name`, `stack`, `bet`, `position` (BTN/SB/BB/UTG/etc.)
- Характеристики: `strength` (fish/amateur/regular), `playStyle` (tight/balanced/aggressor), `stackSize` (very-small/small/medium/big)
- Игровые данные: `cards` (только для Hero), `range` (массив строк ["AA", "AKs"]), `action` (fold/call/check/bet-open/raise-3bet/etc.)

**Настройки стола** (для каждого типа):
- Турнирные: `stage`, `category`, `startingStack`, `bounty`
- Глобальные: `autoAllIn` - всегда ставить весь стек для всех игроков
- Пользовательские диапазоны: `activeRangeSetId`, `activeRangeSetName`, `activeRangeSetData`

**Ключевые функции**:
- `getRangeWithTournamentSettings(customRangeData?)` - загрузка диапазонов (из БД или дефолтных JSON)
- `getAvailableActions()` - определяет доступные действия в зависимости от состояния стола

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

**Дефолтные диапазоны**: `lib/constants/tournamentRanges.json` - JSON файл со всеми диапазонами для турниров

**Loader**: `lib/utils/tournamentRangeLoader.ts` - утилита для загрузки диапазонов

### Структура диапазонов в JSON

```
ranges.user.stages.{STAGE}.positions.{POSITION}.{strength}.{playStyle}.ranges_by_stack.{stackSize}.{action}
```

**Пример пути**: `early → UTG → fish → tight → short → open_raise`

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

- `getRangeForTournament()` - загружает из дефолтных JSON файлов
- `getRangeFromData()` - загружает из пользовательских данных (БД)
- `getTournamentRangeFromJSON()` - извлекает диапазон из JSON структуры
- `expandRange()` - разворачивает нотацию (например, "AKs") в массив конкретных рук

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

**Доступные действия** (`getAvailableActions()` в `tableSlice.ts`):
- Базовые действия всегда доступны: fold, call, check, bet-open, all-in
- Raise-действия доступны только если:
  1. Есть соответствующее предыдущее действие на столе
  2. У игрока достаточно фишек (>80% стека)
  3. Размер raise >= 2.5x от текущей максимальной ставки
- Последовательность: bet-open → raise-3bet → raise-4bet → raise-5bet

### Range Builder Workflow

**Доступ**: Header → клик по email → PlayerSettingsPopup → вкладка "Конструктор диапазонов"

**Функции**:
1. Выбор параметров: позиция, сила, стиль, стек, действие
2. Визуальная матрица 13x13 для выбора рук
3. Сохранение и редактирование множества диапазонов
4. Экспорт в JSON (копирование или скачивание)
5. Формат совместим с `lib/constants/tournamentRanges.json`

**Важно**: Конструктор для создания новых диапазонов. Для изменения диапазонов конкретных игроков → RangeSelector (клик по игроку).

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
- Избегайте `any` - создавайте типизированные интерфейсы
- Все неиспользуемые переменные и импорты должны быть удалены
- При работе с динамическими структурами используйте `Record<string, T>`
- Для индексации объектов с динамическими ключами: `(obj as Record<string, string>)[key]`

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

### Range Utilities (`lib/utils/rangeExpander.ts`)
- `expandRange()` - разворачивает нотацию в массив рук
- Поддерживает suited (s), offsuit (o), пары, диапазоны ("22+", "A2s+")

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
