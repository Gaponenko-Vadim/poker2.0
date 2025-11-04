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
  - `name`, `stack`, `bet` (текущая ставка), `strength` (fish/amateur/regular), `playStyle` (tight/balanced/aggressor), `stackSize` (very-small/small/medium/big)
  - `position` (BTN/SB/BB/UTG/UTG+1/MP/HJ/CO)
  - `cards` (только для Hero - массив из двух карт или null)
  - `range` (массив строк типа ["AA", "AKs", "JTo"])
  - `action` (fold/call/check/bet-open/raise-3bet/raise-4bet/raise-5bet/all-in)
- Настройки стола (для каждого типа: sixMax, eightMax, cash):
  - `stage` (early/middle/pre-bubble/late/pre-final/final) - стадия турнира
  - `category` (micro/low/mid/high) - категория по buy-in
  - `startingStack` (100 или 200 BB) - начальный стек турнира
  - `bounty` (boolean) - турнир с баунти
  - `autoAllIn` (boolean) - глобальная настройка: всегда ставить весь стек для всех игроков
- Редьюсеры для ротации позиций, изменения карт, диапазонов, силы, размера стека, действий и настроек игроков
- `getAvailableActions()` - определяет доступные действия в зависимости от состояния стола (raise возможен только после bet-open, учитывает размер стека)

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

**Конвертация действий** (`convertPlayerActionToPokerAction()` в `tableSlice.ts`):

- UI использует `PlayerAction`: bet-open, raise-3bet, raise-4bet, raise-5bet, all-in
- JSON диапазоны используют `PokerAction`: open, threeBet, fourBet, fiveBet, allIn
- Функция автоматически конвертирует между форматами при загрузке диапазонов
- Действия fold/call/check по умолчанию конвертируются в "open"

**Автоматическая загрузка диапазонов**:

- При изменении любого параметра игрока (сила, стиль, размер стека, действие) диапазон автоматически обновляется
- Функция `getRangeWithTournamentSettings()` учитывает все турнирные параметры стола
- Если диапазон не найден в JSON, возвращается пустой массив
- Для cash-игр используется упрощенная логика без турнирных параметров

**Устаревшие файлы** (сохранены для совместимости):
- `lib/constants/defaultRanges.ts` - старая TypeScript структура (больше не используется)
- `lib/constants/tournamentRanges.ts` - TypeScript типы (используется только для генерации JSON)

### Component Architecture

**Header** (`components/Header.tsx`):

- Верхний компонент навигации и авторизации
- При аутентификации отображает email пользователя с иконкой профиля
- **Клик по email пользователя** (`onProfileClick`) открывает глобальные настройки игры (PlayerSettingsPopup)
- Управляет входом/выходом и регистрацией

**PokerTable** (`components/PokerTable.tsx`):

- Главный компонент стола, управляет отображением игроков
- Принимает `users`, `heroIndex`, `tableType` и колбэки для действий

**PlayerSeat** (`components/PlayerSeat.tsx`):

- Отдельный игрок за столом
- Отображает позицию, стек, силу, карты (для Hero), действия
- Визуальные фишки позиций:
  - BTN (D) - белая фишка с тенью
  - SB - зеленая фишка
  - BB - красная фишка
- При клике на Hero открывается CardSelector, на других игроков - RangeSelector

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
- Принимает `allPlayersActions` и `allPlayersBets` для анализа состояния стола
- Поддерживает изменение ставки (`onBetChange`) при выборе действия
- Если `autoAllIn === true`, all-in выполняется сразу без попапа подтверждения
- Если `autoAllIn === false`, при выборе all-in показывается попап с выбором: "Поставить весь стек" / "Указать свой размер"

**PlayerStackSize**:

- Компонент для отображения и изменения размера стека игрока
- Опции: very-small (≤10 BB), small (10-20 BB), medium (20-40 BB), big (>40 BB)

**PlayerPlayStyle**:

- Компонент для отображения и изменения стиля игры
- Опции: tight (тайт), balanced (баланс), aggressor (агрессор)
- Расположен слева от игрока

**PlayerSettingsPopup**:

