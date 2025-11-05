"use client";

import { useMemo } from "react";
import {
  PlayerAction,
  BettingInfo,
  ActionResult,
} from "@/lib/types/actions";

interface PlayerActionsProps {
  bettingInfo: BettingInfo;
  onAction: (result: ActionResult) => void;
  className?: string;
}

export default function PlayerActions({
  bettingInfo,
  onAction,
  className = "",
}: PlayerActionsProps) {
  // Определяем доступные действия в зависимости от уровня ставок
  const availableActions = useMemo<PlayerAction[]>(() => {
    const actions: PlayerAction[] = ["fold", "call"];

    // Определяем действие для повышения ставки
    if (bettingInfo.level === 0) {
      // Никто не ставил - можно сделать Bet
      actions.push("bet");
    } else if (bettingInfo.level === 1) {
      // Кто-то поставил - можно сделать Raise
      actions.push("raise");
    } else if (bettingInfo.level === 2) {
      // Был рейз - можно сделать 3-bet
      actions.push("3-bet");
    } else if (bettingInfo.level === 3) {
      // Был 3-bet - можно сделать 4-bet
      actions.push("4-bet");
    } else if (bettingInfo.level === 4) {
      // Был 4-bet - можно сделать 5-bet
      actions.push("5-bet");
    }

    // All-in всегда доступен
    actions.push("all-in");

    return actions;
  }, [bettingInfo.level]);

  // Получаем текст для кнопки
  const getActionLabel = (action: PlayerAction): string => {
    const labels: Record<PlayerAction, string> = {
      fold: "Fold",
      call: "Call",
      check: "Check",
      bet: "Bet",
      raise: "Raise",
      "3-bet": "3-Bet",
      "4-bet": "4-Bet",
      "5-bet": "5-Bet",
      "all-in": "All-In",
    };
    return labels[action];
  };

  // Получаем цвет кнопки в зависимости от действия
  const getActionColor = (action: PlayerAction): string => {
    if (action === "fold") {
      return "bg-red-600 hover:bg-red-700 text-white";
    }
    if (action === "call") {
      return "bg-green-600 hover:bg-green-700 text-white";
    }
    if (action === "all-in") {
      return "bg-purple-600 hover:bg-purple-700 text-white";
    }
    // Все ставки (bet, raise, 3-bet, 4-bet, 5-bet)
    return "bg-blue-600 hover:bg-blue-700 text-white";
  };

  // Обработчик клика по действию
  const handleAction = (action: PlayerAction) => {
    let amount: number | undefined;

    if (action === "call") {
      amount = bettingInfo.currentBet;
    } else if (action === "all-in") {
      amount = bettingInfo.playerStack;
    } else if (action !== "fold" && action !== "check") {
      // Для всех типов ставок используем минимальный рейз
      // В реальной игре здесь должен быть слайдер или инпут для выбора размера
      amount = bettingInfo.currentBet + bettingInfo.minRaise;
    }

    onAction({ action, amount });
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="text-white text-sm mb-2 space-y-1">
        <div>Банк: {bettingInfo.pot} BB</div>
        <div>Текущая ставка: {bettingInfo.currentBet} BB</div>
        <div>Ваш стек: {bettingInfo.playerStack} BB</div>
      </div>

      <div className="flex flex-col gap-2">
        {availableActions.map((action) => (
          <button
            key={action}
            onClick={() => handleAction(action)}
            className={`
              ${getActionColor(action)}
              px-6 py-3 rounded-lg
              font-semibold text-lg
              transition-all duration-200
              shadow-md hover:shadow-lg
              active:scale-95
            `}
          >
            {getActionLabel(action)}
          </button>
        ))}
      </div>
    </div>
  );
}
