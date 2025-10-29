"use client";

import { createPortal } from "react-dom";

interface RangeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  currentRange: string[];
  onRangeChange: (range: string[]) => void;
}

export default function RangeSelector({
  isOpen,
  onClose,
  playerName,
  currentRange,
  onRangeChange,
}: RangeSelectorProps) {
  if (!isOpen) return null;

  // Ранги карт от старших к младшим
  const ranks = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

  // Генерация матрицы покерных рук
  const generateHandMatrix = (): string[][] => {
    const matrix: string[][] = [];
    for (let i = 0; i < ranks.length; i++) {
      const row: string[] = [];
      for (let j = 0; j < ranks.length; j++) {
        if (i === j) {
          // Карманные пары (диагональ)
          row.push(`${ranks[i]}${ranks[j]}`);
        } else if (i < j) {
          // Одномастные (выше диагонали)
          row.push(`${ranks[i]}${ranks[j]}s`);
        } else {
          // Разномастные (ниже диагонали)
          row.push(`${ranks[j]}${ranks[i]}o`);
        }
      }
      matrix.push(row);
    }
    return matrix;
  };

  const handMatrix = generateHandMatrix();

  // Проверка, выбрана ли рука
  const isHandSelected = (hand: string): boolean => {
    return currentRange.includes(hand);
  };

  // Переключение выбора руки
  const toggleHand = (hand: string) => {
    if (currentRange.includes(hand)) {
      onRangeChange(currentRange.filter((h) => h !== hand));
    } else {
      onRangeChange([...currentRange, hand]);
    }
  };

  // Очистка диапазона
  const clearRange = () => {
    onRangeChange([]);
  };

  const popupContent = (
    <>
      {/* Оверлей */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Попап */}
        <div
          className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl p-3 relative z-[10000] max-w-xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-white">
                Диапазон: {playerName}
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Выбрано: {currentRange.length}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-sm font-bold w-6 h-6 flex items-center justify-center rounded hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          {/* Матрица рук */}
          <div className="bg-slate-900/50 rounded-lg p-2 mb-2">
            <div className="grid grid-cols-13 gap-[2px]">
              {handMatrix.map((row, rowIndex) =>
                row.map((hand, colIndex) => {
                  const selected = isHandSelected(hand);
                  // Определяем тип руки для цвета
                  const isPair = rowIndex === colIndex;
                  const isSuited = rowIndex < colIndex;

                  return (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => toggleHand(hand)}
                      className={`
                        aspect-square text-[8px] font-bold rounded-sm transition-all duration-75
                        ${
                          selected
                            ? "bg-gradient-to-br from-red-200 to-red-300 text-gray-800 shadow-sm scale-105 border-red-400"
                            : isPair
                            ? "bg-gradient-to-br from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-800"
                            : isSuited
                            ? "bg-gradient-to-br from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 text-gray-800"
                            : "bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800"
                        }
                        hover:scale-105 hover:z-10 border border-gray-300
                      `}
                    >
                      {hand}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-1.5">
            <button
              onClick={clearRange}
              className="flex-1 bg-red-600/90 hover:bg-red-600 text-white py-1 px-2 rounded text-xs font-semibold transition-all duration-200"
            >
              Очистить
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-blue-600/90 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs font-semibold transition-all duration-200"
            >
              Готово
            </button>
          </div>

          {/* Отображение выбранных рук */}
          {currentRange.length > 0 && (
            <div className="mt-2 p-1.5 bg-slate-800/50 rounded">
              <p className="text-[8px] text-gray-400 mb-1">Выбранные:</p>
              <div className="flex flex-wrap gap-0.5">
                {currentRange.map((hand) => (
                  <span
                    key={hand}
                    className="px-1 py-0.5 bg-gradient-to-br from-red-200 to-red-300 text-gray-800 text-[8px] rounded font-semibold border border-red-400"
                  >
                    {hand}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(popupContent, document.body);
}
