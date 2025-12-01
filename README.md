# Poker Trainer

Покерное приложение-тренажер для обучения игре в покер. Позволяет симулировать игровые ситуации за столом с настраиваемыми игроками, их позициями и диапазонами рук.

## Возможности

- **Форматы игры**: 6-Max, 8-Max турниры и Cash игры (2-9 игроков)
- **Настройка противников**: Сила игрока (fish/amateur/regular), стиль игры (tight/balanced/aggressor), размер стека
- **Диапазоны рук**: Визуальный редактор диапазонов с матрицей 13x13, загрузка из базы данных
- **Hero диапазоны**: Специальные диапазоны для Hero игрока без уровня strength
- **Турнирные настройки**: Стадии турнира (early, middle, pre-bubble, late, pre-final, final), категории (micro/low/mid/high), bounty
- **Аутентификация**: JWT + OAuth 2.0 (Google, Yandex)
- **Конструктор диапазонов**: Создание и экспорт пользовательских наборов диапазонов

## Быстрый старт

```bash
# 1. Установите зависимости
npm install

# 2. Настройте PostgreSQL и создайте БД
createdb poker

# 3. Скопируйте .env.example в .env.local и настройте переменные
cp .env.example .env.local

# 4. Инициализируйте базу данных
npm run db:init

# 5. Запустите dev-сервер
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

## Технологии

- **Frontend**: Next.js 16, React 19, TypeScript 5
- **State Management**: Redux Toolkit 2.9.2
- **Database**: PostgreSQL
- **Authentication**: JWT + OAuth 2.0
- **Styling**: Tailwind CSS 4

## Документация

Подробная документация находится в файле [CLAUDE.md](./CLAUDE.md):

- Архитектура приложения
- Структура Redux Store
- Система диапазонов
- API endpoints
- Настройка OAuth
- Паттерны разработки

## Дополнительная документация

- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API endpoints
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Настройка PostgreSQL
- [OAUTH_SETUP.md](./OAUTH_SETUP.md) - Настройка OAuth (Google, Yandex)

## Команды разработки

```bash
npm run dev        # Запуск dev-сервера
npm run build      # Production сборка
npm start          # Запуск production сервера
npm run lint       # ESLint проверка
npx tsc --noEmit   # Проверка типов TypeScript
npm run db:init    # Инициализация PostgreSQL БД
```

## Структура проекта

```
poker2.0/
├── app/                    # Next.js App Router
│   ├── tables/            # Игровые страницы (6-max, 8-max, cash)
│   └── api/               # API routes (auth, user-ranges)
├── lib/
│   ├── redux/             # Redux store, slices, types, utils
│   ├── db/                # PostgreSQL
│   ├── auth/              # JWT, OAuth
│   ├── utils/             # Утилиты (диапазоны, карты, эквити)
│   └── constants/         # Константы (диапазоны, таблицы эквити)
├── components/            # React компоненты
└── scripts/               # Утилиты инициализации БД
```

## Лицензия

MIT