- Popup-окно для глобальных настроек игры
- Управляет глобальным флагом `autoAllIn` - "всегда ставить весь стек"
- **Важно**: Настройка применяется ко ВСЕМ действиям у ВСЕХ игроков за столом
- Открывается через клик по email пользователя в Header (onProfileClick)

**TournamentSettings**:

- Компонент настроек турнирных параметров
- Управляет:
  - `stage` - стадия турнира (early/middle/pre-bubble/late/pre-final/final)
  - `category` - категория по buy-in (micro/low/mid/high)
  - `startingStack` - начальный стек (100 или 200 BB)
  - `bounty` - флаг турнира с баунти
  - `averageStack` - средний стек стола (связан со стадией)
  - `ante` - размер анте (для турниров)

**PotDisplay**:

- Отображение текущего размера банка

### Pages Structure

**Game Tables**:

- `/tables/6-max` - 6-макс турнир
- `/tables/8-max` - 8-макс турнир
- `/tables/cash` - кеш игра (2-9 игроков)

Каждая страница использует свой набор Redux actions и отображает PokerTable с соответствующими данными из store.

**Temporary Files**:

- `temp_6max_backup.tsx` - резервная копия страницы 6-max (не используется в production)

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

### Global Auto All-In Setting

**Назначение**: Глобальная настройка "всегда ставить весь стек" для всех игроков за столом

**Логика работы**:
- Настройка применяется ко ВСЕМ действиям (actions) у ВСЕХ игроков за столом
- Доступ: Header → клик по email пользователя → открывается PlayerSettingsPopup
- Единая глобальная настройка на уровне стола, а не индивидуальная для каждого игрока

**Реализация**:
- Глобальные поля в `tableSlice.ts`: `sixMaxAutoAllIn`, `eightMaxAutoAllIn`, `cashAutoAllIn`
- Actions: `setSixMaxAutoAllIn(boolean)`, `setEightMaxAutoAllIn(boolean)`, `setCashAutoAllIn(boolean)`
- Передается через props: Page → PokerTable → PlayerSeat → PlayerActionDropdown
- В `PlayerActionDropdown`: если `autoAllIn === true`, all-in выполняется сразу без попапа подтверждения

### Betting Logic

**Логика доступных действий** (`getAvailableActions()` в `tableSlice.ts`):

- Базовые действия всегда доступны: fold, call, check, bet-open, all-in
- Raise-действия (raise-3bet, raise-4bet, raise-5bet) доступны только если:
  1. Есть соответствующее предыдущее действие на столе
  2. У игрока достаточно фишек (>80% стека для raise)
  3. Размер raise >= 2.5x от текущей максимальной ставки
- Последовательность raise: bet-open → raise-3bet → raise-4bet → raise-5bet
- Каждый игрок имеет поле `bet` для отслеживания текущей ставки

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
- Стадии турнира: early, middle, pre-bubble, late, pre-final, final (lowercase с дефисом)
- Категории турнира: micro, low, mid, high (lowercase)

**Важно**: В `lib/types/actions.ts` определены устаревшие типы действий (bet, raise, 3-bet и т.д.). Основное приложение использует другую номенклатуру, определенную в `tableSlice.ts` (bet-open, raise-3bet и т.д.). При работе с действиями игрока всегда используйте типы из `tableSlice.ts`.

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

### Tournament Range Loader (`lib/utils/tournamentRangeLoader.ts`)

- `getRangeForTournament()` - загружает диапазон из JSON с учетом всех турнирных параметров
- Принимает: позицию, силу, стиль, размер стека, действие, начальный стек, стадию, категорию, bounty
- `shouldUseTournamentRanges()` - определяет, нужно ли использовать турнирные диапазоны

## Database Setup

Перед первым запуском необходимо настроить PostgreSQL:

1. Установить PostgreSQL и создать БД: `CREATE DATABASE poker;`
2. Настроить `.env.local` с параметрами подключения (см. Environment Variables выше)
3. Запустить инициализацию: `npm run db:init`

Подробная инструкция в `DATABASE_SETUP.md`
