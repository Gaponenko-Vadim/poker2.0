"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { PlayerAction } from "@/lib/redux/slices/tableSlice";

interface PlayerActionDropdownProps {
  currentAction: PlayerAction | null;
  onActionChange: (action: PlayerAction | null) => void;
  onBetChange?: (betAmount: number) => void; // Новый callback для изменения ставки
  currentBet: number; // Текущая ставка игрока
  playerStack: number; // Стек текущего игрока
  autoAllIn?: boolean; // Глобальная настройка: автоматически ставить all-in для всех игроков
  onToggleAutoAllIn?: (value: boolean) => void; // Callback для включения глобальной настройки autoAllIn
  allPlayersActions: (PlayerAction | null)[]; // Действия всех игроков за столом
  allPlayersBets: number[]; // Ставки всех игроков за столом
}

const actionLabels: Record<PlayerAction, string> = {
  fold: "Fold",
  call: "Call",
  check: "Check",
  "bet-open": "Open",
  "raise-3bet": "3-bet",
  "raise-4bet": "4-bet",
  "raise-5bet": "5-bet",
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
  playerStack,
  autoAllIn = false,
  onToggleAutoAllIn,
  allPlayersActions,
  allPlayersBets,
}: PlayerActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomBetOpen, setIsCustomBetOpen] = useState(false);
  const [isAllInConfirmOpen, setIsAllInConfirmOpen] = useState(false);
  const [enableAutoAllIn, setEnableAutoAllIn] = useState(false);
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

    // Получаем all-in ставки для расчета
    const allInBets = allPlayersActions
      .map((act, index) => ({ action: act, bet: allPlayersBets[index] }))
      .filter(({ action: act, bet }) => act === "all-in" && bet > 0)
      .map(({ bet }) => bet)
      .sort((a, b) => b - a);

    // Находим ставки для каждого действия
    const openBet = getBetForAction("bet-open");
    const threeBet = getBetForAction("raise-3bet");
    const fourBet = getBetForAction("raise-4bet");
    const fiveBet = getBetForAction("raise-5bet");

    // Функция для определения эффективной ставки (учитывает all-in как raise)
    const getEffectiveBet = (): { level: string; bet: number; previousBet: number } => {
      if (fiveBet > 0) {
        return { level: "5bet", bet: fiveBet, previousBet: fourBet };
      }
      if (fourBet > 0) {
        // Проверяем, есть ли all-in больше fourBet, который может считаться 5bet
        const raiseSize = fourBet - threeBet;
        const minFiveBet = fourBet + raiseSize;
        for (const allinBet of allInBets) {
          if (allinBet >= minFiveBet && allinBet > fourBet) {
            return { level: "5bet", bet: allinBet, previousBet: fourBet };
          }
        }
        return { level: "4bet", bet: fourBet, previousBet: threeBet };
      }
      if (threeBet > 0) {
        // Проверяем, есть ли all-in больше threeBet, который может считаться 4bet
        const raiseSize = threeBet - openBet;
        const minFourBet = threeBet + raiseSize;
        for (const allinBet of allInBets) {
          if (allinBet >= minFourBet && allinBet > threeBet) {
            return { level: "4bet", bet: allinBet, previousBet: threeBet };
          }
        }
        return { level: "3bet", bet: threeBet, previousBet: openBet };
      }
      if (openBet > 0) {
        // Проверяем, есть ли all-in больше openBet, который может считаться 3bet
        const raiseSize = openBet - 1;
        const minThreeBet = openBet + raiseSize;
        for (const allinBet of allInBets) {
          if (allinBet >= minThreeBet && allinBet > openBet) {
            return { level: "3bet", bet: allinBet, previousBet: openBet };
          }
        }
        return { level: "open", bet: openBet, previousBet: 1 };
      }
      // Если нет обычных действий, но есть all-in - определяем его уровень по размеру
      if (allInBets.length > 0) {
        const maxAllIn = allInBets[0]; // Берем максимальный all-in

        // Определяем уровень all-in по размеру
        if (maxAllIn < 5) {
          // Меньше 5 BB - считается как open
          return { level: "open", bet: maxAllIn, previousBet: 1 };
        } else if (maxAllIn < 12) {
          // Меньше 12 BB - считается как 3bet
          return { level: "3bet", bet: maxAllIn, previousBet: 2.5 };
        } else if (maxAllIn < 20) {
          // Меньше 20 BB - считается как 4bet
          return { level: "4bet", bet: maxAllIn, previousBet: 7.5 };
        } else {
          // 20 BB и больше - считается как 5bet
          return { level: "5bet", bet: maxAllIn, previousBet: 17.5 };
        }
      }
      return { level: "none", bet: 0, previousBet: 0 };
    };

    const effectiveBet = getEffectiveBet();

    if (action === "raise-3bet") {
      if (effectiveBet.level !== "open") return 0;
      const raiseSize = effectiveBet.bet - effectiveBet.previousBet;
      const calculated = effectiveBet.bet + raiseSize;
      return roundToOneDecimal(calculated);
    }

    if (action === "raise-4bet") {
      if (effectiveBet.level !== "3bet") return 0;
      const raiseSize = effectiveBet.bet - effectiveBet.previousBet;
      const calculated = effectiveBet.bet + raiseSize;
      return roundToOneDecimal(calculated);
    }

    if (action === "raise-5bet") {
      if (effectiveBet.level !== "4bet") return 0;
      const raiseSize = effectiveBet.bet - effectiveBet.previousBet;
      const calculated = effectiveBet.bet + raiseSize;
      return roundToOneDecimal(calculated);
    }

    return 0;
  };

  // Определяем доступные действия
  const availableActions = useMemo(() => {
    // Базовые действия всегда доступны, но если текущее действие all-in, то fold недоступен
    const available: PlayerAction[] = currentAction === "all-in"
      ? baseActions.filter(action => action !== "fold")
      : [...baseActions];

    // Проверяем, является ли текущий игрок автором последней агрессивной ставки
    // Если да, то он не может сам себя переставлять
    const isCurrentPlayerLastAggressor =
      currentAction &&
      bettingChain.includes(currentAction) &&
      currentBet === Math.max(...allPlayersBets);

    // Находим ставки для каждого действия
    const getBetForAction = (targetAction: PlayerAction): number => {
      for (let i = 0; i < allPlayersActions.length; i++) {
        if (allPlayersActions[i] === targetAction && allPlayersBets[i] > 0) {
          return allPlayersBets[i];
        }
      }
      return 0;
    };

    // Проверяем наличие различных действий на столе и их размеры
    const openBet = getBetForAction("bet-open");
    const threeBet = getBetForAction("raise-3bet");
    const fourBet = getBetForAction("raise-4bet");
    const fiveBet = getBetForAction("raise-5bet");

    const hasBetOpen = openBet > 0;
    const hasThreeBet = threeBet > 0;
    const hasFourBet = fourBet > 0;
    const hasFiveBet = fiveBet > 0;

    // Получаем all-in ставки для расчета следующих действий
    const allInBets = allPlayersActions
      .map((action, index) => ({ action, bet: allPlayersBets[index] }))
      .filter(({ action, bet }) => action === "all-in" && bet > 0)
      .map(({ bet }) => bet)
      .sort((a, b) => b - a); // Сортируем по убыванию

    // Функция для определения, от какой ставки считать следующее действие
    const getEffectiveBetForNextAction = (): { level: string; bet: number; previousBet: number } => {
      // Сначала проверяем обычные действия
      if (hasFiveBet) {
        return { level: "5bet", bet: fiveBet, previousBet: fourBet };
      }
      if (hasFourBet) {
        // Проверяем, есть ли all-in больше fourBet, который может считаться 5bet
        const raiseSize = fourBet - threeBet;
        const minFiveBet = fourBet + raiseSize;
        for (const allinBet of allInBets) {
          if (allinBet >= minFiveBet && allinBet > fourBet) {
            // All-in считается как 5bet для расчета следующей ставки
            return { level: "5bet", bet: allinBet, previousBet: fourBet };
          }
        }
        return { level: "4bet", bet: fourBet, previousBet: threeBet };
      }
      if (hasThreeBet) {
        // Проверяем, есть ли all-in больше threeBet, который может считаться 4bet
        const raiseSize = threeBet - openBet;
        const minFourBet = threeBet + raiseSize;
        for (const allinBet of allInBets) {
          if (allinBet >= minFourBet && allinBet > threeBet) {
            // All-in считается как 4bet для расчета следующей ставки
            return { level: "4bet", bet: allinBet, previousBet: threeBet };
          }
        }
        return { level: "3bet", bet: threeBet, previousBet: openBet };
      }
      if (hasBetOpen) {
        // Проверяем, есть ли all-in больше openBet, который может считаться 3bet
        const raiseSize = openBet - 1;
        const minThreeBet = openBet + raiseSize;
        for (const allinBet of allInBets) {
          if (allinBet >= minThreeBet && allinBet > openBet) {
            // All-in считается как 3bet для расчета следующей ставки
            return { level: "3bet", bet: allinBet, previousBet: openBet };
          }
        }
        return { level: "open", bet: openBet, previousBet: 1 };
      }
      // Если нет обычных действий, но есть all-in - определяем его уровень по размеру
      if (allInBets.length > 0) {
        const maxAllIn = allInBets[0]; // Берем максимальный all-in

        // Определяем уровень all-in по размеру
        if (maxAllIn < 5) {
          // Меньше 5 BB - считается как open
          return { level: "open", bet: maxAllIn, previousBet: 1 };
        } else if (maxAllIn < 12) {
          // Меньше 12 BB - считается как 3bet
          return { level: "3bet", bet: maxAllIn, previousBet: 2.5 };
        } else if (maxAllIn < 20) {
          // Меньше 20 BB - считается как 4bet
          return { level: "4bet", bet: maxAllIn, previousBet: 7.5 };
        } else {
          // 20 BB и больше - считается как 5bet
          return { level: "5bet", bet: maxAllIn, previousBet: 17.5 };
        }
      }
      return { level: "none", bet: 0, previousBet: 0 };
    };

    const effectiveBet = getEffectiveBetForNextAction();

    // bet-open доступен если никто еще не сделал bet И нет all-in ставок
    if (effectiveBet.level === "none" && allInBets.length === 0) {
      available.push("bet-open");
    }

    // Рассчитываем минимальные размеры следующих ставок на основе эффективной ставки
    // Формула: минимальная следующая ставка = текущая ставка + (текущая ставка - предыдущая ставка)

    // Игрок не может переставлять сам себя
    if (!isCurrentPlayerLastAggressor) {
      if (effectiveBet.level === "open") {
        // Есть open - доступен 3bet
        const raiseSize = effectiveBet.bet - effectiveBet.previousBet;
        const minThreeBetSize = effectiveBet.bet + raiseSize;
        if (playerStack > minThreeBetSize && minThreeBetSize / playerStack < 0.8) {
          available.push("raise-3bet");
        }
      } else if (effectiveBet.level === "3bet") {
        // Есть 3bet (или all-in, равный 3bet) - доступен 4bet
        const raiseSize = effectiveBet.bet - effectiveBet.previousBet;
        const minFourBetSize = effectiveBet.bet + raiseSize;
        if (playerStack > minFourBetSize && minFourBetSize / playerStack < 0.8) {
          available.push("raise-4bet");
        }
      } else if (effectiveBet.level === "4bet") {
        // Есть 4bet (или all-in, равный 4bet) - доступен 5bet
        const raiseSize = effectiveBet.bet - effectiveBet.previousBet;
        const minFiveBetSize = effectiveBet.bet + raiseSize;
        if (playerStack > minFiveBetSize && minFiveBetSize / playerStack < 0.8) {
          available.push("raise-5bet");
        }
      }
      // Если level === "5bet", то больше нет доступных raise действий
    }

    // Если у игрока уже выбрана ставка из цепочки, оставляем её в списке
    if (currentAction && bettingChain.includes(currentAction)) {
      if (!available.includes(currentAction)) {
        available.push(currentAction);
      }
    }

    return available;
  }, [allPlayersActions, allPlayersBets, currentAction, playerStack, currentBet]);

  // Функция для определения правильного действия из цепочки ставок
  const determineAppropriateAction = (): PlayerAction | null => {
    // Проверяем доступные betting actions в порядке приоритета (от большего к меньшему)
    if (availableActions.includes("raise-5bet")) return "raise-5bet";
    if (availableActions.includes("raise-4bet")) return "raise-4bet";
    if (availableActions.includes("raise-3bet")) return "raise-3bet";
    if (availableActions.includes("bet-open")) return "bet-open";
    return null;
  };

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
    // Если выбран all-in и autoAllIn НЕ включен, показываем попап подтверждения
    if (action === "all-in" && !autoAllIn) {
      setIsOpen(false);
      setIsAllInConfirmOpen(true);
      return;
    }

    // Если autoAllIn включен, сразу ставим весь стек
    if (action === "all-in" && autoAllIn) {
      onActionChange("all-in");
      if (onBetChange) {
        onBetChange(playerStack);
      }
      setIsOpen(false);
      return;
    }

    onActionChange(action);

    // Сбрасываем ставку для fold
    if (action === "fold" && onBetChange) {
      onBetChange(0);
    }

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
    // Сбрасываем ставку игрока до 0 при очистке действия
    if (onBetChange) {
      onBetChange(0);
    }
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

      // Если текущее действие all-in, оставляем его
      // Иначе автоматически определяем правильное действие из цепочки ставок
      if (currentAction !== "all-in") {
        const appropriateAction = determineAppropriateAction();
        if (appropriateAction) {
          onActionChange(appropriateAction);
        }
      }

      setIsCustomBetOpen(false);
    }
  };

  const handleCustomBetCancel = () => {
    setIsCustomBetOpen(false);
    setCustomBetValue(currentBet > 0 ? currentBet.toString() : "");
  };

  // Обработчики для all-in подтверждения
  const handleAllInUseStack = () => {
    onActionChange("all-in");
    if (onBetChange) {
      onBetChange(playerStack);
    }

    // Если чекбокс включен и есть callback, включаем глобальную настройку autoAllIn
    if (enableAutoAllIn && onToggleAutoAllIn) {
      onToggleAutoAllIn(true);
    }

    setIsAllInConfirmOpen(false);
    setEnableAutoAllIn(false); // Сбрасываем чекбокс после использования
  };

  const handleAllInCustom = () => {
    setIsAllInConfirmOpen(false);
    setCustomBetValue(playerStack.toString());
    setIsCustomBetOpen(true);

    // All-in всегда остается all-in, независимо от размера ставки
    onActionChange("all-in");
  };

  const handleAllInCancel = () => {
    setIsAllInConfirmOpen(false);
  };

  const dropdownContent = isOpen && (
    <div
      ref={dropdownRef}
      className="fixed bg-gradient-to-b from-gray-800 to-gray-900 border-2 border-gray-700 rounded-lg shadow-2xl z-[9999] backdrop-blur-sm"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
      }}
    >
      <div className="max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {currentAction && (
          <button
            onClick={handleClear}
            className="w-full px-2 py-1 text-left text-[9px] text-gray-300 hover:bg-gray-700/60 transition-all duration-150 border-b border-gray-700/50 font-medium hover:text-white flex items-center gap-1"
          >
            <span className="text-xs">✕</span>
            <span>Очистить</span>
          </button>
        )}
        <div className="py-0.5">
          {availableActions.map((action) => {
            const betSize = bettingChain.includes(action) ? calculateBetSize(action) : 0;
            return (
              <button
                key={action}
                onClick={() => handleSelect(action)}
                className={`w-full px-2 py-1.5 text-left text-[11px] transition-all duration-150 font-bold relative overflow-hidden group ${getActionColor(action)} ${
                  currentAction === action
                    ? "ring-2 ring-yellow-400 ring-inset shadow-lg"
                    : "hover:shadow-md"
                }`}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>
                <div className="flex justify-between items-center relative z-10 gap-1">
                  <span>{actionLabels[action]}</span>
                  {betSize > 0 && (
                    <span className="text-[9px] bg-black/30 px-1 py-0.5 rounded font-semibold">
                      {betSize.toFixed(1)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {onBetChange && (
          <button
            onClick={handleCustomBetClick}
            className="w-full px-2 py-1.5 text-left text-[11px] transition-all duration-150 font-bold bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white border-t-2 border-orange-500/50 shadow-lg hover:shadow-xl flex items-center gap-1 group"
          >
            <span className="text-xs group-hover:scale-110 transition-transform">⚙</span>
            <span className="flex-1 text-[10px]">Своя</span>
            {currentBet > 0 && (
              <span className="text-[9px] bg-black/30 px-1 py-0.5 rounded font-semibold">
                {currentBet.toFixed(1)}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );

  // Модальное окно для подтверждения All-In
  const allInConfirmModal = isAllInConfirmOpen && (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-pink-500/30 rounded-2xl p-6 shadow-2xl min-w-[340px] animate-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-pink-600/20 flex items-center justify-center">
            <span className="text-2xl">💰</span>
          </div>
          <h3 className="text-xl font-bold text-white">All-In подтверждение</h3>
        </div>

        <div className="bg-gray-700/30 rounded-lg p-4 mb-4 border border-gray-600/50">
          <p className="text-sm text-gray-300">
            Ваш стек: <span className="font-bold text-2xl text-yellow-400 ml-1">{playerStack.toFixed(1)}</span>
            <span className="text-gray-400 ml-1">BB</span>
          </p>
        </div>

        {/* Чекбокс для включения глобальной настройки autoAllIn */}
        {!autoAllIn && onToggleAutoAllIn && (
          <div className="mb-4 flex items-start gap-2 bg-gradient-to-r from-pink-900/30 to-purple-900/30 rounded-lg p-3 border border-pink-700/30">
            <input
              type="checkbox"
              id="enable-auto-allin"
              checked={enableAutoAllIn}
              onChange={(e) => setEnableAutoAllIn(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-pink-600 bg-gray-700 border-gray-600 rounded focus:ring-pink-500 focus:ring-2 cursor-pointer"
            />
            <label htmlFor="enable-auto-allin" className="text-xs text-gray-200 cursor-pointer select-none">
              Всегда выбирать &ldquo;поставить весь стек&rdquo; для всех игроков (глобальная настройка)
            </label>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleAllInUseStack}
            className="w-full bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-500 hover:to-pink-600 text-white px-4 py-3.5 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-pink-500/50 hover:scale-[1.02] active:scale-95"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">🎰</span>
              <span>Поставить весь стек ({playerStack.toFixed(1)} BB)</span>
            </div>
          </button>
          <button
            onClick={handleAllInCustom}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white px-4 py-3.5 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-95"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">⚙</span>
              <span>Указать свой размер</span>
            </div>
          </button>
          <button
            onClick={handleAllInCancel}
            className="w-full bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 px-4 py-3 rounded-xl font-semibold transition-all duration-200 border border-gray-600/50 hover:scale-[1.02] active:scale-95"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );

  // Модальное окно для ввода кастомной ставки
  const customBetModal = isCustomBetOpen && (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-orange-500/30 rounded-2xl p-6 shadow-2xl min-w-[320px] animate-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-orange-600/20 flex items-center justify-center">
            <span className="text-2xl">⚙</span>
          </div>
          <h3 className="text-xl font-bold text-white">Введите размер ставки</h3>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Ставка (BB)
          </label>
          <div className="relative">
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
              className="w-full bg-gray-700/50 border-2 border-gray-600 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-gray-500"
              placeholder="Например: 2.5"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">BB</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCustomBetSave}
            className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white px-4 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-95"
          >
            Сохранить
          </button>
          <button
            onClick={handleCustomBetCancel}
            className="flex-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 px-4 py-3 rounded-xl font-semibold transition-all duration-200 border border-gray-600/50 hover:scale-[1.02] active:scale-95"
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
        className={`px-3 py-1.5 text-xs rounded-lg border-2 min-w-[70px] transition-all duration-200 font-bold shadow-md hover:shadow-lg hover:scale-105 active:scale-95 ${getButtonColor(currentAction)}`}
      >
        <div className="flex items-center justify-center gap-1">
          <span>{currentAction ? actionLabels[currentAction] : "Action"}</span>
          <span className={`text-[10px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </button>

      {typeof window !== "undefined" && dropdownContent && createPortal(dropdownContent, document.body)}
      {typeof window !== "undefined" && allInConfirmModal && createPortal(allInConfirmModal, document.body)}
      {typeof window !== "undefined" && customBetModal && createPortal(customBetModal, document.body)}
    </>
  );
}
