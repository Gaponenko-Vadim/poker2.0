"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { PlayerAction } from "@/lib/redux/slices/tableSlice";

interface PlayerActionDropdownProps {
  currentAction: PlayerAction | null;
  onActionChange: (action: PlayerAction | null) => void;
  onBetChange?: (betAmount: number) => void; // Новый callback для изменения ставки
  currentBet: number; // Текущая ставка игрока
  allPlayersActions: (PlayerAction | null)[]; // Действия всех игроков за столом
  allPlayersBets: number[]; // Ставки всех игроков за столом
}

const actionLabels: Record<PlayerAction, string> = {
  fold: "Fold",
  call: "Call",
  check: "Check",
  "bet-open": "Bet (Open)",
  "raise-3bet": "Raise 3-bet",
  "raise-4bet": "Raise 4-bet",
  "raise-5bet": "Raise 5-bet",
  "all-in": "All-In",
};

const baseActions: PlayerAction[] = [
  "fold",
  "call",
  "check",
  "all-in",
];

// Цепочка ставок: bet-open → raise-3bet → raise-4bet → raise-5bet
const bettingChain: PlayerAction[] = [
  "bet-open",
  "raise-3bet",
  "raise-4bet",
  "raise-5bet",
];

// Функция для получения цвета действия
const getActionColor = (action: PlayerAction): string => {
  switch (action) {
    case "fold":
      return "bg-red-600 hover:bg-red-700 text-white";
    case "call":
      return "bg-green-600 hover:bg-green-700 text-white";
    case "check":
      return "bg-yellow-600 hover:bg-yellow-700 text-white";
    case "bet-open":
      return "bg-blue-500 hover:bg-blue-600 text-white";
    case "raise-3bet":
      return "bg-indigo-600 hover:bg-indigo-700 text-white";
    case "raise-4bet":
      return "bg-violet-600 hover:bg-violet-700 text-white";
    case "raise-5bet":
      return "bg-purple-600 hover:bg-purple-700 text-white";
    case "all-in":
      return "bg-pink-600 hover:bg-pink-700 text-white";
    default:
      return "bg-gray-600 hover:bg-gray-700 text-white";
  }
};

// Функция для получения цвета кнопки
const getButtonColor = (action: PlayerAction | null): string => {
  if (!action) return "bg-gray-700 hover:bg-gray-600 text-white";

  switch (action) {
    case "fold":
      return "bg-red-600 hover:bg-red-700 text-white border-red-500";
    case "call":
      return "bg-green-600 hover:bg-green-700 text-white border-green-500";
    case "check":
      return "bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-500";
    case "bet-open":
      return "bg-blue-500 hover:bg-blue-600 text-white border-blue-400";
    case "raise-3bet":
      return "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500";
    case "raise-4bet":
      return "bg-violet-600 hover:bg-violet-700 text-white border-violet-500";
    case "raise-5bet":
      return "bg-purple-600 hover:bg-purple-700 text-white border-purple-500";
    case "all-in":
      return "bg-pink-600 hover:bg-pink-700 text-white border-pink-500";
    default:
      return "bg-gray-700 hover:bg-gray-600 text-white border-gray-600";
  }
};

