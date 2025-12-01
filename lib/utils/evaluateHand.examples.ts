/**
 * Примеры использования функции evaluateHand
 *
 * Запуск: npx ts-node lib/utils/evaluateHand.examples.ts
 */

import { evaluateHand, compareHands, findBestHand } from "./evaluateHand";
import { Card } from "@/lib/redux/slices/tableSlice";

console.log("📚 Примеры использования evaluateHand\n");

// ========================================
// Пример 1: Базовое использование
// ========================================
console.log("1️⃣ Базовое использование\n");

const cards1: Card[] = [
  "Ahearts", "Khearts", "Qhearts", "Jhearts", "Thearts", "9spades", "2clubs"
];

const result1 = evaluateHand(cards1);

console.log("Карты:", cards1.join(", "));
console.log("Результат:", result1.rank);
console.log("Описание:", result1.description);
console.log("Комбинация из 5 карт:", result1.cards.join(", "));
console.log("Значение ранга:", result1.rankValue);
console.log("Кикеры (для сравнения):", result1.kickers);
console.log("\n---\n");

// ========================================
// Пример 2: Сравнение двух рук
// ========================================
console.log("2️⃣ Сравнение двух рук\n");

const hand1Cards: Card[] = ["Ahearts", "Aspades", "Kdiamonds", "Khearts", "Qspades"];
const hand2Cards: Card[] = ["Khearts", "Kspades", "Kdiamonds", "Qhearts", "Jspades"];

const hand1 = evaluateHand(hand1Cards);
const hand2 = evaluateHand(hand2Cards);

console.log("Рука 1:", hand1Cards.join(", "));
console.log("Результат:", hand1.rank, "-", hand1.description);
console.log();
console.log("Рука 2:", hand2Cards.join(", "));
console.log("Результат:", hand2.rank, "-", hand2.description);
console.log();

const comparison = compareHands(hand1, hand2);
if (comparison > 0) {
  console.log("🏆 Рука 1 сильнее!");
} else if (comparison < 0) {
  console.log("🏆 Рука 2 сильнее!");
} else {
  console.log("🤝 Руки равны");
}
console.log("\n---\n");

// ========================================
// Пример 3: Поиск лучшей комбинации из 7 карт
// ========================================
console.log("3️⃣ Поиск лучшей комбинации из 7 карт (2 карты игрока + 5 карт борда)\n");

const playerCards: [Card, Card] = ["Ahearts", "Khearts"];
const boardCards: Card[] = ["Qhearts", "Jhearts", "Thearts", "9spades", "2clubs"];

console.log("Карты игрока:", playerCards.join(", "));
console.log("Борд:", boardCards.join(", "));

const bestHand = findBestHand(playerCards, boardCards);

console.log("\nЛучшая комбинация:", bestHand.rank);
console.log("Описание:", bestHand.description);
console.log("5 карт:", bestHand.cards.join(", "));
console.log("\n---\n");

// ========================================
// Пример 4: Все 10 типов комбинаций
// ========================================
console.log("4️⃣ Примеры всех 10 типов покерных комбинаций\n");

const examples = [
  {
    name: "Royal Flush",
    cards: ["Ahearts", "Khearts", "Qhearts", "Jhearts", "Thearts"] as Card[],
  },
  {
    name: "Straight Flush",
    cards: ["9diamonds", "8diamonds", "7diamonds", "6diamonds", "5diamonds"] as Card[],
  },
  {
    name: "Four of a Kind",
    cards: ["Ahearts", "Aspades", "Adiamonds", "Aclubs", "Khearts"] as Card[],
  },
  {
    name: "Full House",
    cards: ["Khearts", "Kspades", "Kdiamonds", "Qhearts", "Qspades"] as Card[],
  },
  {
    name: "Flush",
    cards: ["Ahearts", "Khearts", "Qhearts", "Jhearts", "9hearts"] as Card[],
  },
  {
    name: "Straight",
    cards: ["Ahearts", "Kdiamonds", "Qspades", "Jhearts", "Tclubs"] as Card[],
  },
  {
    name: "Three of a Kind",
    cards: ["Khearts", "Kspades", "Kdiamonds", "Qhearts", "Jspades"] as Card[],
  },
  {
    name: "Two Pair",
    cards: ["Ahearts", "Aspades", "Kdiamonds", "Khearts", "Qspades"] as Card[],
  },
  {
    name: "One Pair",
    cards: ["Ahearts", "Aspades", "Kdiamonds", "Qhearts", "Jspades"] as Card[],
  },
  {
    name: "High Card",
    cards: ["Ahearts", "Kdiamonds", "Qspades", "Jhearts", "9clubs"] as Card[],
  },
];

