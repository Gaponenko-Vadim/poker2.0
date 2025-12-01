/**
 * Тесты для функции evaluateHand
 *
 * Запуск: npx ts-node lib/utils/evaluateHand.test.ts
 */

import { evaluateHand, compareHands, findBestHand, HandEvaluation } from "./evaluateHand";
import { Card } from "@/lib/redux/slices/tableSlice";

// Утилита для запуска тестов
function runTest(name: string, testFn: () => void) {
  try {
    testFn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(error);
  }
}

// Утилита для проверки
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log("🧪 Запуск тестов для evaluateHand\n");

// Тест 1: Royal Flush
runTest("Royal Flush", () => {
  const cards: Card[] = [
    "Ahearts", "Khearts", "Qhearts", "Jhearts", "Thearts", "9hearts", "2spades"
  ];
  const result = evaluateHand(cards);
  assert(result.rank === "Royal Flush", "Должен определить Royal Flush");
  assert(result.description === "Роял Флеш", "Описание должно быть 'Роял Флеш'");
  assert(result.rankValue === 10, "Значение ранга должно быть 10");
});

// Тест 2: Straight Flush
runTest("Straight Flush", () => {
  const cards: Card[] = [
    "9diamonds", "8diamonds", "7diamonds", "6diamonds", "5diamonds", "Ahearts", "Kspades"
  ];
  const result = evaluateHand(cards);
  assert(result.rank === "Straight Flush", "Должен определить Straight Flush");
  assert(result.description.includes("Стрит Флеш"), "Описание должно содержать 'Стрит Флеш'");
  assert(result.rankValue === 9, "Значение ранга должно быть 9");
});

// Тест 3: Four of a Kind (Каре)
runTest("Four of a Kind", () => {
  const cards: Card[] = [
    "Ahearts", "Aspades", "Adiamonds", "Aclubs", "Khearts", "Qspades", "Jdiamonds"
  ];
  const result = evaluateHand(cards);
  assert(result.rank === "Four of a Kind", "Должен определить Four of a Kind");
  assert(result.description.includes("Каре"), "Описание должно содержать 'Каре'");
  assert(result.rankValue === 8, "Значение ранга должно быть 8");
});

// Тест 4: Full House
runTest("Full House", () => {
  const cards: Card[] = [
    "Khearts", "Kspades", "Kdiamonds", "Qhearts", "Qspades", "Jdiamonds", "Thearts"
  ];
  const result = evaluateHand(cards);
  assert(result.rank === "Full House", "Должен определить Full House");
  assert(result.description.includes("Фулл Хаус"), "Описание должно содержать 'Фулл Хаус'");
  assert(result.rankValue === 7, "Значение ранга должно быть 7");
});

// Тест 5: Flush (Флеш)
runTest("Flush", () => {
  const cards: Card[] = [
    "Ahearts", "Khearts", "Qhearts", "Jhearts", "9hearts", "2spades", "3diamonds"
  ];
  const result = evaluateHand(cards);
  assert(result.rank === "Flush", "Должен определить Flush");
  assert(result.description.includes("Флеш"), "Описание должно содержать 'Флеш'");
  assert(result.rankValue === 6, "Значение ранга должно быть 6");
});

// Тест 6: Straight (Стрит)
runTest("Straight", () => {
  const cards: Card[] = [
    "Ahearts", "Kdiamonds", "Qspades", "Jhearts", "Tclubs", "2spades", "3diamonds"
  ];
  const result = evaluateHand(cards);
  assert(result.rank === "Straight", "Должен определить Straight");
  assert(result.description.includes("Стрит"), "Описание должно содержать 'Стрит'");
  assert(result.rankValue === 5, "Значение ранга должно быть 5");
});

// Тест 7: Straight (Колесо A-2-3-4-5)
runTest("Straight (Wheel)", () => {
  const cards: Card[] = [
    "Ahearts", "2diamonds", "3spades", "4hearts", "5clubs", "Kspades", "Qdiamonds"
  ];
  const result = evaluateHand(cards);
  assert(result.rank === "Straight", "Должен определить Straight (колесо)");
  assert(result.description.includes("Стрит"), "Описание должно содержать 'Стрит'");
  assert(result.rankValue === 5, "Значение ранга должно быть 5");
});

// Тест 8: Three of a Kind (Сет)
runTest("Three of a Kind", () => {
  const cards: Card[] = [
    "Khearts", "Kspades", "Kdiamonds", "Qhearts", "Jspades", "Tdiamonds", "9hearts"
  ];
  const result = evaluateHand(cards);
  assert(result.rank === "Three of a Kind", "Должен определить Three of a Kind");
  assert(result.description.includes("Сет"), "Описание должно содержать 'Сет'");
  assert(result.rankValue === 4, "Значение ранга должно быть 4");
});

// Тест 9: Two Pair (Две пары)
runTest("Two Pair", () => {
  const cards: Card[] = [
    "Ahearts", "Aspades", "Kdiamonds", "Khearts", "Qspades", "Jdiamonds", "Thearts"
  ];
  const result = evaluateHand(cards);
  assert(result.rank === "Two Pair", "Должен определить Two Pair");
  assert(result.description.includes("Две пары"), "Описание должно содержать 'Две пары'");
  assert(result.rankValue === 3, "Значение ранга должно быть 3");
});

// Тест 10: One Pair (Пара)
runTest("One Pair", () => {
  const cards: Card[] = [
    "Ahearts", "Aspades", "Kdiamonds", "Qhearts", "Jspades", "Tdiamonds", "9hearts"
  ];
  const result = evaluateHand(cards);
  assert(result.rank === "One Pair", "Должен определить One Pair");
  assert(result.description.includes("Пара"), "Описание должно содержать 'Пара'");
  assert(result.rankValue === 2, "Значение ранга должно быть 2");
});

