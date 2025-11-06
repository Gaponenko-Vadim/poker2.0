"use client";

import { useState } from "react";
import Header from "@/components/Header";
import PokerTable from "@/components/PokerTable";
import TournamentSettings from "@/components/TournamentSettings";
import PlayerSettingsPopup from "@/components/PlayerSettingsPopup";
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import {
  rotateSixMaxTable,
  setSixMaxPlayerStrength,
  setSixMaxPlayerPlayStyle,
  setSixMaxPlayerStackSize,
  setSixMaxAutoAllIn,
  setSixMaxOpenRaiseSize,
  setSixMaxThreeBetMultiplier,
  setSixMaxFourBetMultiplier,
  setSixMaxFiveBetMultiplier,
  setSixMaxPlayerCards,
  setSixMaxPlayerRange,
  setSixMaxPlayerAction,
  setSixMaxPlayerBet,
  setSixMaxBuyIn,
  setSixMaxAnte,
  setSixMaxStage,
  setSixMaxStartingStack,
  setSixMaxBounty,
  setSixMaxCategory,
  setSixMaxEnabledPlayStyles,
  setSixMaxEnabledStrengths,
  newSixMaxDeal,
  PlayerStrength,
  PlayerPlayStyle,
  StackSize,
  Card,
  PlayerAction,
  TournamentStage,
  TournamentCategory,
} from "@/lib/redux/slices/tableSlice";
import { getNextStrength } from "@/lib/utils/playerStrength";
import { getNextPlayStyle } from "@/lib/utils/playerPlayStyle";
import { getNextStackSize } from "@/lib/utils/stackSize";

/**
 * Страница турнира 6-Max
 * Отображает стол на 6 игроков с данными из Redux store
 */
