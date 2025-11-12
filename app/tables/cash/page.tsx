"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import PokerTable from "@/components/PokerTable";
import TournamentSettings from "@/components/TournamentSettings";
import PlayerSettingsPopup from "@/components/PlayerSettingsPopup";
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import { getRangeFromData } from "@/lib/utils/tournamentRangeLoader";
import {
  setCashUsersCount,
  rotateCashTable,
  PlayerStrength,
  PlayerPlayStyle,
  StackSize,
  setCashPlayerStrength,
  setCashPlayerPlayStyle,
  setCashPlayerStackSize,
  setCashAutoAllIn,
  setCashOpenRaiseSize,
  setCashThreeBetMultiplier,
  setCashFourBetMultiplier,
  setCashFiveBetMultiplier,
  setCashPlayerCards,
  setCashPlayerRange,
  setCashPlayerAction,
  setCashPlayerBet,
  setCashBuyIn,
  setCashAnte,
  setCashStage,
  setCashStartingStack,
  setCashEnabledPlayStyles,
  setCashEnabledStrengths,
  setCashActiveRangeSet,
  setCashActiveRangeSetData,
  newCashDeal,
  Card,
  PlayerAction,
  TournamentStage,
  TournamentCategory,
} from "@/lib/redux/slices/tableSlice";
import { getNextStrength } from "@/lib/utils/playerStrength";
import { getNextPlayStyle } from "@/lib/utils/playerPlayStyle";
import { getNextStackSize } from "@/lib/utils/stackSize";

/**
 * Страница Cash игры
 * Отображает стол с настраиваемым количеством игроков (от 2 до 9)
 */
