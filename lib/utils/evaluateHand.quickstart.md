# evaluateHand - Быстрый старт

## 1️⃣ Основное использование (5 секунд)

```typescript
import { evaluateHand } from '@/lib/utils/evaluateHand';

const cards = ['Ahearts', 'Khearts', 'Qhearts', 'Jhearts', 'Thearts'];
const result = evaluateHand(cards);

console.log(result.rank);        // "Royal Flush"
console.log(result.description); // "Роял Флеш"
console.log(result.rankValue);   // 10
```

## 2️⃣ Найти лучшую комбинацию из 7 карт

```typescript
import { findBestHand } from '@/lib/utils/evaluateHand';

const playerCards = ['Ahearts', 'Khearts'];
const boardCards = ['Qhearts', 'Jhearts', 'Thearts', '9spades', '2clubs'];

const best = findBestHand(playerCards, boardCards);

console.log(best.rank);        // "Royal Flush"
console.log(best.cards);       // ['Ah', 'Kh', 'Qh', 'Jh', 'Th']
```

## 3️⃣ Сравнить две руки

```typescript
import { evaluateHand, compareHands } from '@/lib/utils/evaluateHand';

const hand1 = evaluateHand(['Ahearts', 'Aspades', 'Kdiamonds', 'Qhearts', 'Jspades']);
const hand2 = evaluateHand(['Khearts', 'Kspades', 'Kdiamonds', 'Qhearts', 'Jspades']);

const result = compareHands(hand1, hand2);

if (result > 0) {
  console.log('Рука 1 сильнее');
} else if (result < 0) {
  console.log('Рука 2 сильнее');
} else {
  console.log('Руки равны');
}
```

## 4️⃣ Все 10 типов комбинаций

```typescript
// 1. Royal Flush
evaluateHand(['Ahearts', 'Khearts', 'Qhearts', 'Jhearts', 'Thearts']);

// 2. Straight Flush
evaluateHand(['9diamonds', '8diamonds', '7diamonds', '6diamonds', '5diamonds']);

// 3. Four of a Kind
evaluateHand(['Ahearts', 'Aspades', 'Adiamonds', 'Aclubs', 'Khearts']);

// 4. Full House
evaluateHand(['Khearts', 'Kspades', 'Kdiamonds', 'Qhearts', 'Qspades']);

// 5. Flush
evaluateHand(['Ahearts', 'Khearts', 'Qhearts', 'Jhearts', '9hearts']);

// 6. Straight
evaluateHand(['Ahearts', 'Kdiamonds', 'Qspades', 'Jhearts', 'Tclubs']);

// 7. Three of a Kind
evaluateHand(['Khearts', 'Kspades', 'Kdiamonds', 'Qhearts', 'Jspades']);

// 8. Two Pair
evaluateHand(['Ahearts', 'Aspades', 'Kdiamonds', 'Khearts', 'Qspades']);

// 9. One Pair
evaluateHand(['Ahearts', 'Aspades', 'Kdiamonds', 'Qhearts', 'Jspades']);

// 10. High Card
evaluateHand(['Ahearts', 'Kdiamonds', 'Qspades', 'Jhearts', '9clubs']);
```

## 5️⃣ Использование в React компоненте

```typescript
'use client';

import { useMemo } from 'react';
import { evaluateHand } from '@/lib/utils/evaluateHand';

export function HandStrength({ cards }: { cards: string[] }) {
  const hand = useMemo(() => {
    if (cards.length < 5) return null;
    return evaluateHand(cards);
  }, [cards]);

  if (!hand) return null;

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold">{hand.rank}</h3>
      <p className="text-gray-600">{hand.description}</p>
      <p className="text-sm mt-2">Ранг: {hand.rankValue}/10</p>
    </div>
  );
}
```

## 6️⃣ Определить победителя среди игроков

```typescript
import { findBestHand, compareHands } from '@/lib/utils/evaluateHand';

const players = [
  { name: "Alice", cards: ["Ahearts", "Khearts"] },
  { name: "Bob", cards: ["Qs", "Qd"] },
  { name: "Charlie", cards: ["Jh", "Td"] },
];

const board = ["Qh", "Js", "Th", "9s", "2c"];

// Оценить руки всех игроков
const results = players.map(player => ({
  name: player.name,
  hand: findBestHand(player.cards, board),
}));

// Отсортировать по силе
results.sort((a, b) => compareHands(b.hand, a.hand));

// Победитель
console.log("Победитель:", results[0].name);
console.log("Комбинация:", results[0].hand.rank);
```

## 7️⃣ Форматы карт

```typescript
// ✅ ПРАВИЛЬНО
const cards = ['Ahearts', 'Kdiamonds', 'Qspades', 'Jclubs', 'Thearts'];

// ✅ Доступные ранги
// '2', '3', '4', '5', '6', '7', '8', '9', 'T' (десятка), 'J', 'Q', 'K', 'A'

// ✅ Доступные масти
// 'hearts' (червы), 'diamonds' (бубны), 'clubs' (трефы), 'spades' (пики)

// ❌ НЕПРАВИЛЬНО
const wrong = ['AH', 'KD'];  // неверный формат
```

## 8️⃣ Запуск примеров и тестов

```bash
# Запустить примеры
npx ts-node lib/utils/evaluateHand.examples.ts

# Запустить тесты
npx ts-node lib/utils/evaluateHand.test.ts
```

## 9️⃣ Что возвращается?

```typescript
{
  rank: "Royal Flush",              // Название комбинации
  rankValue: 10,                    // Численное значение (1-10)
  cards: ["Ah", "Kh", "Qh", ...],  // 5 карт комбинации
  description: "Роял Флеш",        // Описание на русском
  kickers: [14, 13, 12, 11, 10]   // Кикеры для сравнения
}
```

## 🔟 Полная документация

📖 [EVALUATE_HAND.md](./EVALUATE_HAND.md) - полная документация API
📊 [evaluateHand.visual.md](./evaluateHand.visual.md) - визуализация примеров
🧪 [evaluateHand.test.ts](./evaluateHand.test.ts) - тесты
💡 [evaluateHand.examples.ts](./evaluateHand.examples.ts) - примеры использования

---

**Готово!** Используйте `evaluateHand()` для оценки силы покерных комбинаций 🎯
