"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import PokerTable from "@/components/PokerTable";
import TournamentSettings from "@/components/TournamentSettings";
import PlayerSettingsPopup from "@/components/PlayerSettingsPopup";
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import { getAvailableStartingStacks, getRangeFromData, TournamentActionType } from "@/lib/utils/tournamentRangeLoader";
import {
  rotateEightMaxTable,
  setEightMaxPlayerStrength,
  setEightMaxPlayerPlayStyle,
  setEightMaxPlayerStackSize,
  setEightMaxAutoAllIn,
  setEightMaxOpenRaiseSize,
  setEightMaxThreeBetMultiplier,
  setEightMaxFourBetMultiplier,
  setEightMaxFiveBetMultiplier,
  setEightMaxPlayerCards,
  setEightMaxPlayerRange,
  setEightMaxPlayerAction,
  setEightMaxPlayerBet,
  setEightMaxBuyIn,
  setEightMaxAnte,
  setEightMaxStage,
  setEightMaxStartingStack,
  setEightMaxBounty,
  setEightMaxCategory,
  setEightMaxEnabledPlayStyles,
  setEightMaxEnabledStrengths,
  setEightMaxActiveRangeSet,
  setEightMaxActiveRangeSetData,
  newEightMaxDeal,
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
 * Страница турнира 8-Max
 * Отображает стол на 8 игроков с данными из Redux store
 */
export default function EightMaxPage() {
  const dispatch = useAppDispatch();

  // Стейт для управления попапом настроек Hero
  const [isHeroSettingsOpen, setIsHeroSettingsOpen] = useState(false);

  // Получаем данные из Redux store
  const users = useAppSelector((state) => state.table.eightMaxUsers);
  const heroIndex = useAppSelector((state) => state.table.eightMaxHeroIndex);
  const buyIn = useAppSelector((state) => state.table.eightMaxBuyIn);
  const ante = useAppSelector((state) => state.table.eightMaxAnte);
  const pot = useAppSelector((state) => state.table.eightMaxPot);
  const stage = useAppSelector((state) => state.table.eightMaxStage);
  const startingStack = useAppSelector(
    (state) => state.table.eightMaxStartingStack
  );
  const bounty = useAppSelector((state) => state.table.eightMaxBounty);
  const category = useAppSelector((state) => state.table.eightMaxCategory);
  const autoAllIn = useAppSelector((state) => state.table.eightMaxAutoAllIn);
  const openRaiseSize = useAppSelector((state) => state.table.eightMaxOpenRaiseSize);
  const threeBetMultiplier = useAppSelector((state) => state.table.eightMaxThreeBetMultiplier);
  const fourBetMultiplier = useAppSelector((state) => state.table.eightMaxFourBetMultiplier);
  const fiveBetMultiplier = useAppSelector((state) => state.table.eightMaxFiveBetMultiplier);
  const enabledPlayStyles = useAppSelector((state) => state.table.eightMaxEnabledPlayStyles);
  const enabledStrengths = useAppSelector((state) => state.table.eightMaxEnabledStrengths);
  const activeRangeSetId = useAppSelector((state) => state.table.eightMaxActiveRangeSetId);
  const activeRangeSetName = useAppSelector((state) => state.table.eightMaxActiveRangeSetName);
  const activeRangeSetData = useAppSelector((state) => state.table.eightMaxActiveRangeSetData);

  // Вычисляем средний размер стека
  const averageStackSize: StackSize = users[0]?.stackSize || "medium";

  // Автоматическая корректировка startingStack при загрузке и смене категории
  useEffect(() => {
    const availableStacks = getAvailableStartingStacks(category, bounty);

    // Если текущий startingStack недоступен для категории
    if (availableStacks.length > 0 && !availableStacks.includes(startingStack)) {
      // Выбираем первый доступный вариант
      dispatch(setEightMaxStartingStack(availableStacks[0]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, bounty, dispatch]); // Намеренно не включаем startingStack в зависимости

  // Загрузка и применение диапазонов из БД
  useEffect(() => {
    const loadAndApplyRanges = async () => {
      // Если выбран дефолт - очищаем данные из Redux и принудительно перезагружаем дефолтные диапазоны
      if (activeRangeSetId === null) {
        console.log("🔄 [8-max] Switching to default ranges");

        // КРИТИЧНО: Сначала очищаем данные диапазонов из БД
        dispatch(setEightMaxActiveRangeSetData(null));

        // Принудительно перезагружаем дефолтные диапазоны для всех игроков через reducers
        console.log("🔄 [8-max] Force reloading default ranges for all players");
        users.forEach((user, index) => {
          if (index === heroIndex) return;
          // Триггерим reducer, который автоматически загрузит дефолтные диапазоны
          dispatch(setEightMaxPlayerStackSize({ index, stackSize: user.stackSize }));
        });

        return;
      }

      console.log("📥 [8-max] Loading range set ID:", activeRangeSetId, "Name:", activeRangeSetName);

      try {
        const response = await fetch(`/api/user-ranges/${activeRangeSetId}`);
        const result = await response.json();

        console.log("📦 [8-max] API response:", result);

        if (!result.success || !result.data) {
          console.error("❌ [8-max] Failed to load range set:", result.error);
          return;
        }

        // PostgreSQL JSONB поле уже возвращается как объект, парсинг не нужен
        const rangeData = result.data.range_data;
        console.log("📊 [8-max] Range data structure:", Object.keys(rangeData));

        // КРИТИЧНО: Сначала сохраняем данные диапазонов в Redux
        console.log("💾 [8-max] Saving range data to Redux");
        dispatch(setEightMaxActiveRangeSetData(rangeData));

        // КРИТИЧНО: Теперь принудительно перезагружаем диапазоны для ВСЕХ игроков через reducers
        // Это гарантирует, что reducers будут использовать только что сохраненные данные из БД
        console.log("🔄 [8-max] Force reloading ranges for all players via reducers");
        users.forEach((user, index) => {
          if (index === heroIndex) return;
          // Триггерим reducer, который автоматически загрузит диапазоны из БД (через customRangeData)
          dispatch(setEightMaxPlayerStackSize({ index, stackSize: user.stackSize }));
        });

        console.log("✅ [8-max] Loaded and applied ranges from set:", activeRangeSetName);
        console.log("📋 [8-max] All users:", users.map(u => ({ position: u.position, range: u.range.slice(0, 3) + "..." })));
      } catch (error) {
        console.error("❌ [8-max] Error loading range set:", error);
      }
    };

    loadAndApplyRanges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRangeSetId, stage]);

  // Обработчик вращения стола
  const handleRotateTable = () => {
    dispatch(rotateEightMaxTable());
  };

  // Обработчик новой раздачи
  const handleNewDeal = () => {
    dispatch(newEightMaxDeal());
  };

  const handleTogglePlayerStrength = (
    index: number,
    currentStrength: PlayerStrength
  ) => {
    const newStrength = getNextStrength(currentStrength, enabledStrengths);
    dispatch(setEightMaxPlayerStrength({ index, strength: newStrength }));
  };

  const handleTogglePlayerPlayStyle = (
    index: number,
    currentPlayStyle: PlayerPlayStyle
  ) => {
    const newPlayStyle = getNextPlayStyle(currentPlayStyle, enabledPlayStyles);
    dispatch(setEightMaxPlayerPlayStyle({ index, playStyle: newPlayStyle }));
  };

  const handleTogglePlayerStackSize = (
    index: number,
    currentStackSize: StackSize
  ) => {
    const newStackSize = getNextStackSize(currentStackSize);
    dispatch(setEightMaxPlayerStackSize({ index, stackSize: newStackSize }));
  };

  // Обработчик переключения глобального автоматического all-in
  const handleToggleAutoAllIn = (value: boolean) => {
    dispatch(setEightMaxAutoAllIn(value));
  };

  // Обработчики изменения размера опена и множителей
  const handleOpenRaiseSizeChange = (value: number) => {
    dispatch(setEightMaxOpenRaiseSize(value));
  };

  const handleThreeBetMultiplierChange = (value: number) => {
    dispatch(setEightMaxThreeBetMultiplier(value));
  };

  const handleFourBetMultiplierChange = (value: number) => {
    dispatch(setEightMaxFourBetMultiplier(value));
  };

  const handleFiveBetMultiplierChange = (value: number) => {
    dispatch(setEightMaxFiveBetMultiplier(value));
  };

  const handleEnabledPlayStylesChange = (styles: { tight: boolean; balanced: boolean; aggressor: boolean }) => {
    dispatch(setEightMaxEnabledPlayStyles(styles));
  };

  const handleEnabledStrengthsChange = (strengths: { fish: boolean; amateur: boolean; regular: boolean }) => {
    dispatch(setEightMaxEnabledStrengths(strengths));
  };

  // Обработчик изменения карт игрока
  const handleCardsChange = (
    index: number,
    cards: [Card | null, Card | null]
  ) => {
    dispatch(setEightMaxPlayerCards({ index, cards }));
    console.log(`Player ${index} cards changed:`, cards);
    console.log("Hero cards in Redux:", users[heroIndex].cards);
  };

  // Обработчик изменения диапазона игрока
  const handleRangeChange = (index: number, range: string[]) => {
    dispatch(setEightMaxPlayerRange({ index, range }));
    console.log(`Player ${index} range changed:`, range);
  };

  // Обработчик изменения действия игрока
  const handleActionChange = (index: number, action: PlayerAction | null) => {
    dispatch(setEightMaxPlayerAction({ index, action }));
    console.log(`Player ${index} action changed:`, action);
  };

  // Обработчик изменения ставки игрока
  const handleBetChange = (index: number, bet: number) => {
    dispatch(setEightMaxPlayerBet({ index, bet }));
    console.log(`Player ${index} bet changed:`, bet);
  };

  // Обработчики для настроек турнира
  const handleAverageStackChange = (stack: StackSize) => {
    // Обновляем размер стека для всех игроков
    users.forEach((_, index) => {
      dispatch(setEightMaxPlayerStackSize({ index, stackSize: stack }));
    });
  };

  const handleBuyInChange = (newBuyIn: number) => {
    dispatch(setEightMaxBuyIn(newBuyIn));
    // Автоматически обновляем категорию турнира при изменении buy-in
    const getBuyInCategory = (buyIn: number): TournamentCategory => {
      if (buyIn < 5) return "micro";
      if (buyIn < 22) return "low";
      if (buyIn < 109) return "mid";
      return "high";
    };
    dispatch(setEightMaxCategory(getBuyInCategory(newBuyIn)));
  };

  const handleAnteChange = (newAnte: number) => {
    dispatch(setEightMaxAnte(newAnte));
  };

  const handleStageChange = (newStage: TournamentStage) => {
    dispatch(setEightMaxStage(newStage));
  };

  const handleStartingStackChange = (newStack: number) => {
    dispatch(setEightMaxStartingStack(newStack));
  };

  const handleBountyChange = (newBounty: boolean) => {
    dispatch(setEightMaxBounty(newBounty));
  };

  const handleActiveRangeSetChange = (id: number | null, name: string | null) => {
    dispatch(setEightMaxActiveRangeSet({ id, name }));
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Шапка с кнопкой "Назад" */}
      <Header
        showBackButton
        backUrl="/"
        title="8-Max Турнир"
        onProfileClick={() => setIsHeroSettingsOpen(true)}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Настройки турнира */}
        <TournamentSettings
          tableType="8-max"
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
          activeRangeSetId={activeRangeSetId}
          activeRangeSetName={activeRangeSetName}
          onActiveRangeSetChange={handleActiveRangeSetChange}
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
            tableType="8-max"
            heroIndex={heroIndex}
            basePot={pot}
            autoAllIn={autoAllIn}
            stage={stage}
            category={category}
            startingStack={startingStack}
            bounty={bounty}
            customRangeData={activeRangeSetData}
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
                    <h4 className="font-bold text-green-400">
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
