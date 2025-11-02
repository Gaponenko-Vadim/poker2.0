# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Покерное приложение-тренажер для обучения игре в покер. Позволяет симулировать игровые ситуации за столом с настраиваемыми игроками, их позициями и диапазонами рук. Поддерживает форматы 6-Max, 8-Max турниры и Cash игры (2-9 игроков).

## Technology Stack

- **Framework**: Next.js 16.0.0 (App Router)
- **React**: 19.2.0
- **TypeScript**: ^5
- **State Management**: Redux Toolkit 2.9.2 with React-Redux 9.2.0
- **Database**: PostgreSQL with node-postgres (pg 8.16.3)
- **Authentication**: JWT (jsonwebtoken 9.0.2) + bcryptjs 3.0.2
- **Styling**: Tailwind CSS 4 with PostCSS
- **Icons**: Heroicons React 2.2.0
- **Fonts**: Geist and Geist Mono

## Development Commands

- `npm run dev` - Запуск dev-сервера на http://localhost:3000
- `npm run build` - Production сборка
- `npm start` - Запуск production сервера
- `npm run lint` - Проверка кода через ESLint
- `npm run db:init` - Инициализация базы данных PostgreSQL (создание таблиц)

## Project Structure

### Core Directories

- `app/` - Next.js App Router с роутами и API endpoints
  - `app/tables/` - Страницы игровых столов (6-max, 8-max, cash)
  - `app/api/` - API routes для аутентификации и БД
- `lib/` - Основная бизнес-логика
  - `lib/redux/` - Redux store, slices, hooks, provider
  - `lib/types/` - TypeScript интерфейсы и типы
  - `lib/db/` - Логика работы с PostgreSQL
  - `lib/auth/` - JWT и хеширование паролей
  - `lib/utils/` - Утилиты (парсинг карт, расширение диапазонов, расчет эквити, размеры стека)
  - `lib/constants/` - Константы (дефолтные диапазоны рук для всех позиций/стилей/стеков, таблицы эквити)
- `components/` - React компоненты (PokerTable, PlayerSeat, CardSelector, RangeSelector и т.д.)
- `scripts/` - Утилиты для инициализации БД

## Architecture

### State Management (Redux Toolkit)

**Store Structure** (`lib/redux/store.ts`):

- `auth` slice - аутентификация пользователя (JWT token, email)
- `table` slice - состояние игровых столов (игроки, позиции, карты, действия)

**Table Slice** (`lib/redux/slices/tableSlice.ts`) - центральный слайс приложения:

- Управляет тремя типами столов: `sixMaxUsers`, `eightMaxUsers`, `cashUsers`
- Каждый игрок (`User`) содержит:
  - `name`, `stack`, `strength` (fish/amateur/regular), `playStyle` (tight/balanced/aggressor), `stackSize` (very-small/small/medium/big)
  - `position` (BTN/SB/BB/UTG/UTG+1/MP/HJ/CO)
  - `cards` (только для Hero - массив из двух карт или null)
  - `range` (массив строк типа ["AA", "AKs", "JTo"])
  - `action` (fold/call/check/bet-open/raise-3bet/raise-4bet/raise-5bet/all-in)
- Редьюсеры для ротации позиций, изменения карт, диапазонов, силы, размера стека и действий игроков
- `getAvailableActions()` - определяет доступные действия в зависимости от состояния стола (raise возможен только после bet-open)

**Auth Slice** (`lib/redux/slices/authSlice.ts`):

- `login`, `logout`, `restoreSession` actions
- Сохранение токена в localStorage

### Database Layer

**Connection** (`lib/db/connection.ts`):

- PostgreSQL connection pool с конфигурацией через переменные окружения
- Функция `testConnection()` для проверки подключения

**Initialization** (`lib/db/init.ts`):

- Создание таблицы `users` (id, email, password_hash, created_at)
- Функция `initDatabase()` и `checkTables()` для настройки БД

### Authentication

**JWT** (`lib/auth/jwt.ts`):

- `generateToken()` - создание токена со сроком 7 дней
- `verifyToken()` - проверка и декодирование токена
- `extractTokenFromHeader()` - извлечение из Authorization header

**Password** (`lib/auth/password.ts`):

- bcryptjs для хеширования паролей
- `hashPassword()` и `verifyPassword()` функции

**API Routes**:

- `POST /api/auth/register` - регистрация нового пользователя
- `POST /api/auth/login` - вход с email/password, возврат JWT

### Card System

**Card Format** (`lib/redux/slices/tableSlice.ts`):

- Карты в формате строк: "6hearts", "Aspades", "Kdiamonds", "2clubs"
- `CardRank`: 2-9, T (10), J, Q, K, A
- `CardSuit`: hearts, diamonds, clubs, spades

**Range System**:

**Основной источник данных**: `lib/constants/tournamentRanges.json` - JSON файл со всеми диапазонами для турниров

- **Loader**: `lib/utils/tournamentRangeLoader.ts` - утилита для загрузки диапазонов из JSON
- Формат нотации: "AA" (пары), "AKs" (suited), "AKo" (offsuit)
- Структура диапазонов в JSON:
  - `ranges.user.positions.{POSITION}.{strength}.{playStyle}.ranges_by_stack.{stackSize}.{action}`
  - Пример пути: UTG → fish → tight → short → open_raise