// Тест 11: High Card (Старшая карта)
runTest("High Card", () => {
  const cards: Card[] = [
    "Ahearts", "Kdiamonds", "Qspades", "Jhearts", "9clubs", "7spades", "5diamonds"
  ];
  const result = evaluateHand(cards);
  assert(result.rank === "High Card", "Должен определить High Card");
  assert(result.description.includes("Старшая карта"), "Описание должно содержать 'Старшая карта'");
  assert(result.rankValue === 1, "Значение ранга должно быть 1");
});

// Тест 12: Сравнение одинаковых рангов (кикеры)
runTest("Сравнение кикеров (две пары)", () => {
  const hand1 = evaluateHand([
    "Ahearts", "Aspades", "Kdiamonds", "Khearts", "Qspades", "Jdiamonds", "Thearts"
  ]);
  const hand2 = evaluateHand([
    "Ahearts", "Aspades", "Kdiamonds", "Khearts", "Jspades", "Tdiamonds", "9hearts"
  ]);
  const comparison = compareHands(hand1, hand2);
  assert(comparison > 0, "Hand1 должна быть сильнее (лучший кикер Q vs J)");
});

// Тест 13: findBestHand (2 карты игрока + 5 карт борда)
runTest("findBestHand - выбор лучшей комбинации", () => {
  const playerCards: [Card, Card] = ["Ahearts", "Khearts"];
  const boardCards: Card[] = ["Qhearts", "Jhearts", "Thearts", "9spades", "2clubs"];
  const result = findBestHand(playerCards, boardCards);
  assert(result.rank === "Royal Flush", "Должен найти Royal Flush");
});

// Тест 14: Минимум карт (ошибка при < 5 картах)
runTest("Ошибка при недостаточном количестве карт", () => {
  try {
    evaluateHand(["Ahearts", "Kdiamonds", "Qspades", "Jhearts"]);
    throw new Error("Должна была выброситься ошибка");
  } catch (error) {
    assert(
      error instanceof Error && error.message.includes("минимум 5 карт"),
      "Должна быть ошибка о недостаточном количестве карт"
    );
  }
});

// Тест 15: Игнорирование null значений
runTest("Игнорирование null карт", () => {
  const cards: (Card | null)[] = [
    "Ahearts", "Aspades", "Kdiamonds", "Qhearts", "Jspades", null, null
  ];
  const result = evaluateHand(cards);
  assert(result.rank === "One Pair", "Должен определить пару, игнорируя null");
});

// Тест 16: Сравнение одинаковых рук
runTest("Сравнение одинаковых рук", () => {
  const hand1 = evaluateHand(["Ahearts", "Aspades", "Kdiamonds", "Qhearts", "Jspades"]);
  const hand2 = evaluateHand(["Aclubs", "Adiamonds", "Khearts", "Qspades", "Jclubs"]);
  const comparison = compareHands(hand1, hand2);
  assert(comparison === 0, "Руки должны быть равны");
});

// Тест 17: Full House с несколькими тройками
runTest("Full House - выбор лучшей тройки", () => {
  const cards: Card[] = [
    "Khearts", "Kspades", "Kdiamonds", "Qhearts", "Qspades", "Qdiamonds", "Jhearts"
  ];
  const result = evaluateHand(cards);
  assert(result.rank === "Full House", "Должен определить Full House");
  assert(result.description.includes("K"), "Должен выбрать тройку королей (старшая)");
});

// Тест 18: Straight Flush vs Royal Flush
runTest("Отличие Straight Flush от Royal Flush", () => {
  const royalFlush = evaluateHand([
    "Ahearts", "Khearts", "Qhearts", "Jhearts", "Thearts", "2spades", "3diamonds"
  ]);
  const straightFlush = evaluateHand([
    "Khearts", "Qhearts", "Jhearts", "Thearts", "9hearts", "2spades", "3diamonds"
  ]);

  assert(royalFlush.rank === "Royal Flush", "Должен быть Royal Flush");
  assert(straightFlush.rank === "Straight Flush", "Должен быть Straight Flush");
  assert(compareHands(royalFlush, straightFlush) > 0, "Royal Flush сильнее Straight Flush");
});

// Тест 19: Two Pair - выбор двух старших пар
runTest("Two Pair - выбор старших пар", () => {
  const cards: Card[] = [
    "Ahearts", "Aspades", "Kdiamonds", "Khearts", "Qspades", "Qdiamonds", "Jhearts"
  ];
  const result = evaluateHand(cards);
  assert(result.rank === "Two Pair", "Должен определить Two Pair");
  assert(result.description.includes("A") && result.description.includes("K"), "Должен выбрать AA и KK");
});

// Тест 20: Проверка кикеров в каре
runTest("Four of a Kind - проверка кикера", () => {
  const hand1 = evaluateHand([
    "Khearts", "Kspades", "Kdiamonds", "Kclubs", "Ahearts", "Qspades", "Jdiamonds"
  ]);
  const hand2 = evaluateHand([
    "Khearts", "Kspades", "Kdiamonds", "Kclubs", "Qhearts", "Jspades", "Tdiamonds"
  ]);

  const comparison = compareHands(hand1, hand2);
  assert(comparison > 0, "Каре с тузом-кикером должно быть сильнее каре с дамой-кикером");
});

console.log("\n✨ Все тесты завершены!");
