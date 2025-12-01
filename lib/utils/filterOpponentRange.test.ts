/**
 * Простые тесты для filterOpponentRange
 *
 * Запустить: npx ts-node lib/utils/filterOpponentRange.test.ts
 * (требуется ts-node: npm install -D ts-node)
 */

import { filterOpponentRange, getCombinationsPerHand } from './filterOpponentRange';

// Утилита для тестов
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(error);
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${expected}, but got ${actual}`
    );
  }
}

// ============================================
// ТЕСТЫ
// ============================================

console.log('Запуск тестов filterOpponentRange...\n');

// Тест 1: Базовая фильтрация
test('Базовая фильтрация с картами Hero', () => {
  const result = filterOpponentRange({
    opponentRange: ['AA'],
    heroCards: ['Ahearts', 'Kdiamonds']
  });

  // AA без блокеров = 6 комбинаций
  // AA с одним A заблокированным = 3 комбинации
  assertEqual(result.totalCombinations, 6, 'Всего комбинаций AA должно быть 6');
  assertEqual(result.filteredCount, 3, 'После блокировки одного A должно остаться 3');
  assertEqual(result.remainingPercentage, 50, 'Должно остаться 50%');
});

// Тест 2: Все комбинации заблокированы
test('Все комбинации заблокированы', () => {
  const result = filterOpponentRange({
    opponentRange: ['AKs'],
    heroCards: ['Ahearts', 'Khearts'],
    boardCards: ['Aspades', 'Kspades', 'Adiamonds', 'Kdiamonds', null]
  });

  // Все 4 A и все 4 K использованы - AKs невозможен
  assertEqual(result.filteredCount, 0, 'Все AKs должны быть заблокированы');
  assertEqual(result.remainingPercentage, 0, 'Должно остаться 0%');
});

// Тест 3: Без блокеров
test('Без блокеров (все комбинации доступны)', () => {
  const result = filterOpponentRange({
    opponentRange: ['AA', 'KK'],
    heroCards: [],
    boardCards: []
  });

  // AA = 6, KK = 6, всего = 12
  assertEqual(result.totalCombinations, 12);
  assertEqual(result.filteredCount, 12);
  assertEqual(result.remainingPercentage, 100);
});

// Тест 4: Блокеры только с борда
test('Блокеры только с борда', () => {
  const result = filterOpponentRange({
    opponentRange: ['QQ'],
    boardCards: ['Qhearts', 'Jhearts', 'Thearts', null, null]
  });

  // QQ без блокеров = 6
  // QQ с одной Q на борде = 3
  assertEqual(result.filteredCount, 3);
  assertEqual(result.remainingPercentage, 50);
});

// Тест 5: Комбинации по рукам
test('Комбинации по рукам', () => {
  const combosPerHand = getCombinationsPerHand({
    opponentRange: ['AA', 'KK', 'AKs'],
    heroCards: ['Ahearts', 'Kdiamonds']
  });

  assertEqual(combosPerHand.get('AA'), 3, 'AA должно иметь 3 комбинации');
  assertEqual(combosPerHand.get('KK'), 3, 'KK должно иметь 3 комбинации');
  assertEqual(combosPerHand.get('AKs'), 0, 'AKs должно иметь 0 комбинаций (все блокированы)');
});

// Тест 6: Множественные руки с частичными блокерами
test('Множественные руки с частичными блокерами', () => {
  const result = filterOpponentRange({
    opponentRange: ['AA', 'AKo', 'KK'],
    heroCards: ['Ahearts', 'Kdiamonds']
  });

  // AA: 6 → 3 (один A заблокирован)
  // AKo: 12 → 6 (один A и один K заблокированы)
  // KK: 6 → 3 (один K заблокирован)
  // Всего: 24 → 12
  assertEqual(result.totalCombinations, 24);
  assertEqual(result.filteredCount, 12);
  assertEqual(result.remainingPercentage, 50);
});

// Тест 7: Suited vs Offsuit
test('Suited vs Offsuit блокеры', () => {
  const resultSuited = filterOpponentRange({
    opponentRange: ['AKs'],
    heroCards: ['Ahearts', 'Khearts']
  });

  const resultOffsuit = filterOpponentRange({
    opponentRange: ['AKo'],
    heroCards: ['Ahearts', 'Kdiamonds']
  });

  // AKs: 4 комбо, одна заблокирована (AhKh) → 3
  assertEqual(resultSuited.filteredCount, 3, 'AKs должно иметь 3 комбинации');

  // AKo: 12 комбо, одна заблокирована (AhKd) → 11
  assertEqual(resultOffsuit.filteredCount, 11, 'AKo должно иметь 11 комбинаций');
});

// Тест 8: Полный борд
test('Полный борд (флоп + тёрн + ривер)', () => {
  const result = filterOpponentRange({
    opponentRange: ['AA', 'KK', 'QQ', 'JJ', 'TT'],
    heroCards: ['Ahearts', 'Aspades'],
    boardCards: ['Khearts', 'Kdiamonds', 'Kclubs', 'Qhearts', 'Jdiamonds']
  });

  const combosPerHand = getCombinationsPerHand({
    opponentRange: ['AA', 'KK', 'QQ', 'JJ', 'TT'],
    heroCards: ['Ahearts', 'Aspades'],
    boardCards: ['Khearts', 'Kdiamonds', 'Kclubs', 'Qhearts', 'Jdiamonds']
  });

  // AA: 2 A заблокированы → 1 комбинация (AdAc)
  // KK: 3 K на борде → 0 комбинаций
  // QQ: 1 Q на борде → 3 комбинации
  // JJ: 1 J на борде → 3 комбинации
  // TT: нет блокеров → 6 комбинаций
  assertEqual(combosPerHand.get('AA'), 1);
  assertEqual(combosPerHand.get('KK'), 0);
  assertEqual(combosPerHand.get('QQ'), 3);
  assertEqual(combosPerHand.get('JJ'), 3);
  assertEqual(combosPerHand.get('TT'), 6);
});

// Тест 9: Пустой диапазон
test('Пустой диапазон', () => {
  const result = filterOpponentRange({
    opponentRange: [],
    heroCards: ['Ahearts', 'Kdiamonds']
  });

  assertEqual(result.totalCombinations, 0);
  assertEqual(result.filteredCount, 0);
  assertEqual(result.remainingPercentage, 0);
});

// Тест 10: Null значения в картах
test('Null значения в картах Hero и борда', () => {
  const result = filterOpponentRange({
    opponentRange: ['AA', 'KK'],
    heroCards: ['Ahearts', null],
    boardCards: [null, null, null, null, null]
  });

  // Только один A заблокирован
  // AA: 6 → 3, KK: 6 → 6
  assertEqual(result.filteredCount, 9);
  assertEqual(result.blockers.length, 1);
});

console.log('\n✅ Все тесты пройдены!');
