"use client";

import { useState } from "react";
import { Card, CardRank, CardSuit } from "@/lib/redux/slices/tableSlice";
import { createCard, parseCard } from "@/lib/utils/cardUtils";
import CardPickerPopup from "./CardPickerPopup";

interface BoardCardSelectorProps {
  currentCards: (Card | null)[];
  onCardsChange: (cards: (Card | null)[]) => void;
  onClose: () => void;
  heroCards?: [Card | null, Card | null]; // Карты Hero для исключения из выбора
}

export default function BoardCardSelector({
  currentCards,
  onCardsChange,
  onClose,
  heroCards = [null, null],
}: BoardCardSelectorProps) {
  const [selectingCardIndex, setSelectingCardIndex] = useState<number | null>(null);

  const suits: { suit: CardSuit; symbol: string; color: string }[] = [
    { suit: "hearts", symbol: "♥", color: "text-red-600" },
    { suit: "diamonds", symbol: "♦", color: "text-red-600" },
    { suit: "clubs", symbol: "♣", color: "text-gray-800" },
    { suit: "spades", symbol: "♠", color: "text-gray-800" },
  ];

  const handleCardClick = (index: number) => {
    setSelectingCardIndex(index);
  };

  const handleSelectCard = (rank: CardRank, suit: CardSuit) => {
    if (selectingCardIndex !== null) {
      const newCards = [...currentCards];
      newCards[selectingCardIndex] = createCard(rank, suit);
      onCardsChange(newCards);

      // Автоматически переходим к следующей пустой карте
      const nextEmptyIndex = newCards.findIndex((c, i) => i > selectingCardIndex && c === null);
      if (nextEmptyIndex !== -1 && nextEmptyIndex < 5) {
        setSelectingCardIndex(nextEmptyIndex);
      } else {
        setSelectingCardIndex(null);
      }
    }
  };

  const handleClearCard = () => {
    if (selectingCardIndex !== null) {
      const newCards = [...currentCards];
      newCards[selectingCardIndex] = null;
      // Очищаем все карты после текущей
      for (let i = selectingCardIndex + 1; i < 5; i++) {
        newCards[i] = null;
      }
      onCardsChange(newCards);
    }
  };

  const handleClearAll = () => {
    onCardsChange([null, null, null, null, null]);
    setSelectingCardIndex(0);
  };

  const handleCloseSelector = () => {
    setSelectingCardIndex(null);
  };

  const renderCard = (card: Card | null, index: number) => {
    const isSelecting = selectingCardIndex === index;

    if (!card) {
      return (
        <div
          onClick={() => handleCardClick(index)}
          className={`w-14 h-20 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-dashed rounded cursor-pointer flex items-center justify-center transition-all duration-200 shadow-md ${
            isSelecting
              ? "border-blue-400 from-gray-600 to-gray-700 scale-105 shadow-blue-400/50"
              : "border-gray-500 hover:from-gray-600 hover:to-gray-700 hover:border-gray-400"
          }`}
        >
          <span className="text-gray-400 text-2xl font-bold">+</span>
        </div>
      );
    }

    const parsedCard = parseCard(card);
    const suitInfo = suits.find((s) => s.suit === parsedCard.suit);
    return (
      <div
        className={`relative w-14 h-20 bg-white border-2 rounded shadow-lg cursor-pointer transition-all duration-200 ${
          isSelecting
            ? "border-blue-400 scale-105 shadow-blue-400/50"
            : "border-gray-200 hover:shadow-xl hover:scale-105"
        }`}
        onClick={() => handleCardClick(index)}
        title="Клик для изменения"
      >
        <div className="absolute top-1 left-1 flex flex-col items-start leading-none">
          <span className={`text-base font-bold ${suitInfo?.color}`}>
            {parsedCard.rank}
          </span>
          <span className={`text-lg leading-none ${suitInfo?.color}`}>
            {suitInfo?.symbol}
          </span>
        </div>
        <div className="absolute bottom-1 right-1 flex flex-col items-end rotate-180 leading-none">
          <span className={`text-base font-bold ${suitInfo?.color}`}>
            {parsedCard.rank}
          </span>
          <span className={`text-lg leading-none ${suitInfo?.color}`}>
            {suitInfo?.symbol}
          </span>
        </div>
      </div>
    );
  };

  // Получаем все уже выбранные карты (включая карты Hero и борда)
  const usedCards = [
    ...currentCards.filter((c): c is Card => c !== null),
    ...heroCards.filter((c): c is Card => c !== null),
  ];

  // Определяем название этапа
  const selectedCount = currentCards.filter(c => c !== null).length;
  const stageName = selectedCount === 0 ? "" : selectedCount <= 3 ? "Флоп" : selectedCount === 4 ? "Тёрн" : "Ривер";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">Выбор карт борда</h2>
            {stageName && (
              <span className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                {stageName}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-300 text-sm mb-4">
            Выберите 3 карты для флопа или 5 карт для флопа, тёрна и ривера
          </p>
          <div className="flex gap-3 justify-center">
            {[0, 1, 2, 3, 4].map((index) => (
              <div key={index}>{renderCard(currentCards[index], index)}</div>
            ))}
          </div>
        </div>

        {selectingCardIndex !== null && (
          <div className="mb-4">
            <CardPickerPopup
              usedCards={usedCards}
              onSelectCard={handleSelectCard}
              onClearCard={handleClearCard}
              onClose={handleCloseSelector}
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleClearAll}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Очистить все
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}
