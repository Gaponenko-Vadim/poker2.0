# evaluateHand - Оценка силы покерной комбинации

Утилита для оценки силы покерной комбинации по правилам Техасского Холдема.

## Что это делает?

Функция принимает массив карт (обычно 7 карт: 2 карты игрока + 5 карт борда) и:

1. Находит лучшую возможную комбинацию из 5 карт
2. Определяет тип комбинации (Royal Flush, Straight, Pair и т.д.)
3. Возвращает детальную информацию: ранг, описание, кикеры для сравнения

## Установка

Функция уже встроена в проект. Импортируйте из:

```typescript
import { evaluateHand, compareHands, findBestHand } from '@/lib/utils/evaluateHand';
```

## Типы покерных комбинаций

В Техасском Холдеме есть 10 типов комбинаций (от сильнейшей к слабейшей):

1. **Royal Flush** (Роял Флеш) - A, K, Q, J, 10 одной масти
2. **Straight Flush** (Стрит Флеш) - 5 карт подряд одной масти
3. **Four of a Kind** (Каре) - 4 карты одного ранга
4. **Full House** (Фулл Хаус) - тройка + пара
5. **Flush** (Флеш) - 5 карт одной масти
6. **Straight** (Стрит) - 5 карт подряд (любой масти)
7. **Three of a Kind** (Сет) - 3 карты одного ранга
8. **Two Pair** (Две пары) - две пары карт
9. **One Pair** (Пара) - 2 карты одного ранга
10. **High Card** (Старшая карта) - ничего из вышеперечисленного

## Базовое использование

```typescript
import { evaluateHand } from '@/lib/utils/evaluateHand';
import { Card } from '@/lib/redux/slices/tableSlice';

const cards: Card[] = [
  'Ahearts', 'Khearts', 'Qhearts', 'Jhearts', 'Thearts', '9spades', '2clubs'
];

const result = evaluateHand(cards);

console.log('Комбинация:', result.rank);         // "Royal Flush"
console.log('Описание:', result.description);    // "Роял Флеш"
console.log('Ранг:', result.rankValue);          // 10
console.log('5 карт:', result.cards);            // ['Ah', 'Kh', 'Qh', 'Jh', 'Th']
console.log('Кикеры:', result.kickers);          // [14, 13, 12, 11, 10]
```

## API

### `evaluateHand(cards)`

Основная функция для оценки силы комбинации.

**Параметры:**

```typescript
cards: (Card | null)[]  // Массив карт (минимум 5)
```

**Возвращает:**

```typescript
{
  rank: HandRank;           // Название комбинации
  rankValue: number;        // Численное значение (1-10)
  cards: string[];          // 5 карт, составляющих комбинацию
  description: string;      // Описание на русском
  kickers: number[];        // Значения кикеров для сравнения
}
```

**Возможные значения `rank`:**

- `"Royal Flush"`
- `"Straight Flush"`
- `"Four of a Kind"`
- `"Full House"`
- `"Flush"`
- `"Straight"`
- `"Three of a Kind"`
- `"Two Pair"`
- `"One Pair"`
- `"High Card"`

**Возможные значения `rankValue`:**

- `10` - Royal Flush
- `9` - Straight Flush
- `8` - Four of a Kind
- `7` - Full House
- `6` - Flush
- `5` - Straight
- `4` - Three of a Kind
- `3` - Two Pair
- `2` - One Pair
- `1` - High Card

### `compareHands(hand1, hand2)`

Сравнивает две руки и определяет, какая сильнее.

**Параметры:**

```typescript
hand1: HandEvaluation  // Первая рука
hand2: HandEvaluation  // Вторая рука
```

**Возвращает:**

- `1` - если `hand1` сильнее
- `-1` - если `hand2` сильнее
- `0` - если руки равны

**Пример:**

