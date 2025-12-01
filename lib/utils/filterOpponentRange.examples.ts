/**
 * Примеры использования filterOpponentRange
 *
 * Этот файл содержит примеры для понимания работы функции фильтрации диапазонов
 */

import { filterOpponentRange, getFilteredCombinations, hasAnyCombinations, getCombinationsPerHand } from './filterOpponentRange';

// ============================================
// ПРИМЕР 1: Базовое использование
// ============================================
export function example1_BasicUsage() {
  console.log('=== ПРИМЕР 1: Базовое использование ===\n');

  const result = filterOpponentRange({
    opponentRange: ['AA', 'KK', 'QQ'],
    heroCards: ['Ahearts', 'Kdiamonds'],
    boardCards: ['Qhearts', 'Jhearts', 'Thearts', null, null]
  });

  console.log('Диапазон оппонента:', ['AA', 'KK', 'QQ']);
  console.log('Карты Hero:', ['Ahearts', 'Kdiamonds']);
  console.log('Борд:', ['Qhearts', 'Jhearts', 'Thearts']);
  console.log('\nРезультаты:');
  console.log('- Всего комбинаций:', result.totalCombinations);
  console.log('- После фильтрации:', result.filteredCount);
  console.log('- Процент оставшихся:', result.remainingPercentage + '%');
  console.log('- Блокеры:', result.blockers);
  console.log('\nОставшиеся комбинации:');
  result.filteredCombinations.forEach((combo, index) => {
    console.log(`  ${index + 1}. [${combo[0]}, ${combo[1]}]`);
  });
}

// ============================================
// ПРИМЕР 2: Только карты Hero (без борда)
// ============================================
export function example2_OnlyHeroCards() {
  console.log('\n=== ПРИМЕР 2: Только карты Hero (без борда) ===\n');

  const result = filterOpponentRange({
    opponentRange: ['AA', 'AKs', 'AKo'],
    heroCards: ['Ahearts', 'Kdiamonds']
  });

  console.log('Диапазон оппонента:', ['AA', 'AKs', 'AKo']);
  console.log('Карты Hero:', ['Ahearts', 'Kdiamonds']);
  console.log('Борд: нет');
  console.log('\nРезультаты:');
  console.log('- Всего комбинаций:', result.totalCombinations);
  console.log('- После фильтрации:', result.filteredCount);
  console.log('- Процент оставшихся:', result.remainingPercentage + '%');

  // Детализация по рукам
  const combosPerHand = getCombinationsPerHand({
    opponentRange: ['AA', 'AKs', 'AKo'],
    heroCards: ['Ahearts', 'Kdiamonds']
  });

  console.log('\nКомбинации по рукам:');
  combosPerHand.forEach((count, hand) => {
    console.log(`  ${hand}: ${count} комбинаций`);
  });
}

// ============================================
// ПРИМЕР 3: Полный борд (флоп + тёрн + ривер)
// ============================================
export function example3_FullBoard() {
  console.log('\n=== ПРИМЕР 3: Полный борд (флоп + тёрн + ривер) ===\n');

  const opponentRange = ['AA', 'KK', 'QQ', 'JJ', 'TT', '99'];

  const result = filterOpponentRange({
    opponentRange,
    heroCards: ['Ahearts', 'Aspades'],
    boardCards: ['Khearts', 'Kdiamonds', 'Kclubs', 'Qhearts', 'Jdiamonds']
  });

  console.log('Диапазон оппонента:', opponentRange);
  console.log('Карты Hero:', ['Ahearts', 'Aspades']);
  console.log('Борд (флоп + тёрн + ривер):', ['Khearts', 'Kdiamonds', 'Kclubs', 'Qhearts', 'Jdiamonds']);
  console.log('\nРезультаты:');
  console.log('- Всего комбинаций:', result.totalCombinations);
  console.log('- После фильтрации:', result.filteredCount);
  console.log('- Процент оставшихся:', result.remainingPercentage + '%');

  // Какие руки вообще возможны?
  const combosPerHand = getCombinationsPerHand({
    opponentRange,
    heroCards: ['Ahearts', 'Aspades'],
    boardCards: ['Khearts', 'Kdiamonds', 'Kclubs', 'Qhearts', 'Jdiamonds']
  });

  console.log('\nКомбинации по рукам:');
  combosPerHand.forEach((count, hand) => {
    console.log(`  ${hand}: ${count} комбинаций ${count === 0 ? '(невозможно!)' : ''}`);
  });
}

