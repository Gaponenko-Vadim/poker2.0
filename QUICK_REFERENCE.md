# Quick Reference Guide

Краткая справка по наиболее часто используемым паттернам и командам.

## 🚀 Быстрый старт

```bash
npm install                  # Установка зависимостей
cp .env.example .env.local  # Копирование переменных окружения
npm run db:init             # Инициализация БД
npm run dev                 # Запуск dev-сервера
```

## 📁 Часто используемые файлы

| Файл | Назначение |
|------|------------|
| `lib/redux/slices/tableSlice.ts` | Redux reducers и actions |
| `lib/redux/types/tableTypes.ts` | TypeScript типы |
| `lib/redux/utils/tableUtils.ts` | Redux утилиты |
| `lib/utils/tournamentRangeLoader.ts` | Загрузка диапазонов оппонентов |
| `lib/utils/heroRangeLoader.ts` | Загрузка Hero диапазонов |
| `components/PokerTable.tsx` | Главный компонент стола |
| `components/PlayerSeat.tsx` | Компонент игрока |

## 🎯 Redux Patterns

### Использование хуков

```typescript
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';

// В компоненте
const dispatch = useAppDispatch();
const users = useAppSelector((state) => state.table.sixMaxUsers);
```

### Dispatch actions

```typescript
// Настройки стола
dispatch(setSixMaxStage('early'));
dispatch(setSixMaxCategory('micro'));
dispatch(setSixMaxBounty(true));

// Настройки игрока (с индексом)
dispatch(setSixMaxPlayerStrength({ index: 0, strength: 'amateur' }));
dispatch(setSixMaxPlayerPlayStyle({ index: 0, playStyle: 'balanced' }));
dispatch(setSixMaxPlayerAction({ index: 0, action: 'bet-open' }));
```

### Получение данных из state

```typescript
const stage = useAppSelector((state) => state.table.sixMaxStage);
const users = useAppSelector((state) => state.table.sixMaxUsers);
const autoAllIn = useAppSelector((state) => state.table.sixMaxAutoAllIn);
```

## 🃏 Система диапазонов

### Загрузка диапазона оппонента

```typescript
import { getRangeWithTournamentSettings } from '@/lib/redux/utils/tableUtils';

const range = getRangeWithTournamentSettings(
  position,        // "BTN", "SB", "BB", "UTG", etc.
  strength,        // "fish", "amateur", "regular"
  playStyle,       // "tight", "balanced", "aggressor"
  stackSize,       // "very-small", "small", "medium", "big"
  pokerAction,     // "open", "threeBet", "fourBet", "fiveBet", "allIn"
  startingStack,   // 100, 200, etc.
  stage,           // "early", "middle", "pre-bubble", "late", "pre-final", "final"
  category,        // "micro", "low", "mid", "high"
  bounty,          // true/false
  customRangeData  // null или данные из БД (RangeSetData)
);
```

### Загрузка Hero диапазона

```typescript
import { getHeroRangeFromJSON } from '@/lib/utils/heroRangeLoader';

const heroRange = getHeroRangeFromJSON(
  stage,           // Стадия турнира
  position,        // Позиция Hero
  playStyle,       // Стиль игры (БЕЗ strength!)
  stackSize,       // Размер стека
  action,          // Действие (TournamentActionType)
  category,        // Категория турнира
  startingStack,   // Начальный стек
  bounty           // Bounty турнир
);
```

### Структура путей диапазонов

**Оппоненты:**
```
ranges.user.stages.{STAGE}.positions.{POSITION}.{strength}.{playStyle}.ranges_by_stack.{stackSize}.{action}
```

**Hero:**
```
ranges.hero.stages.{STAGE}.positions.{POSITION}.{playStyle}.ranges_by_stack.{stackSize}.{action}
```

## 🔑 TypeScript типы

### Основные типы

