"use client";

import { useState } from "react";
import { Card, CardRank, CardSuit } from "@/lib/redux/slices/tableSlice";
import { createCard, parseCard } from "@/lib/utils/cardUtils";
import CardPickerPopup from "./CardPickerPopup";

interface CardSelectorProps {
  currentCards: [Card | null, Card | null];
  onCardsChange: (cards: [Card | null, Card | null]) => void;
}

export default function CardSelector({
  currentCards,
  onCardsChange,
}: CardSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectingCardIndex, setSelectingCardIndex] = useState<0 | 1 | null>(
    null
  );

  const suits: { suit: CardSuit; symbol: string; color: string }[] = [
    { suit: "hearts", symbol: "♥", color: "text-red-600" },
    { suit: "diamonds", symbol: "♦", color: "text-red-600" },
    { suit: "clubs", symbol: "♣", color: "text-gray-800" },
    { suit: "spades", symbol: "♠", color: "text-gray-800" },
  ];

  const handleCardClick = (index: 0 | 1) => {
    setSelectingCardIndex(index);
    setIsOpen(true);
  };

  const handleSelectCard = (rank: CardRank, suit: CardSuit) => {
    if (selectingCardIndex !== null) {
      const newCards: [Card | null, Card | null] = [...currentCards];
      newCards[selectingCardIndex] = createCard(rank, suit);
      onCardsChange(newCards);

      // Если выбрали первую карту и вторая пуста - переключаемся на выбор второй
      if (selectingCardIndex === 0 && !newCards[1]) {
        setSelectingCardIndex(1);
      }
      // Если выбрали вторую карту или обе уже заполнены - закрываем попап
      else if (selectingCardIndex === 1 || (newCards[0] && newCards[1])) {
        setIsOpen(false);
        setSelectingCardIndex(null);
      }
    }
  };

  const handleClearCard = () => {
    if (selectingCardIndex !== null) {
      const newCards: [Card | null, Card | null] = [...currentCards];
      newCards[selectingCardIndex] = null;
      onCardsChange(newCards);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectingCardIndex(null);
  };

  const renderCard = (card: Card | null, index: 0 | 1) => {
    if (!card) {
      return (
        <div
          onClick={() => handleCardClick(index)}
          className="w-12 h-16 bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-dashed border-gray-500 rounded cursor-pointer flex items-center justify-center hover:from-gray-600 hover:to-gray-700 hover:border-gray-400 transition-all duration-200 shadow-md"
        >
          <span className="text-gray-400 text-xl font-bold">+</span>
        </div>
      );
    }

    const parsedCard = parseCard(card);
    const suitInfo = suits.find((s) => s.suit === parsedCard.suit);
    return (
      <div
        className="relative w-12 h-16 bg-white border border-gray-200 rounded shadow-lg cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-200"
        onClick={() => handleCardClick(index)}
        title="Клик для изменения"
      >
        <div className="absolute top-0.5 left-0.5 flex flex-col items-start leading-none">
          <span className={`text-sm font-bold ${suitInfo?.color}`}>
            {parsedCard.rank}
          </span>
          <span className={`text-base leading-none ${suitInfo?.color}`}>
            {suitInfo?.symbol}
          </span>
        </div>
        <div className="absolute bottom-0.5 right-0.5 flex flex-col items-end rotate-180 leading-none">
          <span className={`text-sm font-bold ${suitInfo?.color}`}>
            {parsedCard.rank}
          </span>
          <span className={`text-base leading-none ${suitInfo?.color}`}>
            {suitInfo?.symbol}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Отображение текущих карт */}
      <div className="flex gap-1.5 items-center">
        {renderCard(currentCards[0], 0)}
        {renderCard(currentCards[1], 1)}
      </div>

      {/* Попап выбора карты */}
      <CardPickerPopup
        isOpen={isOpen}
        onClose={handleClose}
        onSelectCard={handleSelectCard}
        onClear={handleClearCard}
        title="Выберите карты"
        selectedCards={currentCards}
        currentSelectingIndex={selectingCardIndex}
      />
    </div>
  );
}