// ============================================
// ПРИМЕР 4: Проверка наличия комбинаций
// ============================================
export function example4_CheckHasCombos() {
  console.log('\n=== ПРИМЕР 4: Проверка наличия комбинаций ===\n');

  // Сценарий 1: Оппонент может иметь эти руки
  const scenario1 = hasAnyCombinations({
    opponentRange: ['AA', 'KK'],
    heroCards: ['Ahearts', 'Qdiamonds'],
    boardCards: ['Jhearts', 'Thearts', '9hearts', null, null]
  });

  console.log('Сценарий 1: Диапазон [AA, KK], Hero [Ah, Qd], Борд [Jh, Th, 9h]');
  console.log('Возможны ли комбинации?', scenario1 ? 'ДА ✓' : 'НЕТ ✗');

  // Сценарий 2: Все комбинации заблокированы
  const scenario2 = hasAnyCombinations({
    opponentRange: ['AKs'],
    heroCards: ['Ahearts', 'Khearts'],
    boardCards: ['Aspades', 'Kspades', 'Adiamonds', 'Kdiamonds', null]
  });

  console.log('\nСценарий 2: Диапазон [AKs], Hero [Ah, Kh], Борд [As, Ks, Ad, Kd]');
  console.log('Возможны ли комбинации?', scenario2 ? 'ДА ✓' : 'НЕТ ✗');
}

// ============================================
// ПРИМЕР 5: Получение только комбинаций
// ============================================
export function example5_GetCombinationsOnly() {
  console.log('\n=== ПРИМЕР 5: Получение только комбинаций (без статистики) ===\n');

  const combinations = getFilteredCombinations({
    opponentRange: ['JJ', 'TT'],
    heroCards: ['Jhearts', 'Jspades']
  });

  console.log('Диапазон оппонента:', ['JJ', 'TT']);
  console.log('Карты Hero:', ['Jhearts', 'Jspades']);
  console.log('\nВозможные комбинации оппонента:');

  combinations.forEach((combo, index) => {
    console.log(`  ${index + 1}. [${combo[0]}, ${combo[1]}]`);
  });
}

// ============================================
// ПРИМЕР 6: Большой диапазон с блокерами
// ============================================
export function example6_LargeRange() {
  console.log('\n=== ПРИМЕР 6: Большой диапазон с блокерами ===\n');

  const largeRange = [
    'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77',
    'AKs', 'AQs', 'AJs', 'ATs',
    'AKo', 'AQo', 'AJo'
  ];

  const result = filterOpponentRange({
    opponentRange: largeRange,
    heroCards: ['Ahearts', 'Kdiamonds'],
    boardCards: ['Qhearts', 'Jhearts', 'Thearts', null, null]
  });

  console.log('Размер диапазона:', largeRange.length, 'рук');
  console.log('Карты Hero:', ['Ahearts', 'Kdiamonds']);
  console.log('Борд:', ['Qhearts', 'Jhearts', 'Thearts']);
  console.log('\nРезультаты:');
  console.log('- Всего комбинаций:', result.totalCombinations);
  console.log('- После фильтрации:', result.filteredCount);
  console.log('- Процент оставшихся:', result.remainingPercentage + '%');
  console.log('- Блокеры:', result.blockers);

  // Топ-5 рук по количеству комбинаций
  const combosPerHand = getCombinationsPerHand({
    opponentRange: largeRange,
    heroCards: ['Ahearts', 'Kdiamonds'],
    boardCards: ['Qhearts', 'Jhearts', 'Thearts', null, null]
  });

  const sorted = Array.from(combosPerHand.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  console.log('\nТоп-5 рук по количеству комбинаций:');
  sorted.forEach(([hand, count], index) => {
    console.log(`  ${index + 1}. ${hand}: ${count} комбинаций`);
  });
}

// ============================================
// Запуск всех примеров
// ============================================
export function runAllExamples() {
  example1_BasicUsage();
  example2_OnlyHeroCards();
  example3_FullBoard();
  example4_CheckHasCombos();
  example5_GetCombinationsOnly();
  example6_LargeRange();
}

// Раскомментируйте для запуска примеров:
// runAllExamples();