```typescript
// Игрок
interface User {
  name: string;
  stack: number;
  stackSize: StackSize;
  strength: PlayerStrength;
  playStyle: PlayerPlayStyle;
  position: TablePosition;
  cards?: [Card | null, Card | null];
  range: string[];
  action: PlayerAction | null;
  bet: number;
}

// Типы значений
type PlayerStrength = "fish" | "amateur" | "regular";
type PlayerPlayStyle = "tight" | "balanced" | "aggressor";
type StackSize = "very-small" | "small" | "medium" | "big";
type TablePosition = "BTN" | "SB" | "BB" | "UTG" | "UTG+1" | "MP" | "HJ" | "CO";
type PlayerAction = "fold" | "call" | "check" | "bet-open" | "raise-3bet" | "raise-4bet" | "raise-5bet" | "all-in";
type TournamentStage = "early" | "middle" | "pre-bubble" | "late" | "pre-final" | "final";
type TournamentCategory = "micro" | "low" | "mid" | "high";

// Пользовательские диапазоны из БД
type RangeSetData = Record<string, unknown>;
```

## 🎨 Naming Conventions

| Сущность | Формат | Примеры |
|----------|--------|---------|
| Позиции | UPPERCASE | BTN, SB, BB, UTG |
| Сила игрока | lowercase | fish, amateur, regular |
| Стиль игры | lowercase | tight, balanced, aggressor |
| Размер стека | lowercase-dash | very-small, small, medium, big |
| Действия (UI) | lowercase-dash | bet-open, raise-3bet, raise-4bet |
| Действия (JSON) | camelCase | open, threeBet, fourBet |
| Стадии турнира | lowercase-dash | early, middle, pre-bubble |

## 📊 Полезные утилиты

### Генерация игроков

```typescript
import { generateUsers } from '@/lib/redux/utils/tableUtils';

// Генерирует игроков с дефолтными параметрами:
// - strength: "amateur"
// - playStyle: "balanced"
// - stackSize: "medium"
// - SB и BB с блайндами
const users = generateUsers(6); // для 6-max
```

### Доступные действия

```typescript
import { getAvailableActions } from '@/lib/redux/utils/tableUtils';

const actions = getAvailableActions(users, currentPlayerIndex);
// Возвращает: ["fold", "call", "bet-open", "all-in", ...]
```

### Конвертация действий

```typescript
import { convertPlayerActionToPokerAction } from '@/lib/redux/utils/tableUtils';

const pokerAction = convertPlayerActionToPokerAction('bet-open');
// Возвращает: "open"
```

### Фильтрация диапазона оппонента

```typescript
import { filterOpponentRange } from '@/lib/utils/filterOpponentRange';

// Убирает комбинации, которые пересекаются с картами Hero и борда
const result = filterOpponentRange({
  opponentRange: ['AA', 'KK', 'QQ', 'AKs'],
  heroCards: ['Ahearts', 'Kdiamonds'],
  boardCards: ['Qhearts', 'Jhearts', 'Thearts', null, null]
});

console.log(result.filteredCount);        // Количество возможных комбинаций
console.log(result.remainingPercentage);  // Процент оставшихся рук
console.log(result.blockers);             // Блокирующие карты
```

### Оценка силы покерной комбинации

```typescript
import { evaluateHand, compareHands, findBestHand } from '@/lib/utils/evaluateHand';

// Оценка комбинации из 5+ карт
const hand = evaluateHand(['Ahearts', 'Khearts', 'Qhearts', 'Jhearts', 'Thearts']);
console.log(hand.rank);         // "Royal Flush"
console.log(hand.description);  // "Роял Флеш"
console.log(hand.rankValue);    // 10

// Поиск лучшей комбинации из 7 карт (2 карты игрока + 5 борда)
const best = findBestHand(['Ah', 'Kh'], ['Qh', 'Jh', 'Th', '9s', '2c']);

// Сравнение двух рук
const comparison = compareHands(hand1, hand2);
// Возвращает: 1 (hand1 сильнее), -1 (hand2 сильнее), 0 (равны)
```