- Типы действий в JSON: `open_raise`, `push_range`, `call_vs_shove`, `defense_vs_open`, `3bet`, `defense_vs_3bet`, `4bet`, `defense_vs_4bet`, `5bet`, `defense_vs_5bet`
- `getRangeForTournament()` - главная функция для получения диапазона по параметрам игрока
- Диапазоны автоматически подгружаются при изменении параметров игрока (сила, стиль, стек, действие)
- Утилита `rangeExpander.ts` - разворачивает нотацию диапазонов в полный список рук

**Устаревшие файлы** (сохранены для совместимости):
- `lib/constants/defaultRanges.ts` - старая TypeScript структура (больше не используется)
- `lib/constants/tournamentRanges.ts` - TypeScript типы (используется только для генерации JSON)

### Component Architecture

**PokerTable** (`components/PokerTable.tsx`):

- Главный компонент стола, управляет отображением игроков
- Принимает `users`, `heroIndex`, `tableType` и колбэки для действий

**PlayerSeat** (`components/PlayerSeat.tsx`):

- Отдельный игрок за столом
- Отображает позицию, стек, силу, карты (для Hero), действия

**CardSelector** / **CardPickerPopup**:

- UI для выбора карт Hero
- Показывает все возможные карты с учетом уже выбранных

**RangeSelector**:

- Компонент для настройки диапазона рук противников
- Визуальный выбор из матрицы 13x13

**PlayerActionDropdown**:

- Дропдаун для выбора действия игрока
- Показывает доступные действия в зависимости от ситуации
- Использует `getAvailableActions()` для фильтрации опций

**PlayerStackSize**:

- Компонент для отображения и изменения размера стека игрока
- Опции: very-small (≤10 BB), small (10-20 BB), medium (20-40 BB), big (>40 BB)

**PlayerPlayStyle**:

- Компонент для отображения и изменения стиля игры
- Опции: tight (тайт), balanced (баланс), aggressor (агрессор)
- Расположен слева от игрока

**TournamentSettings**:

- Компонент настроек турнирных параметров
- Управляет стадией турнира и другими глобальными настройками

**PotDisplay**:

- Отображение текущего размера банка

### Pages Structure

**Game Tables**:

- `/tables/6-max` - 6-макс турнир
- `/tables/8-max` - 8-макс турнир
- `/tables/cash` - кеш игра (2-9 игроков)

Каждая страница использует свой набор Redux actions и отображает PokerTable с соответствующими данными из store.

## TypeScript Configuration

- Path alias `@/*` для импорта из корня проекта
- Strict mode включен
- Target: ES2017 с JSX: react-jsx

## Environment Variables

Создайте `.env.local` для работы с PostgreSQL:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=poker
JWT_SECRET=your-secret-key
```

## Key Patterns

### Redux Usage

- Используйте типизированные хуки `useAppDispatch` и `useAppSelector` из `lib/redux/hooks.ts`
- Всегда импортируйте actions из slices явно
- Store создается через factory функцию `makeStore()` для поддержки SSR

### Page Structure

- Все игровые страницы - Client Components (`"use client"`)
- Получение данных из Redux, не из props
- Колбэки для изменений диспатчат actions в store

### Naming Conventions

- Позиции: BTN, SB, BB, UTG, UTG+1, MP, HJ, CO (uppercase)
- Сила игрока: fish, amateur, regular (lowercase, fish - фиш, amateur - любитель, regular - регуляр)
- Стиль игры: tight, balanced, aggressor (lowercase, tight - тайт, balanced - баланс, aggressor - агрессор)
- Размер стека: very-small, small, medium, big (lowercase с дефисом)
- Действия игрока: fold, call, check, bet-open, raise-3bet, raise-4bet, raise-5bet, all-in
- Действия для диапазонов: open, threeBet, fourBet, fiveBet, allIn (camelCase)

## Utilities

### Card Utilities (`lib/utils/cardUtils.ts`)

- `parseCard()` - парсит строку карты в объект `{rank, suit}`
- `isValidCard()` - проверяет валидность карты
- `getAllCards()` - возвращает полную колоду (52 карты)

### Range Expander (`lib/utils/rangeExpander.ts`)

- `expandRange()` - разворачивает нотацию диапазона (например, "AKs") в массив конкретных рук
- Поддерживает suited (s), offsuit (o), пары (без суффикса), диапазоны (например, "22+", "A2s+")

### Equity Calculator (`lib/utils/equityCalculator.ts`, `calculateEquity.ts`)

- Расчет эквити рук Hero против диапазонов оппонентов
- Использует предрассчитанные таблицы из `lib/constants/equityTable.ts`

### Stack Size (`lib/utils/stackSize.ts`)

- `getStackSizeCategory()` - определяет категорию стека по количеству BB
- Пороги: ≤10 (very-small), 10-20 (small), 20-40 (medium), >40 (big)

## Database Setup

Перед первым запуском необходимо настроить PostgreSQL:

1. Установить PostgreSQL и создать БД: `CREATE DATABASE poker;`
2. Настроить `.env.local` с параметрами подключения (см. Environment Variables выше)
3. Запустить инициализацию: `npm run db:init`

Подробная инструкция в `DATABASE_SETUP.md`