for (const example of examples) {
  const result = evaluateHand(example.cards);
  console.log(`${example.name}:`);
  console.log(`  Карты: ${example.cards.join(", ")}`);
  console.log(`  Результат: ${result.rank}`);
  console.log(`  Описание: ${result.description}`);
  console.log();
}

console.log("---\n");

// ========================================
// Пример 5: Использование в React компоненте
// ========================================
console.log("5️⃣ Пример использования в React компоненте\n");

console.log(`
// Пример компонента для отображения силы руки

'use client';

import { useState } from 'react';
import { evaluateHand } from '@/lib/utils/evaluateHand';
import { Card } from '@/lib/redux/slices/tableSlice';

export function HandStrengthDisplay() {
  const [heroCards] = useState<[Card, Card]>(['Ahearts', 'Khearts']);
  const [boardCards] = useState<Card[]>([
    'Qhearts', 'Jhearts', 'Thearts', '9spades', '2clubs'
  ]);

  const allCards = [...heroCards, ...boardCards];
  const handEvaluation = evaluateHand(allCards);

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold">Сила руки</h3>
      <p>Комбинация: {handEvaluation.rank}</p>
      <p>Описание: {handEvaluation.description}</p>
      <p>Ранг: {handEvaluation.rankValue}/10</p>
      <div className="mt-2">
        <p className="text-sm text-gray-600">5 карт комбинации:</p>
        <p>{handEvaluation.cards.join(', ')}</p>
      </div>
    </div>
  );
}
`);

console.log("---\n");

// ========================================
// Пример 6: Сравнение нескольких игроков
// ========================================
console.log("6️⃣ Сравнение рук нескольких игроков\n");

const players = [
  {
    name: "Игрок 1",
    cards: ["Ahearts", "Khearts"] as [Card, Card],
  },
  {
    name: "Игрок 2",
    cards: ["Qspades", "Qdiamonds"] as [Card, Card],
  },
  {
    name: "Игрок 3",
    cards: ["Jhearts", "Tdiamonds"] as [Card, Card],
  },
];

const board: Card[] = ["Qhearts", "Jspades", "Thearts", "9spades", "2clubs"];

console.log("Борд:", board.join(", "));
console.log();

const evaluations = players.map((player) => ({
  name: player.name,
  cards: player.cards,
  evaluation: findBestHand(player.cards, board),
}));

// Сортируем по силе руки
evaluations.sort((a, b) => compareHands(b.evaluation, a.evaluation));

console.log("Результаты (от сильнейшей к слабейшей):\n");

evaluations.forEach((player, index) => {
  console.log(`${index + 1}. ${player.name}`);
  console.log(`   Карты: ${player.cards.join(", ")}`);
  console.log(`   Комбинация: ${player.evaluation.rank}`);
  console.log(`   Описание: ${player.evaluation.description}`);
  console.log(`   5 карт: ${player.evaluation.cards.join(", ")}`);
  console.log();
});

console.log("---\n");

// ========================================
// Пример 7: Стрит-флеш vs Роял-флеш
// ========================================
console.log("7️⃣ Различие между Straight Flush и Royal Flush\n");

const royalFlush: Card[] = [
  "Ahearts", "Khearts", "Qhearts", "Jhearts", "Thearts"
];

const straightFlush: Card[] = [
  "Khearts", "Qhearts", "Jhearts", "Thearts", "9hearts"
];

const royalResult = evaluateHand(royalFlush);
const straightResult = evaluateHand(straightFlush);

console.log("Royal Flush:", royalFlush.join(", "));
console.log("Результат:", royalResult.rank, "-", royalResult.description);
console.log("Ранг:", royalResult.rankValue);
console.log();

console.log("Straight Flush:", straightFlush.join(", "));
console.log("Результат:", straightResult.rank, "-", straightResult.description);
console.log("Ранг:", straightResult.rankValue);
console.log();

console.log(`Royal Flush (${royalResult.rankValue}) сильнее Straight Flush (${straightResult.rankValue})`);
console.log("\n---\n");

// ========================================
// Пример 8: Колесо (A-2-3-4-5)
// ========================================
console.log("8️⃣ Стрит-колесо (A-2-3-4-5)\n");

const wheel: Card[] = [
  "Ahearts", "2diamonds", "3spades", "4hearts", "5clubs", "Kspades", "Qdiamonds"
];

const wheelResult = evaluateHand(wheel);

console.log("Карты:", wheel.join(", "));
console.log("Результат:", wheelResult.rank);
console.log("Описание:", wheelResult.description);
console.log("5 карт стрита:", wheelResult.cards.join(", "));
console.log("\n(В колесе туз играет роль единицы)\n");

console.log("\n✨ Все примеры завершены!");
