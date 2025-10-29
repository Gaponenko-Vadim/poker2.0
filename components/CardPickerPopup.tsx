"use client";

import { createPortal } from "react-dom";
import { Card, CardRank, CardSuit } from "@/lib/redux/slices/tableSlice";
import { createCard, parseCard } from "@/lib/utils/cardUtils";

interface CardPickerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCard: (rank: CardRank, suit: CardSuit) => void;
  onClear?: () => void;
  title?: string;
  selectedCards?: [Card | null, Card | null];
  currentSelectingIndex?: 0 | 1 | null;
}

export default function CardPickerPopup({
  isOpen,
  onClose,
  onSelectCard,
  onClear,
  title = "Выберите карту",
  selectedCards = [null, null],
  currentSelectingIndex = null,
}: CardPickerPopupProps) {
  // Проверка, выбрана ли уже эта карта
  const isCardSelected = (rank: CardRank, suit: CardSuit): boolean => {
    const cardString = createCard(rank, suit);
    return selectedCards.some((card) => card === cardString);
  };

  if (!isOpen) return null;

  const ranks: CardRank[] = [
    "A",
    "K",
    "Q",
    "J",
    "T",
    "9",
    "8",
    "7",
    "6",
    "5",
    "4",
    "3",
    "2",
  ];

  const suits: { suit: CardSuit; symbol: string; color: string }[] = [
    { suit: "hearts", symbol: "♥", color: "text-red-600" },
    { suit: "diamonds", symbol: "♦", color: "text-red-600" },
    { suit: "clubs", symbol: "♣", color: "text-gray-800" },
    { suit: "spades", symbol: "♠", color: "text-gray-800" },
  ];

  const popupContent = (
    <>
      {/* Оверлей для закрытия */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Попап */}
        <div
          style={{ minWidth: "800px" }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl p-4 relative z-[10000]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white text-sm font-semibold">{title}</h4>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-lg font-bold w-6 h-6 flex items-center justify-center rounded hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          {/* Отображение выбранных карт */}
          <div className="flex gap-2 mb-3 justify-center items-center bg-slate-700/50 rounded-lg p-3">
            {[0, 1].map((index) => {
              const card = selectedCards[index];
              const isCurrentlySelecting = currentSelectingIndex === index;
              const parsedCard = card ? parseCard(card) : null;
              const suitInfo = parsedCard
                ? suits.find((s) => s.suit === parsedCard.suit)
                : null;

              return (
                <div
                  key={index}
                  className={`relative transition-all duration-200 ${
                    isCurrentlySelecting
                      ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-700"
                      : ""
                  }`}
                >
                  {card && parsedCard ? (
                    <div className="w-16 h-20 bg-white border border-gray-200 rounded shadow-lg">
                      <div className="absolute top-1 left-1 flex flex-col items-start leading-none">
                        <span
                          className={`text-base font-bold ${suitInfo?.color}`}
                        >
                          {parsedCard.rank}
                        </span>
                        <span
                          className={`text-xl leading-none ${suitInfo?.color}`}
                        >
                          {suitInfo?.symbol}
                        </span>
                      </div>
                      <div className="absolute bottom-1 right-1 flex flex-col items-end rotate-180 leading-none">
                        <span
                          className={`text-base font-bold ${suitInfo?.color}`}
                        >
                          {parsedCard.rank}
                        </span>
                        <span
                          className={`text-xl leading-none ${suitInfo?.color}`}
                        >
                          {suitInfo?.symbol}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-20 bg-gradient-to-br from-gray-600 to-gray-700 border-2 border-dashed border-gray-500 rounded flex items-center justify-center">
                      <span className="text-gray-400 text-2xl font-bold">
                        {index + 1}
                      </span>
                    </div>
                  )}
                  {isCurrentlySelecting && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-blue-400 font-semibold whitespace-nowrap"></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Сетка карт - компактная горизонтальная */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {suits.map((suitInfo) => (
              <div key={suitInfo.suit} className="flex items-center gap-1">
                {/* Иконка масти */}
                <div className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm flex-shrink-0">
                  <span className={`text-sm ${suitInfo.color}`}>
                    {suitInfo.symbol}
                  </span>
                </div>

                {/* Карты масти */}
                <div className="flex gap-1 flex-wrap">
                  {ranks.map((rank) => {
                    const selected = isCardSelected(rank, suitInfo.suit);
                    return (
                      <button
                        key={`${rank}-${suitInfo.suit}`}
                        onClick={() => {
                          if (!selected) {
                            onSelectCard(rank, suitInfo.suit);
                          }
                        }}
                        disabled={selected}
                        className={`w-8 h-10 border rounded shadow-sm transition-all duration-150 flex-shrink-0 ${
                          selected
                            ? "bg-gray-400 border-gray-500 opacity-50 cursor-not-allowed"
                            : "bg-white border-gray-300 hover:scale-110 hover:shadow-md hover:z-10 hover:border-blue-400 active:scale-95"
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center h-full">
                          <span
                            className={`text-xs font-bold ${suitInfo.color} leading-none`}
                          >
                            {rank}
                          </span>
                          <span
                            className={`text-sm ${suitInfo.color} leading-none`}
                          >
                            {suitInfo.symbol}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Кнопки действий */}
          {onClear && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  onClear();
                  onClose();
                }}
                className="flex-1 bg-red-600/90 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200"
              >
                Очистить
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(popupContent, document.body);
}
