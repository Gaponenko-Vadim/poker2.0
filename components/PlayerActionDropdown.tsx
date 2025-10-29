"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { PlayerAction } from "@/lib/redux/slices/tableSlice";

interface PlayerActionDropdownProps {
  currentAction: PlayerAction | null;
  onActionChange: (action: PlayerAction | null) => void;
  allPlayersActions: (PlayerAction | null)[]; // Действия всех игроков за столом
}

const actionLabels: Record<PlayerAction, string> = {
  fold: "Fold",
  call: "Call",
  check: "Check",
  bet: "Bet",
  "raise-3bet": "Raise 3-bet",
  "raise-4bet": "Raise 4-bet",
  "raise-5bet": "Raise 5-bet",
  "all-in": "All-In",
};

const baseActions: PlayerAction[] = [
  "fold",
  "call",
  "check",
  "bet",
  "all-in",
];

const raiseActions: PlayerAction[] = [
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
    case "bet":
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
    case "bet":
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
  allPlayersActions,
}: PlayerActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Определяем доступные действия
  const availableActions = useMemo(() => {
    // Базовые действия всегда доступны
    const available: PlayerAction[] = [...baseActions];

    // Находим максимальный raise среди всех игроков
    const maxRaise = allPlayersActions.reduce<PlayerAction | null>((max, action) => {
      if (!action || !raiseActions.includes(action)) return max;

      if (!max) return action;

      const maxIndex = raiseActions.indexOf(max);
      const currentIndex = raiseActions.indexOf(action);

      return currentIndex > maxIndex ? action : max;
    }, null);

    // Определяем, какой raise можно выбрать
    if (!maxRaise) {
      // Ни у кого нет raise - доступен только raise-3bet
      available.push("raise-3bet");
    } else {
      const maxRaiseIndex = raiseActions.indexOf(maxRaise);

      // Если у текущего игрока выбран максимальный raise
      if (currentAction === maxRaise) {
        // Он может выбрать только этот же raise или базовые действия
        available.push(currentAction);
      } else {
        // Можно выбрать следующий raise после максимального
        if (maxRaiseIndex < raiseActions.length - 1) {
          available.push(raiseActions[maxRaiseIndex + 1]);
        }
        // Если у игрока уже есть raise, оставляем его в списке
        if (currentAction && raiseActions.includes(currentAction)) {
          if (!available.includes(currentAction)) {
            available.push(currentAction);
          }
        }
      }
    }

    return available;
  }, [allPlayersActions, currentAction]);

  // Закрываем dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
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
    setIsOpen(false);
  };

  const handleClear = () => {
    onActionChange(null);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-2 py-1 text-xs rounded border min-w-[60px] transition-colors font-semibold ${getButtonColor(currentAction)}`}
      >
        {currentAction ? actionLabels[currentAction] : "Action"}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg z-50 min-w-[100px]">
          <div className="max-h-[200px] overflow-y-auto">
            {currentAction && (
              <button
                onClick={handleClear}
                className="w-full px-3 py-2 text-left text-xs text-gray-400 hover:bg-gray-700 transition-colors border-b border-gray-600"
              >
                Очистить
              </button>
            )}
            {availableActions.map((action) => (
              <button
                key={action}
                onClick={() => handleSelect(action)}
                className={`w-full px-3 py-2 text-left text-xs transition-colors font-semibold ${getActionColor(action)} ${
                  currentAction === action
                    ? "ring-2 ring-white ring-inset"
                    : ""
                }`}
              >
                {actionLabels[action]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