```typescript
const hand1 = evaluateHand(['Ahearts', 'Aspades', 'Kdiamonds', 'Qhearts', 'Jspades']);
const hand2 = evaluateHand(['Khearts', 'Kspades', 'Kdiamonds', 'Qhearts', 'Jspades']);

const comparison = compareHands(hand1, hand2);
if (comparison > 0) {
  console.log('Рука 1 сильнее');
} else if (comparison < 0) {
  console.log('Рука 2 сильнее');
} else {
  console.log('Руки равны');
}
```

### `findBestHand(playerCards, boardCards)`

Находит лучшую возможную комбинацию из 7 карт (2 карты игрока + 5 карт борда).

**Параметры:**

```typescript
playerCards: [Card, Card]  // 2 карты игрока
boardCards: Card[]         // 5 карт борда (или меньше)
```

**Возвращает:** `HandEvaluation`

**Пример:**

```typescript
const playerCards: [Card, Card] = ['Ahearts', 'Khearts'];
const boardCards: Card[] = ['Qhearts', 'Jhearts', 'Thearts', '9spades', '2clubs'];

const bestHand = findBestHand(playerCards, boardCards);

console.log('Лучшая комбинация:', bestHand.rank);      // "Royal Flush"
console.log('Описание:', bestHand.description);        // "Роял Флеш"
console.log('5 карт:', bestHand.cards);                // ['Ah', 'Kh', 'Qh', 'Jh', 'Th']
```

## Примеры

### Пример 1: Определение комбинации

```typescript
const cards: Card[] = [
  'Khearts', 'Kspades', 'Kdiamonds', 'Qhearts', 'Qspades', 'Jdiamonds', 'Thearts'
];

const result = evaluateHand(cards);

console.log(result.rank);         // "Full House"
console.log(result.description);  // "Фулл Хаус (K и Q)"
console.log(result.rankValue);    // 7
```

### Пример 2: Сравнение рук

```typescript
const hand1 = evaluateHand(['Ahearts', 'Aspades', 'Kdiamonds', 'Khearts', 'Qspades']);
const hand2 = evaluateHand(['Khearts', 'Kspades', 'Kdiamonds', 'Qhearts', 'Jspades']);

const comparison = compareHands(hand1, hand2);
// comparison < 0, потому что сет (hand2) сильнее двух пар (hand1)
```

### Пример 3: Использование в компоненте

```typescript
'use client';

import { useState, useMemo } from 'react';
import { evaluateHand } from '@/lib/utils/evaluateHand';
import { Card } from '@/lib/redux/slices/tableSlice';

export function HandStrengthDisplay({
  heroCards,
  boardCards
}: {
  heroCards: [Card, Card];
  boardCards: Card[]
}) {
  const handEvaluation = useMemo(() => {
    const allCards = [...heroCards, ...boardCards];
    if (allCards.length < 5) return null;
    return evaluateHand(allCards);
  }, [heroCards, boardCards]);

  if (!handEvaluation) {
    return <div>Недостаточно карт для оценки</div>;
  }

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold">Сила руки</h3>
      <div className="mt-2">
        <p className="text-xl">{handEvaluation.rank}</p>
        <p className="text-gray-600">{handEvaluation.description}</p>
        <p className="text-sm mt-2">Ранг: {handEvaluation.rankValue}/10</p>
      </div>
      <div className="mt-4">
        <p className="text-xs text-gray-500">5 карт комбинации:</p>
        <p className="font-mono">{handEvaluation.cards.join(', ')}</p>
      </div>
    </div>
  );
}
```

### Пример 4: Определение победителя среди игроков

```typescript
const players = [
  { name: "Игрок 1", cards: ["Ahearts", "Khearts"] as [Card, Card] },
  { name: "Игрок 2", cards: ["Qspades", "Qdiamonds"] as [Card, Card] },
  { name: "Игрок 3", cards: ["Jhearts", "Tdiamonds"] as [Card, Card] },
];

const boardCards: Card[] = ["Qhearts", "Jspades", "Thearts", "9spades", "2clubs"];

const evaluations = players.map(player => ({
  name: player.name,
  evaluation: findBestHand(player.cards, boardCards),
}));

// Сортируем по силе руки
evaluations.sort((a, b) => compareHands(b.evaluation, a.evaluation));

console.log("Победитель:", evaluations[0].name);
console.log("Комбинация:", evaluations[0].evaluation.rank);
```