## 🌐 API Endpoints

### Аутентификация

```bash
# Регистрация
POST /api/auth/register
Body: { email, password }

# Вход
POST /api/auth/login
Body: { email, password }

# OAuth
GET /api/auth/google
GET /api/auth/yandex
```

### User Ranges

```bash
# Получить все диапазоны
GET /api/user-ranges/get?tableType=6-max
Headers: Authorization: Bearer TOKEN

# Создать набор
POST /api/user-ranges/create
Headers: Authorization: Bearer TOKEN
Body: { name, table_type, category, starting_stack, bounty, range_data }

# Обновить набор
PUT /api/user-ranges/update
Headers: Authorization: Bearer TOKEN
Body: { id, name, range_data }

# Получить по ID
GET /api/user-ranges/[id]
Headers: Authorization: Bearer TOKEN

# Удалить
DELETE /api/user-ranges/[id]
Headers: Authorization: Bearer TOKEN
```

## 🛠️ Dev Commands

```bash
npm run dev          # Dev-сервер (http://localhost:3000)
npm run build        # Production сборка
npm start            # Production сервер
npm run lint         # ESLint проверка
npx tsc --noEmit    # TypeScript проверка
npm run db:init     # Инициализация БД
```

## 🐛 Debug Tips

### Redux DevTools

```typescript
// State доступен в Redux DevTools
// Actions отслеживаются в timeline
// Time-travel debugging для воспроизведения багов
```

### Console Logs

```typescript
// ВАЖНО: Удаляйте console.log перед коммитом!
console.log('📥 Range loaded:', range.length, 'hands');
console.log('🎯 Player action:', user.action);
console.log('💰 Stack size:', user.stack, 'BB');
```

### TypeScript Errors

```bash
# Проверка типов
npx tsc --noEmit

# Частые ошибки:
# - "any" type → используйте Record<string, unknown>
# - Несовместимые типы → двойное приведение: as unknown as TargetType
# - Missing imports → проверьте path alias "@/"
```

## 📚 Документация

| Файл | Описание |
|------|----------|
| [README.md](./README.md) | Общее описание проекта |
| [CLAUDE.md](./CLAUDE.md) | Полная техническая документация |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Архитектура приложения |
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | API endpoints |
| [DATABASE_SETUP.md](./DATABASE_SETUP.md) | Настройка PostgreSQL |
| [OAUTH_SETUP.md](./OAUTH_SETUP.md) | Настройка OAuth |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Гайд для контрибьюторов |
| [CHANGELOG.md](./CHANGELOG.md) | История изменений |

## ⚡ Горячие клавиши (VS Code)

```
Ctrl+P         - Быстрый поиск файлов
Ctrl+Shift+F   - Поиск по всему проекту
F12            - Перейти к определению
Alt+Shift+F    - Форматирование кода
Ctrl+`         - Открыть/закрыть терминал
```

## 🔥 Частые сценарии

### Добавление нового действия игрока

1. Добавьте в `PlayerAction` тип (tableTypes.ts)
2. Обновите `convertPlayerActionToPokerAction` (tableUtils.ts)
3. Добавьте action в `tableSlice.ts` reducers
4. Обновите UI компоненты (PlayerActionDropdown.tsx)

### Добавление новой турнирной стадии

1. Добавьте в `TournamentStage` тип
2. Обновите JSON файлы с диапазонами
3. Обновите UI селектор в TournamentSettings.tsx

### Изменение структуры User

1. Обновите `User` interface в tableTypes.ts
2. Обновите `generateUsers()` в tableUtils.ts
3. Обновите все reducers в tableSlice.ts
4. Проверьте компоненты, использующие User

---

**Tip:** Держите этот файл открытым во второй вкладке для быстрого доступа!
