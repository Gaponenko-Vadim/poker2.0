# filterOpponentRange - Быстрый старт

## 1️⃣ Основное использование (5 секунд)

```typescript
import { filterOpponentRange } from '@/lib/utils/filterOpponentRange';

const result = filterOpponentRange({
  opponentRange: ['AA', 'KK', 'QQ'],
  heroCards: ['Ahearts', 'Kdiamonds'],
  boardCards: ['Qhearts', 'Jhearts', 'Thearts', null, null]
});

console.log(result.filteredCount); // Сколько комбинаций возможно
```

## 2️⃣ Получить только комбинации

```typescript
import { getFilteredCombinations } from '@/lib/utils/filterOpponentRange';

const combos = getFilteredCombinations({
  opponentRange: ['AA', 'KK'],
  heroCards: ['Ahearts', 'Kdiamonds']
});

// combos = [
//   ['Aspades', 'Adiamonds'],
//   ['Aspades', 'Aclubs'],
//   ...
// ]
```

## 3️⃣ Проверить, возможны ли комбинации

```typescript
import { hasAnyCombinations } from '@/lib/utils/filterOpponentRange';

if (hasAnyCombinations({
  opponentRange: ['AKs'],
  heroCards: ['Ahearts', 'Khearts']
})) {
  console.log('Оппонент может иметь эту руку!');
} else {
  console.log('Эта рука невозможна (все блокированы)');
}
```

## 4️⃣ Сколько комбинаций каждой руки?

```typescript
import { getCombinationsPerHand } from '@/lib/utils/filterOpponentRange';

const combosMap = getCombinationsPerHand({
  opponentRange: ['AA', 'KK', 'QQ'],
  heroCards: ['Ahearts', 'Kdiamonds'],
  boardCards: ['Qhearts', null, null, null, null]
});

console.log(combosMap.get('AA')); // 3 (вместо 6)
console.log(combosMap.get('KK')); // 3 (вместо 6)
console.log(combosMap.get('QQ')); // 3 (вместо 6)
```

## 5️⃣ Использование в React компоненте

```typescript
'use client';

import { useState, useEffect } from 'react';
import { filterOpponentRange } from '@/lib/utils/filterOpponentRange';
import { useAppSelector } from '@/lib/redux/hooks';

export function RangeAnalyzer() {
  const [result, setResult] = useState(null);

  // Получаем данные из Redux
  const users = useAppSelector((state) => state.table.sixMaxUsers);
  const hero = users[0];

  useEffect(() => {
    const opponentRange = ['AA', 'KK', 'QQ', 'JJ', 'AKs'];

    const filtered = filterOpponentRange({
      opponentRange,
      heroCards: hero.cards || [],
      boardCards: boardCards // из вашего state
    });

    setResult(filtered);
  }, [hero.cards, boardCards]);

  if (!result) return null;

  return (
    <div>
      <p>Возможных комбинаций: {result.filteredCount}</p>
      <p>Процент: {result.remainingPercentage}%</p>
    </div>
  );
}
```

## 6️⃣ Форматы карт

```typescript
// ✅ ПРАВИЛЬНО
heroCards: ['Ahearts', 'Kdiamonds']
boardCards: ['Qhearts', 'Jhearts', 'Thearts', null, null]

// ❌ НЕПРАВИЛЬНО
heroCards: ['AH', 'KD']           // неверный формат
boardCards: ['Qh', 'Jh', 'Th']   // неверный формат
```

## 7️⃣ Запуск примеров

```bash
# Смотрим примеры
npx ts-node lib/utils/filterOpponentRange.examples.ts

# Запускаем тесты
npx ts-node lib/utils/filterOpponentRange.test.ts
```

## 8️⃣ Типичные кейсы

### Префлоп
```typescript
const result = filterOpponentRange({
  opponentRange: ['AA', 'KK', 'QQ'],
  heroCards: ['Ahearts', 'Kdiamonds'],
  boardCards: [] // или не передавать
});
```

### После флопа
```typescript
const result = filterOpponentRange({
  opponentRange: ['AA', 'KK', 'QQ'],
  heroCards: ['Ahearts', 'Kdiamonds'],
  boardCards: ['Qhearts', 'Jhearts', 'Thearts', null, null]
});
```

### После тёрна
```typescript
const result = filterOpponentRange({
  opponentRange: ['AA', 'KK', 'QQ'],
  heroCards: ['Ahearts', 'Kdiamonds'],
  boardCards: ['Qhearts', 'Jhearts', 'Thearts', '9spades', null]
});
```

### На ривере
```typescript
const result = filterOpponentRange({
  opponentRange: ['AA', 'KK', 'QQ'],
  heroCards: ['Ahearts', 'Kdiamonds'],
  boardCards: ['Qhearts', 'Jhearts', 'Thearts', '9spades', '2clubs']
});
```

## 9️⃣ Что возвращается?

```typescript
{
  totalCombinations: 18,          // Всего до фильтрации
  filteredCombinations: [...],    // Массив возможных комбо
  filteredCount: 9,               // Количество после фильтрации
  remainingPercentage: 50,        // Процент (0-100)
  blockers: ['Ahearts', 'Kd']    // Блокирующие карты
}
```

## 🔟 Подробная документация

📖 [FILTER_OPPONENT_RANGE.md](./FILTER_OPPONENT_RANGE.md) - полная документация
📊 [filterOpponentRange.visual.md](./filterOpponentRange.visual.md) - визуализация
🧪 [filterOpponentRange.test.ts](./filterOpponentRange.test.ts) - тесты
💡 [filterOpponentRange.examples.ts](./filterOpponentRange.examples.ts) - примеры

---

**Готово!** Используйте `filterOpponentRange()` для точного анализа диапазонов 🎯