export default function CashPage() {
  const dispatch = useAppDispatch();

  // Стейт для управления попапом настроек Hero
  const [isHeroSettingsOpen, setIsHeroSettingsOpen] = useState(false);

  // Получаем данные из Redux store
  const users = useAppSelector((state) => state.table.cashUsers);
  const usersCount = useAppSelector((state) => state.table.cashUsersCount);
  const heroIndex = useAppSelector((state) => state.table.cashHeroIndex);
  const buyIn = useAppSelector((state) => state.table.cashBuyIn);
  const ante = useAppSelector((state) => state.table.cashAnte);
  const pot = useAppSelector((state) => state.table.cashPot);
  const stage = useAppSelector((state) => state.table.cashStage);
  const startingStack = useAppSelector(
    (state) => state.table.cashStartingStack
  );
  // Для cash-игр устанавливаем дефолтные значения для турнирных параметров
  const category: TournamentCategory = "micro";
  const bounty = false;
  const autoAllIn = useAppSelector((state) => state.table.cashAutoAllIn);
  const openRaiseSize = useAppSelector((state) => state.table.cashOpenRaiseSize);
  const threeBetMultiplier = useAppSelector((state) => state.table.cashThreeBetMultiplier);
  const fourBetMultiplier = useAppSelector((state) => state.table.cashFourBetMultiplier);
  const fiveBetMultiplier = useAppSelector((state) => state.table.cashFiveBetMultiplier);
  const enabledPlayStyles = useAppSelector((state) => state.table.cashEnabledPlayStyles);
  const enabledStrengths = useAppSelector((state) => state.table.cashEnabledStrengths);
  const activeRangeSetId = useAppSelector((state) => state.table.cashActiveRangeSetId);
  const activeRangeSetName = useAppSelector((state) => state.table.cashActiveRangeSetName);
  const activeRangeSetData = useAppSelector((state) => state.table.cashActiveRangeSetData);

  // Вычисляем средний размер стека
  const averageStackSize: StackSize = users[0]?.stackSize || "medium";

  // Загрузка и применение диапазонов из БД
  useEffect(() => {
    const loadAndApplyRanges = async () => {
      // Если выбран дефолт - очищаем данные из Redux и принудительно перезагружаем дефолтные диапазоны
      if (activeRangeSetId === null) {
        console.log("🔄 [Cash] Switching to default ranges");

        // КРИТИЧНО: Сначала очищаем данные диапазонов из БД
        dispatch(setCashActiveRangeSetData(null));

        // Принудительно перезагружаем дефолтные диапазоны для всех игроков через reducers
        console.log("🔄 [Cash] Force reloading default ranges for all players");
        users.forEach((user, index) => {
          if (index === heroIndex) return;
          // Триггерим reducer, который автоматически загрузит дефолтные диапазоны
          dispatch(setCashPlayerStackSize({ index, stackSize: user.stackSize }));
        });

        return;
      }

      console.log("📥 [Cash] Loading range set ID:", activeRangeSetId, "Name:", activeRangeSetName);

      try {
        const response = await fetch(`/api/user-ranges/${activeRangeSetId}`);
        const result = await response.json();

        console.log("📦 [Cash] API response:", result);

        if (!result.success || !result.data) {
          console.error("❌ [Cash] Failed to load range set:", result.error);
          return;
        }

        // PostgreSQL JSONB поле уже возвращается как объект, парсинг не нужен
        const rangeData = result.data.range_data;
        console.log("📊 [Cash] Range data structure:", Object.keys(rangeData));

        // КРИТИЧНО: Сначала сохраняем данные диапазонов в Redux
        console.log("💾 [Cash] Saving range data to Redux");
        dispatch(setCashActiveRangeSetData(rangeData));

        // КРИТИЧНО: Теперь принудительно перезагружаем диапазоны для ВСЕХ игроков через reducers
        // Это гарантирует, что reducers будут использовать только что сохраненные данные из БД
        console.log("🔄 [Cash] Force reloading ranges for all players via reducers");
        users.forEach((user, index) => {
          if (index === heroIndex) return;
          // Триггерим reducer, который автоматически загрузит диапазоны из БД (через customRangeData)
          dispatch(setCashPlayerStackSize({ index, stackSize: user.stackSize }));
        });

        console.log("✅ [Cash] Loaded and applied ranges from set:", activeRangeSetName);
        console.log("📋 [Cash] All users:", users.map(u => ({ position: u.position, range: u.range.slice(0, 3) + "..." })));
      } catch (error) {
        console.error("❌ [Cash] Error loading range set:", error);
      }
    };

    loadAndApplyRanges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRangeSetId, stage]);

  // Обработчик изменения количества игроков
  const handleUsersCountChange = (count: number) => {
    dispatch(setCashUsersCount(count));
  };

  // Обработчик вращения стола
  const handleRotateTable = () => {
    dispatch(rotateCashTable());
  };

  // Обработчик новой раздачи
  const handleNewDeal = () => {
    dispatch(newCashDeal());
  };

  const handleTogglePlayerStrength = (
    index: number,
    currentStrength: PlayerStrength
  ) => {
    const newStrength = getNextStrength(currentStrength);
    dispatch(setCashPlayerStrength({ index, strength: newStrength }));
  };

  const handleTogglePlayerPlayStyle = (
    index: number,
    currentPlayStyle: PlayerPlayStyle
  ) => {
    const newPlayStyle = getNextPlayStyle(currentPlayStyle);
    dispatch(setCashPlayerPlayStyle({ index, playStyle: newPlayStyle }));
  };

  const handleTogglePlayerStackSize = (
    index: number,
    currentStackSize: StackSize
  ) => {
    const newStackSize = getNextStackSize(currentStackSize);
    dispatch(setCashPlayerStackSize({ index, stackSize: newStackSize }));
  };

  // Обработчик переключения глобального автоматического all-in
  const handleToggleAutoAllIn = (value: boolean) => {
    dispatch(setCashAutoAllIn(value));
  };

  // Обработчики изменения размера опена и множителей
  const handleOpenRaiseSizeChange = (value: number) => {
    dispatch(setCashOpenRaiseSize(value));
  };

  const handleThreeBetMultiplierChange = (value: number) => {
    dispatch(setCashThreeBetMultiplier(value));
  };

  const handleFourBetMultiplierChange = (value: number) => {
    dispatch(setCashFourBetMultiplier(value));
  };

  const handleFiveBetMultiplierChange = (value: number) => {
    dispatch(setCashFiveBetMultiplier(value));
  };

  const handleEnabledPlayStylesChange = (styles: { tight: boolean; balanced: boolean; aggressor: boolean }) => {
    dispatch(setCashEnabledPlayStyles(styles));
  };

  const handleEnabledStrengthsChange = (strengths: { fish: boolean; amateur: boolean; regular: boolean }) => {
    dispatch(setCashEnabledStrengths(strengths));
  };

  // Обработчик изменения карт игрока
  const handleCardsChange = (
    index: number,
    cards: [Card | null, Card | null]
  ) => {
    dispatch(setCashPlayerCards({ index, cards }));
    console.log(`Player ${index} cards changed:`, cards);
    console.log("Hero cards in Redux:", users[heroIndex].cards);
  };

  // Обработчик изменения диапазона игрока
  const handleRangeChange = (index: number, range: string[]) => {
    dispatch(setCashPlayerRange({ index, range }));
    console.log(`Player ${index} range changed:`, range);
  };

  // Обработчик изменения действия игрока
  const handleActionChange = (index: number, action: PlayerAction | null) => {
    dispatch(setCashPlayerAction({ index, action }));
    console.log(`Player ${index} action changed:`, action);
  };

  // Обработчик изменения ставки игрока
  const handleBetChange = (index: number, bet: number) => {
    dispatch(setCashPlayerBet({ index, bet }));
    console.log(`Player ${index} bet changed:`, bet);
  };

  // Обработчики для настроек турнира
  const handleAverageStackChange = (stack: StackSize) => {
    // Обновляем размер стека для всех игроков
    users.forEach((_, index) => {
      dispatch(setCashPlayerStackSize({ index, stackSize: stack }));
    });
  };

  const handleBuyInChange = (newBuyIn: number) => {
    dispatch(setCashBuyIn(newBuyIn));
  };

  const handleAnteChange = (newAnte: number) => {
    dispatch(setCashAnte(newAnte));
  };

  const handleStageChange = (newStage: TournamentStage) => {
    dispatch(setCashStage(newStage));
  };

  const handleStartingStackChange = (newStack: number) => {
    dispatch(setCashStartingStack(newStack));
  };

  const handleActiveRangeSetChange = (id: number | null, name: string | null) => {
    dispatch(setCashActiveRangeSet({ id, name }));
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Шапка с кнопкой "Назад" */}
      <Header
        showBackButton
        backUrl="/"
        title="Cash Игра"
        onProfileClick={() => setIsHeroSettingsOpen(true)}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Информационный блок с селектором */}
        <section className="max-w-4xl mx-auto mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-2">Кеш-игра</h2>
            <p className="text-gray-400 mb-4">
              Настраиваемый формат игры с возможностью выбора количества игроков
              от 2 до 9.
            </p>

            {/* Селектор количества игроков */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Количество игроков за столом
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="2"
                  max="9"
                  value={usersCount}
                  onChange={(e) =>
                    handleUsersCountChange(Number(e.target.value))
                  }
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="w-16 text-center">
                  <span className="text-2xl font-bold text-purple-400">
                    {usersCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Быстрый выбор количества игроков */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[2, 3, 4, 5, 6, 7, 8, 9].map((count) => (
                <button
                  key={count}
                  onClick={() => handleUsersCountChange(count)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    usersCount === count
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Игроков за столом</p>
                <p className="text-2xl font-bold text-purple-400">
                  {users.length}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Тип игры</p>
                <p className="text-lg font-semibold text-gray-100">Cash</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Формат</p>
                <p className="text-lg font-semibold text-gray-100">
                  {usersCount <= 6 ? "Short-handed" : "Full Ring"}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Средний стек</p>
                <p className="text-lg font-semibold text-purple-400">
                  {Math.round(
                    users.reduce((acc, u) => acc + u.stack, 0) / users.length
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Настройки игры */}
        <TournamentSettings
          tableType="cash"
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
          showAnte={false}
          playersCount={users.length}
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
            tableType="cash"
            heroIndex={heroIndex}
            basePot={pot}
            autoAllIn={autoAllIn}
            stage="early"
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
                    <h4 className="font-bold text-purple-400">
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
