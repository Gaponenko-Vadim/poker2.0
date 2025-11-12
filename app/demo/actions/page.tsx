"use client";

import React, { useState } from "react";
import PlayerActions from "@/components/PlayerActions";
import { BettingInfo, BettingLevel, ActionResult } from "@/lib/types/actions";

export default function ActionsDemo() {
  const [bettingLevel, setBettingLevel] = useState<BettingLevel>(0);
  const [currentBet, setCurrentBet] = useState(0);
  const [pot, setPot] = useState(15);
  const [playerStack, setPlayerStack] = useState(1000);
  const [lastAction, setLastAction] = useState<ActionResult | null>(null);
  const [actionHistory, setActionHistory] = useState<ActionResult[]>([]);

  const bettingInfo: BettingInfo = {
    level: bettingLevel,
    currentBet,
    pot,
    playerStack,
    minRaise: currentBet > 0 ? currentBet : 10,
  };

  const handleAction = (result: ActionResult) => {
    setLastAction(result);
    setActionHistory((prev) => [...prev, result]);

    // Обновляем состояние в зависимости от действия
    if (result.action === "fold") {
      // Сброс игры
      resetGame();
    } else if (result.action === "call") {
      // Уравнивание ставки
      setPot((prev) => prev + currentBet);
      setPlayerStack((prev) => prev - currentBet);
    } else if (result.action === "all-in") {
      // Ва-банк
      setPot((prev) => prev + playerStack);
      setPlayerStack(0);
    } else if (result.amount) {
      // Любая ставка
      setPot((prev) => prev + result.amount!);
      setPlayerStack((prev) => prev - result.amount!);
      setCurrentBet(result.amount);

      // Увеличиваем уровень ставок
      if (bettingLevel < 5) {
        setBettingLevel((prev) => (prev + 1) as BettingLevel);
      }
    }
  };

  const resetGame = () => {
    setBettingLevel(0);
    setCurrentBet(0);
    setPot(15);
    setPlayerStack(1000);
    setLastAction(null);
    setActionHistory([]);
  };

  const simulateOpponentBet = () => {
    const betAmount = currentBet > 0 ? currentBet * 2 : 20;
    setCurrentBet(betAmount);
    setPot((prev) => prev + betAmount);

    if (bettingLevel < 5) {
      setBettingLevel((prev) => (prev + 1) as BettingLevel);
    }
  };

  const getBettingLevelText = () => {
    const levels = [
      "Никто не ставил (Bet доступен)",
      "Была ставка (Raise доступен)",
      "Был рейз (3-bet доступен)",
      "Был 3-bet (4-bet доступен)",
      "Был 4-bet (5-bet доступен)",
      "Максимальный уровень",
    ];
    return levels[bettingLevel];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Демонстрация компонента действий игрока
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Левая колонка - компонент действий */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-2xl">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Доступные действия
            </h2>
            <div className="mb-4 p-4 bg-gray-700 rounded-lg">
              <p className="text-white text-sm">
                <span className="font-semibold">Уровень ставок:</span>{" "}
                {getBettingLevelText()}
              </p>
            </div>
            <PlayerActions
              bettingInfo={bettingInfo}
              onAction={handleAction}
            />
          </div>

          {/* Правая колонка - информация и управление */}
          <div className="space-y-6">
            {/* Последнее действие */}
            {lastAction && (
              <div className="bg-green-800 rounded-xl p-6 shadow-2xl">
                <h3 className="text-xl font-semibold text-white mb-3">
                  Последнее действие
                </h3>
                <div className="space-y-2">
                  <p className="text-white">
                    <span className="font-semibold">Действие:</span>{" "}
                    {lastAction.action}
                  </p>
                  {lastAction.amount !== undefined && (
                    <p className="text-white">
                      <span className="font-semibold">Сумма:</span>{" "}
                      {lastAction.amount} BB
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Управление демо */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-2xl">
              <h3 className="text-xl font-semibold text-white mb-4">
                Управление демо
              </h3>
              <div className="space-y-3">
                <button
                  onClick={simulateOpponentBet}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  Симулировать ставку оппонента
                </button>
                <button
                  onClick={resetGame}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  Сбросить игру
                </button>

                <div className="mt-4 space-y-2">
                  <label className="block text-white text-sm font-semibold">
                    Ручная установка уровня ставок:
                  </label>
                  <select
                    value={bettingLevel}
                    onChange={(e) => setBettingLevel(Number(e.target.value) as BettingLevel)}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
                  >
                    <option value={0}>0 - Никто не ставил (Bet)</option>
                    <option value={1}>1 - Была ставка (Raise)</option>
                    <option value={2}>2 - Был рейз (3-bet)</option>
                    <option value={3}>3 - Был 3-bet (4-bet)</option>
                    <option value={4}>4 - Был 4-bet (5-bet)</option>
                    <option value={5}>5 - Максимальный уровень</option>
                  </select>
                </div>
              </div>
            </div>

            {/* История действий */}
            {actionHistory.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6 shadow-2xl">
                <h3 className="text-xl font-semibold text-white mb-4">
                  История действий
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {actionHistory.map((action, index) => (
                    <div
                      key={index}
                      className="bg-gray-700 p-3 rounded-lg text-white text-sm"
                    >
                      <span className="font-semibold">#{index + 1}:</span>{" "}
                      {action.action}
                      {action.amount !== undefined &&
                        ` - ${action.amount} BB`}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Инструкция */}
        <div className="mt-8 bg-blue-900 rounded-xl p-6 shadow-2xl">
          <h3 className="text-xl font-semibold text-white mb-3">
            Как использовать
          </h3>
          <ul className="text-white space-y-2 list-disc list-inside">
            <li>
              <strong>Fold</strong> - сброс карт, сбрасывает игру
            </li>
            <li>
              <strong>Call</strong> - уравнять текущую ставку
            </li>
            <li>
              <strong>Bet/Raise/3-bet/4-bet/5-bet</strong> - сделать/повысить ставку
            </li>
            <li>
              <strong>All-In</strong> - поставить весь стек
            </li>
            <li>
              Используйте кнопку &quot;Симулировать ставку оппонента&quot; для повышения уровня ставок
            </li>
            <li>
              Или вручную выберите уровень ставок из выпадающего списка
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