## Форматы карт

**Формат Card**: строка вида `"<Ранг><Масть>"`

- **Ранг**: `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `T` (10), `J`, `Q`, `K`, `A`
- **Масть**: `hearts`, `diamonds`, `clubs`, `spades`

**Примеры:**
- ✅ `"Ahearts"` - туз червей
- ✅ `"Kdiamonds"` - король бубен
- ✅ `"Tspades"` - десятка пик
- ✅ `"2clubs"` - двойка треф

## Особенности

### Стрит-колесо (A-2-3-4-5)

Функция корректно определяет стрит с тузом в начале (A-2-3-4-5), где туз играет роль единицы.

```typescript
const cards: Card[] = [
  'Ahearts', '2diamonds', '3spades', '4hearts', '5clubs', 'Kspades', 'Qdiamonds'
];

const result = evaluateHand(cards);
console.log(result.rank);  // "Straight"
console.log(result.cards); // ['5c', '4h', '3s', '2d', 'Ah']
```

### Обработка null значений

Функция автоматически игнорирует `null` значения в массиве карт.

```typescript
const cards: (Card | null)[] = [
  'Ahearts', 'Aspades', 'Kdiamonds', 'Qhearts', 'Jspades', null, null
];

const result = evaluateHand(cards);
// Работает корректно, игнорируя null
```

### Выбор лучшей комбинации

При наличии нескольких вариантов одного типа (например, две разные пары), функция всегда выбирает лучший вариант.

```typescript
const cards: Card[] = [
  'Ahearts', 'Aspades', 'Kdiamonds', 'Khearts', 'Qspades', 'Qdiamonds', 'Jhearts'
];

const result = evaluateHand(cards);
console.log(result.description); // "Две пары (A и K)"
// Выбирает AA и KK, игнорируя QQ
```

## Производительность

- **Время выполнения**: < 1ms для большинства случаев
- **Оптимизация**: Использует эффективные алгоритмы сортировки и группировки
- **Комбинации**: При использовании `findBestHand()` с 7 картами проверяются все 21 комбинация из 5 карт

## Тестирование

Запустите тесты:

```bash
npx ts-node lib/utils/evaluateHand.test.ts
```

Или запустите примеры:

```bash
npx ts-node lib/utils/evaluateHand.examples.ts
```

## FAQ

**Q: Что если передать меньше 5 карт?**
A: Функция выбросит ошибку: "Для оценки комбинации нужно минимум 5 карт".

**Q: Можно ли сравнивать руки разных рангов?**
A: Да, функция `compareHands()` корректно сравнивает руки любых рангов. Royal Flush всегда сильнее High Card.

**Q: Как обрабатываются кикеры?**
A: Кикеры используются для сравнения рук одинакового ранга. Например, пара тузов с королем-кикером сильнее пары тузов с дамой-кикером.

**Q: Что если у двух игроков одинаковые руки?**
A: `compareHands()` вернёт `0`, что означает равные руки (split pot).

**Q: Работает ли функция для флопа, тёрна?**
A: Да, функция работает с любым количеством карт >= 5. Если передать 5 карт (префлоп), оценит эти 5 карт. Если 6 (после тёрна) или 7 (после ривера), выберет лучшую комбинацию.

## Связанные утилиты

- `parseCard()` - парсинг строки карты в объект (из `cardUtils.ts`)
- `filterOpponentRange()` - фильтрация диапазона оппонента с учётом блокеров
- `equityCalculator()` - расчёт эквити рук

## Лицензия

MIT
