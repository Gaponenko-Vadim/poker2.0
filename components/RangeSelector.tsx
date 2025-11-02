"use client";

import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import {
  TablePosition,
  PlayerStrength,
  PlayerPlayStyle,
  StackSize,
  PlayerAction,
} from "@/lib/redux/slices/tableSlice";
import {
  getTournamentRangeFromJSON,
  TournamentActionType,
  generateFullRange,
} from "@/lib/utils/tournamentRangeLoader";

interface RangeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  currentRange: string[];
  onRangeChange: (range: string[]) => void;
  // Новые параметры для загрузки диапазонов
  position: TablePosition;
  strength: PlayerStrength;
  playStyle: PlayerPlayStyle;
  stackSize: StackSize;
  currentAction: PlayerAction | null;
}

export default function RangeSelector({
  isOpen,
  onClose,
  playerName,
  currentRange,
  onRangeChange,
  position,
  strength,
  playStyle,
  stackSize,
  currentAction,
}: RangeSelectorProps) {
  // Маппинг действий игрока в действия из JSON
  const actionToTournamentAction: Record<PlayerAction, TournamentActionType> = {
    "fold": "defense_vs_open",
    "call": "defense_vs_open",
    "check": "defense_vs_open",
    "bet-open": "open_raise",
    "raise-3bet": "3bet",
    "raise-4bet": "4bet",
    "raise-5bet": "5bet",
    "all-in": "push_range",
  };

  // Определяем текущее действие из JSON на основе PlayerAction
  const getCurrentTournamentAction = (): TournamentActionType | null => {
    if (!currentAction) return null;
    return actionToTournamentAction[currentAction];
  };

  // Состояние для выбранного действия
  const [selectedAction, setSelectedAction] = useState<TournamentActionType | null>(
    getCurrentTournamentAction()
  );

  // Состояние для отображаемого диапазона (при переключении действий)
  const [displayedRange, setDisplayedRange] = useState<string[]>(currentRange);

  // Все возможные действия для отображения в UI
  const allActions: Array<{ key: TournamentActionType | null; label: string }> = [
    { key: null, label: "Нет действия (полный диапазон)" },
    { key: "open_raise", label: "Опен-рейз" },
    { key: "push_range", label: "Пуш" },
    { key: "call_vs_shove", label: "Колл на пуш" },
    { key: "defense_vs_open", label: "Защита vs опен" },
    { key: "3bet", label: "3-бет" },
    { key: "defense_vs_3bet", label: "Защита vs 3-бет" },
    { key: "4bet", label: "4-бет" },
    { key: "defense_vs_4bet", label: "Защита vs 4-бет" },
    { key: "5bet", label: "5-бет" },
    { key: "defense_vs_5bet", label: "Защита vs 5-бет" },
  ];

  // При изменении выбранного действия - загружаем новый диапазон
  useEffect(() => {
    if (!isOpen) return;

    // Если действие null - показываем полный диапазон (все 169 комбинаций)
    if (selectedAction === null) {
      setDisplayedRange(generateFullRange());
      return;
    }

    const newRange = getTournamentRangeFromJSON(
      position,
      strength,
      playStyle,
      stackSize,
      selectedAction
    );
    setDisplayedRange(newRange);
  }, [selectedAction, position, strength, playStyle, stackSize, isOpen]);

  // При открытии попапа - сбрасываем выбранное действие на текущее
  useEffect(() => {
    if (isOpen) {
      const currentTournamentAction = getCurrentTournamentAction();
      setSelectedAction(currentTournamentAction);

      // Если действие null - показываем полный диапазон
      if (currentTournamentAction === null) {
        setDisplayedRange(generateFullRange());
      } else {
        setDisplayedRange(currentRange);
      }
    }
  }, [isOpen]);

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

  // Проверка, выбрана ли рука в отображаемом диапазоне
  const isHandSelected = (hand: string): boolean => {
    return displayedRange.includes(hand);
  };

  // Переключение выбора руки (работает только для текущего действия)
  const toggleHand = (hand: string) => {
    // Переключение работает только если смотрим текущее действие
    const isCurrentAction = selectedAction === getCurrentTournamentAction();
    if (!isCurrentAction) return; // Нельзя редактировать диапазоны других действий

    if (currentRange.includes(hand)) {
      onRangeChange(currentRange.filter((h) => h !== hand));
    } else {
      onRangeChange([...currentRange, hand]);
    }
  };

  // Очистка диапазона (работает только для текущего действия)
  const clearRange = () => {
    const isCurrentAction = selectedAction === getCurrentTournamentAction();
    if (!isCurrentAction) return;
    onRangeChange([]);
  };

  // Проверяем, смотрим ли мы на текущее действие
  const isViewingCurrentAction = selectedAction === getCurrentTournamentAction();

  const popupContent = (
    <>
      {/* Оверлей */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Попап - увеличена ширина */}
        <div
          className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl p-3 relative z-[10000] max-w-4xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-white">
                Диапазон: {playerName}
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Позиция: <span className="text-blue-400 font-semibold">{position}</span>
                {" • "}Сила: <span className="text-purple-400">{strength === "fish" ? "Фиш" : strength === "amateur" ? "Любитель" : "Регуляр"}</span>
                {" • "}Стиль: <span className="text-orange-400">{playStyle === "tight" ? "Тайт" : playStyle === "balanced" ? "Баланс" : "Агрессор"}</span>
                {" • "}Стек: <span className="text-cyan-400">{stackSize === "very-small" ? "Очень маленький" : stackSize === "small" ? "Маленький" : stackSize === "medium" ? "Средний" : "Большой"}</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {selectedAction === null ? (
                  <span className="text-yellow-400 font-semibold">
                    🃏 Полный диапазон (нет действия)
                  </span>
                ) : isViewingCurrentAction ? (
                  <span className="text-green-400 font-semibold">
                    ⭐ Текущий диапазон
                  </span>
                ) : (
                  <span>Просмотр другого действия (только чтение)</span>
                )}
                {" • "}Выбрано: {displayedRange.length}{selectedAction === null ? "/169" : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-sm font-bold w-6 h-6 flex items-center justify-center rounded hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          {/* Основной контент - flex с переключателем действий слева */}
          <div className="flex gap-3">
            {/* Переключатель действий слева */}
            <div className="bg-slate-900/50 rounded-lg p-2 w-48 flex-shrink-0">
              <h4 className="text-xs font-semibold text-white mb-2">Действия:</h4>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {allActions.map((action) => {
                  const isSelected = selectedAction === action.key;
                  const isCurrent = action.key === getCurrentTournamentAction();

                  return (
                    <button
                      key={action.key}
                      onClick={() => setSelectedAction(action.key)}
                      className={`
                        w-full text-left px-2 py-1.5 rounded text-xs transition-all
                        ${
                          isSelected
                            ? "bg-blue-600 text-white font-semibold"
                            : "bg-slate-800/50 text-gray-300 hover:bg-slate-700"
                        }
                      `}
                    >
                      {action.label}
                      {isCurrent && (
                        <span className="ml-1 text-[10px] text-green-400">⭐</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Правая часть с матрицей и кнопками */}
            <div className="flex-1">
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
                  disabled={!isViewingCurrentAction}
                  className={`flex-1 py-1 px-2 rounded text-xs font-semibold transition-all duration-200 ${
                    isViewingCurrentAction
                      ? "bg-red-600/90 hover:bg-red-600 text-white cursor-pointer"
                      : "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                  }`}
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
              {displayedRange.length > 0 && (
                <div className="mt-2 p-1.5 bg-slate-800/50 rounded">
                  <p className="text-[8px] text-gray-400 mb-1">Выбранные:</p>
                  <div className="flex flex-wrap gap-0.5">
                    {displayedRange.map((hand) => (
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
        </div>
      </div>
    </>
  );

  return createPortal(popupContent, document.body);
}