export default function SixMaxPage() {
  const dispatch = useAppDispatch();

  // Стейт для управления попапом настроек Hero
  const [isHeroSettingsOpen, setIsHeroSettingsOpen] = useState(false);

  // Получаем данные из Redux store
  const users = useAppSelector((state) => state.table.sixMaxUsers);
  const heroIndex = useAppSelector((state) => state.table.sixMaxHeroIndex);
  const buyIn = useAppSelector((state) => state.table.sixMaxBuyIn);
  const ante = useAppSelector((state) => state.table.sixMaxAnte);
  const pot = useAppSelector((state) => state.table.sixMaxPot);
  const stage = useAppSelector((state) => state.table.sixMaxStage);
  const startingStack = useAppSelector(
    (state) => state.table.sixMaxStartingStack
  );
  const bounty = useAppSelector((state) => state.table.sixMaxBounty);
  const autoAllIn = useAppSelector((state) => state.table.sixMaxAutoAllIn);
  const openRaiseSize = useAppSelector((state) => state.table.sixMaxOpenRaiseSize);
  const threeBetMultiplier = useAppSelector((state) => state.table.sixMaxThreeBetMultiplier);
  const fourBetMultiplier = useAppSelector((state) => state.table.sixMaxFourBetMultiplier);
  const fiveBetMultiplier = useAppSelector((state) => state.table.sixMaxFiveBetMultiplier);
  const enabledPlayStyles = useAppSelector((state) => state.table.sixMaxEnabledPlayStyles);
  const enabledStrengths = useAppSelector((state) => state.table.sixMaxEnabledStrengths);

  // Вычисляем средний размер стека
  const averageStackSize: StackSize = users[0]?.stackSize || "medium";

  // Вывод всех пользователей в консоль
  console.log("=== 6-Max Users ===");
  console.log("All users:", users);
  users.forEach((user, index) => {
    console.log(`User ${index}:`, {
      name: user.name,
      stack: user.stack,
      strength: user.strength,
      position: user.position,
    });
  });
  console.log("==================");

  // Обработчик вращения стола
  const handleRotateTable = () => {
    dispatch(rotateSixMaxTable());
  };

  // Обработчик новой раздачи
  const handleNewDeal = () => {
    dispatch(newSixMaxDeal());
  };

  // Обработчик переключения силы игрока
  const handleTogglePlayerStrength = (
    index: number,
    currentStrength: PlayerStrength
  ) => {
    const newStrength = getNextStrength(currentStrength, enabledStrengths);
    dispatch(setSixMaxPlayerStrength({ index, strength: newStrength }));
  };

  // Обработчик переключения стиля игры
  const handleTogglePlayerPlayStyle = (
    index: number,
    currentPlayStyle: PlayerPlayStyle
  ) => {
    const newPlayStyle = getNextPlayStyle(currentPlayStyle, enabledPlayStyles);
    dispatch(setSixMaxPlayerPlayStyle({ index, playStyle: newPlayStyle }));
  };

  // Обработчик переключения размера стека игрока
  const handleTogglePlayerStackSize = (
    index: number,
    currentStackSize: StackSize
  ) => {
    const newStackSize = getNextStackSize(currentStackSize);
    dispatch(setSixMaxPlayerStackSize({ index, stackSize: newStackSize }));
  };

  // Обработчик переключения глобального автоматического all-in
  const handleToggleAutoAllIn = (value: boolean) => {
    dispatch(setSixMaxAutoAllIn(value));
  };

  // Обработчики изменения размера опена и множителей
  const handleOpenRaiseSizeChange = (value: number) => {
    dispatch(setSixMaxOpenRaiseSize(value));
  };

  const handleThreeBetMultiplierChange = (value: number) => {
    dispatch(setSixMaxThreeBetMultiplier(value));
  };

  const handleFourBetMultiplierChange = (value: number) => {
    dispatch(setSixMaxFourBetMultiplier(value));
  };

  const handleFiveBetMultiplierChange = (value: number) => {
    dispatch(setSixMaxFiveBetMultiplier(value));
  };

  const handleEnabledPlayStylesChange = (styles: { tight: boolean; balanced: boolean; aggressor: boolean }) => {
    dispatch(setSixMaxEnabledPlayStyles(styles));
  };

  const handleEnabledStrengthsChange = (strengths: { fish: boolean; amateur: boolean; regular: boolean }) => {
    dispatch(setSixMaxEnabledStrengths(strengths));
  };

  // Обработчик изменения карт игрока
  const handleCardsChange = (
    index: number,
    cards: [Card | null, Card | null]
  ) => {
    dispatch(setSixMaxPlayerCards({ index, cards }));
    console.log(`Player ${index} cards changed:`, cards);
    console.log("Hero cards in Redux:", users[heroIndex].cards);
  };

  // Обработчик изменения диапазона игрока
  const handleRangeChange = (index: number, range: string[]) => {
    dispatch(setSixMaxPlayerRange({ index, range }));
    console.log(`Player ${index} range changed:`, range);
  };

  // Обработчик изменения действия игрока
  const handleActionChange = (index: number, action: PlayerAction | null) => {
    dispatch(setSixMaxPlayerAction({ index, action }));
    console.log(`Player ${index} action changed:`, action);
  };

  // Обработчик изменения ставки игрока
  const handleBetChange = (index: number, bet: number) => {
    dispatch(setSixMaxPlayerBet({ index, bet }));
    console.log(`Player ${index} bet changed:`, bet);
  };

  // Обработчики для настроек турнира
  const handleAverageStackChange = (stack: StackSize) => {
    // Обновляем размер стека для всех игроков
    users.forEach((_, index) => {
      dispatch(setSixMaxPlayerStackSize({ index, stackSize: stack }));
    });
  };

  const handleBuyInChange = (newBuyIn: number) => {
    dispatch(setSixMaxBuyIn(newBuyIn));
    // Автоматически обновляем категорию турнира при изменении buy-in
    const getBuyInCategory = (buyIn: number): TournamentCategory => {
      if (buyIn < 5) return "micro";
      if (buyIn < 22) return "low";
      if (buyIn < 109) return "mid";
      return "high";
    };
    dispatch(setSixMaxCategory(getBuyInCategory(newBuyIn)));
  };

  const handleAnteChange = (newAnte: number) => {
    dispatch(setSixMaxAnte(newAnte));
  };

  const handleStageChange = (newStage: TournamentStage) => {
    dispatch(setSixMaxStage(newStage));
  };

  const handleStartingStackChange = (newStack: number) => {
    dispatch(setSixMaxStartingStack(newStack));
  };

  const handleBountyChange = (newBounty: boolean) => {
    dispatch(setSixMaxBounty(newBounty));
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Шапка с кнопкой "Назад" */}
      <Header
        showBackButton
        backUrl="/"
        title="6-Max Турнир"
        onProfileClick={() => setIsHeroSettingsOpen(true)}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Настройки турнира */}
        <TournamentSettings
          averageStack={averageStackSize}
          onAverageStackChange={handleAverageStackChange}
          buyIn={buyIn}
          onBuyInChange={handleBuyInChange}
          ante={ante}
          onAnteChange={handleAnteChange}
          stage={stage}
          onStageChange={handleStageChange}
          startingStack={startingStack}
          onStartingStackChange={handleStartingStackChange}
          showAnte={true}
          playersCount={users.length}
          bounty={bounty}
          onBountyChange={handleBountyChange}
        />

        {/* Попап глобальных настроек игры */}
        <PlayerSettingsPopup
          isOpen={isHeroSettingsOpen}
          onClose={() => setIsHeroSettingsOpen(false)}
          playerName="Глобальные настройки"
          autoAllIn={autoAllIn}
          onToggleAutoAllIn={handleToggleAutoAllIn}
          openRaiseSize={openRaiseSize}
          onOpenRaiseSizeChange={handleOpenRaiseSizeChange}
          threeBetMultiplier={threeBetMultiplier}
          fourBetMultiplier={fourBetMultiplier}
          fiveBetMultiplier={fiveBetMultiplier}
          onThreeBetMultiplierChange={handleThreeBetMultiplierChange}
          onFourBetMultiplierChange={handleFourBetMultiplierChange}
          onFiveBetMultiplierChange={handleFiveBetMultiplierChange}
          enabledPlayStyles={enabledPlayStyles}
          enabledStrengths={enabledStrengths}
          onEnabledPlayStylesChange={handleEnabledPlayStylesChange}
          onEnabledStrengthsChange={handleEnabledStrengthsChange}
        />

        {/* Покерный стол */}
        <section className="relative">
          <PokerTable
            users={users}
            tableType="6-max"
            heroIndex={heroIndex}
            basePot={pot}
            autoAllIn={autoAllIn}
            onToggleAutoAllIn={handleToggleAutoAllIn}
            onRotateTable={handleRotateTable}
            onTogglePlayerStrength={handleTogglePlayerStrength}
            onTogglePlayerPlayStyle={handleTogglePlayerPlayStyle}
            onTogglePlayerStackSize={handleTogglePlayerStackSize}
            onCardsChange={handleCardsChange}
            onRangeChange={handleRangeChange}
            onActionChange={handleActionChange}
            onBetChange={handleBetChange}
            openRaiseSize={openRaiseSize}
            threeBetMultiplier={threeBetMultiplier}
            fourBetMultiplier={fourBetMultiplier}
            fiveBetMultiplier={fiveBetMultiplier}
            enabledPlayStyles={enabledPlayStyles}
            enabledStrengths={enabledStrengths}
          />
        </section>
        {/* Кнопка новой раздачи */}
        <div className="max-w-6xl mx-auto mb-4 mt-20">
          <button
            onClick={handleNewDeal}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
          >
            <span className="text-xl">🃏</span>
            <span>Новая раздача</span>
          </button>
        </div>

        {/* Панель отладки - отображение всех игроков */}
        <section className="max-w-6xl mx-auto mt-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">
              Все игроки за столом (из Redux Store)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user, index) => (
                <div
                  key={index}
                  className={`bg-gray-950 border rounded p-4 ${
                    index === heroIndex
                      ? "border-yellow-400 ring-2 ring-yellow-400/50"
                      : "border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-emerald-400">
                      {user.name} ({user.position})
                    </h4>
                    {index === heroIndex && (
                      <span className="text-xs bg-yellow-400 text-gray-900 px-2 py-1 rounded font-bold">
                        HERO
                      </span>
                    )}
                  </div>
                  <pre className="text-xs text-gray-300 overflow-x-auto">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