export default function PlayerActionDropdown({
  currentAction,
  onActionChange,
  onBetChange,
  currentBet,
  allPlayersActions,
  allPlayersBets,
}: PlayerActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomBetOpen, setIsCustomBetOpen] = useState(false);
  const [customBetValue, setCustomBetValue] = useState<string>(currentBet > 0 ? currentBet.toString() : "");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Функция округления до 1 знака после запятой
  const roundToOneDecimal = (value: number): number => {
    return Math.round(value * 10) / 10;
  };

  // Функция для расчета размера ставки в зависимости от действия
  const calculateBetSize = (action: PlayerAction): number => {
    if (action === "bet-open") {
      return 2.5; // Open raise всегда 2.5 BB
    }

    // Находим ставки игроков с соответствующими действиями
    const getBetForAction = (targetAction: PlayerAction): number => {
      for (let i = 0; i < allPlayersActions.length; i++) {
        if (allPlayersActions[i] === targetAction && allPlayersBets[i] > 0) {
          return allPlayersBets[i];
        }
      }
      return 0;
    };

    if (action === "raise-3bet") {
      const openBet = getBetForAction("bet-open");
      const calculated = openBet > 0 ? openBet * 3 : 2.5 * 3; // 3x от open raise
      return roundToOneDecimal(calculated);
    }

    if (action === "raise-4bet") {
      const threeBet = getBetForAction("raise-3bet");
      const calculated = threeBet > 0 ? threeBet * 2.6 : 0; // 2.6x от 3-bet
      return calculated > 0 ? roundToOneDecimal(calculated) : 0;
    }

    if (action === "raise-5bet") {
      const fourBet = getBetForAction("raise-4bet");
      const calculated = fourBet > 0 ? fourBet * 2.3 : 0; // 2.3x от 4-bet
      return calculated > 0 ? roundToOneDecimal(calculated) : 0;
    }

    return 0;
  };

  // Определяем доступные действия
  const availableActions = useMemo(() => {
    // Базовые действия всегда доступны
    const available: PlayerAction[] = [...baseActions];

    // Находим максимальную ставку в цепочке среди всех игроков
    const maxBettingAction = allPlayersActions.reduce<PlayerAction | null>((max, action) => {
      if (!action || !bettingChain.includes(action)) return max;

      if (!max) return action;

      const maxIndex = bettingChain.indexOf(max);
      const currentIndex = bettingChain.indexOf(action);

      return currentIndex > maxIndex ? action : max;
    }, null);

    // Определяем, какую ставку можно выбрать
    if (!maxBettingAction) {
      // Ни у кого нет ставки - доступен только bet-open (первый в цепочке)
      available.push("bet-open");
    } else {
      const maxBettingIndex = bettingChain.indexOf(maxBettingAction);

      // Если у текущего игрока уже выбрана максимальная ставка в цепочке
      if (currentAction === maxBettingAction) {
        // Он может выбрать только эту же ставку или базовые действия
        available.push(currentAction);
      } else {
        // Можно выбрать следующую ставку в цепочке после максимальной
        if (maxBettingIndex < bettingChain.length - 1) {
          available.push(bettingChain[maxBettingIndex + 1]);
        }
        // Если у игрока уже есть ставка из цепочки, оставляем её в списке
        if (currentAction && bettingChain.includes(currentAction)) {
          if (!available.includes(currentAction)) {
            available.push(currentAction);
          }
        }
      }
    }

    return available;
  }, [allPlayersActions, currentAction]);

  // Вычисляем позицию dropdown при открытии и обновляем при скролле
  useEffect(() => {
    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 4, // 4px отступ под кнопкой
          left: rect.left, // Выравниваем по левому краю кнопки
        });
      }
    };

    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  // Закрываем dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (action: PlayerAction) => {
    onActionChange(action);

    // Автоматически устанавливаем ставку для betting actions
    if (bettingChain.includes(action) && onBetChange) {
      const betSize = calculateBetSize(action);
      if (betSize > 0) {
        onBetChange(betSize);
      }
    }

    setIsOpen(false);
  };

  const handleClear = () => {
    onActionChange(null);
    setIsOpen(false);
  };

  const handleCustomBetClick = () => {
    setIsOpen(false);
    setIsCustomBetOpen(true);
  };

  const handleCustomBetSave = () => {
    const betValue = parseFloat(customBetValue);
    if (!isNaN(betValue) && betValue >= 0 && onBetChange) {
      // Округляем кастомную ставку до 1 знака после запятой
      const roundedBet = roundToOneDecimal(betValue);
      onBetChange(roundedBet);
      setIsCustomBetOpen(false);
    }
  };

  const handleCustomBetCancel = () => {
    setIsCustomBetOpen(false);
    setCustomBetValue(currentBet > 0 ? currentBet.toString() : "");
  };

  const dropdownContent = isOpen && (
    <div
      ref={dropdownRef}
      className="fixed bg-gray-800 border border-gray-600 rounded shadow-xl z-[9999] min-w-[100px]"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
      }}
    >
      <div className="max-h-[250px] overflow-y-auto">
        {currentAction && (
          <button
            onClick={handleClear}
            className="w-full px-3 py-2 text-left text-xs text-gray-400 hover:bg-gray-700 transition-colors border-b border-gray-600"
          >
            Очистить
          </button>
        )}
        {availableActions.map((action) => {
          const betSize = bettingChain.includes(action) ? calculateBetSize(action) : 0;
          return (
            <button
              key={action}
              onClick={() => handleSelect(action)}
              className={`w-full px-3 py-2 text-left text-xs transition-colors font-semibold ${getActionColor(action)} ${
                currentAction === action
                  ? "ring-2 ring-white ring-inset"
                  : ""
              }`}
            >
              <div className="flex justify-between items-center">
                <span>{actionLabels[action]}</span>
                {betSize > 0 && (
                  <span className="text-[10px] opacity-80 ml-2">
                    {betSize.toFixed(1)} BB
                  </span>
                )}
              </div>
            </button>
          );
        })}
        {onBetChange && (
          <button
            onClick={handleCustomBetClick}
            className="w-full px-3 py-2 text-left text-xs transition-colors font-semibold bg-orange-600 hover:bg-orange-700 text-white border-t border-gray-600"
          >
            Своя ставка {currentBet > 0 ? `(${currentBet.toFixed(1)} BB)` : ""}
          </button>
        )}
      </div>
    </div>
  );

  // Модальное окно для ввода кастомной ставки
  const customBetModal = isCustomBetOpen && (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000]">
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 shadow-2xl min-w-[300px]">
        <h3 className="text-lg font-bold text-white mb-4">Введите размер ставки</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Ставка (BB)
          </label>
          <input
            type="number"
            value={customBetValue}
            onChange={(e) => setCustomBetValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCustomBetSave();
              } else if (e.key === "Escape") {
                handleCustomBetCancel();
              }
            }}
            autoFocus
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="Например: 2.5"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCustomBetSave}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Сохранить
          </button>
          <button
            onClick={handleCustomBetCancel}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`px-2 py-1 text-xs rounded border min-w-[60px] transition-colors font-semibold ${getButtonColor(currentAction)}`}
      >
        {currentAction ? actionLabels[currentAction] : "Action"}
      </button>

      {typeof window !== "undefined" && dropdownContent && createPortal(dropdownContent, document.body)}
      {typeof window !== "undefined" && customBetModal && createPortal(customBetModal, document.body)}
    </>
  );
}
