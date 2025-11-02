"use client";

import Header from "@/components/Header";
import PokerTable from "@/components/PokerTable";
import TournamentSettings from "@/components/TournamentSettings";
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import {
  rotateEightMaxTable,
  setEightMaxPlayerStrength,
  setEightMaxPlayerPlayStyle,
  setEightMaxPlayerStackSize,
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

  // Получаем данные из Redux store
  const users = useAppSelector((state) => state.table.eightMaxUsers);
  const heroIndex = useAppSelector((state) => state.table.eightMaxHeroIndex);
  const buyIn = useAppSelector((state) => state.table.eightMaxBuyIn);
  const ante = useAppSelector((state) => state.table.eightMaxAnte);
  const pot = useAppSelector((state) => state.table.eightMaxPot);
  const stage = useAppSelector((state) => state.table.eightMaxStage);
  const startingStack = useAppSelector((state) => state.table.eightMaxStartingStack);
  const bounty = useAppSelector((state) => state.table.eightMaxBounty);
  const category = useAppSelector((state) => state.table.eightMaxCategory);

  // Вычисляем средний размер стека
  const averageStackSize: StackSize = users[0]?.stackSize || "medium";

  // Обработчик вращения стола
  const handleRotateTable = () => {
    dispatch(rotateEightMaxTable());
  };

  const handleTogglePlayerStrength = (
    index: number,
    currentStrength: PlayerStrength
  ) => {
    const newStrength = getNextStrength(currentStrength);
    dispatch(setEightMaxPlayerStrength({ index, strength: newStrength }));
  };

  const handleTogglePlayerPlayStyle = (
    index: number,
    currentPlayStyle: PlayerPlayStyle
  ) => {
    const newPlayStyle = getNextPlayStyle(currentPlayStyle);
    dispatch(setEightMaxPlayerPlayStyle({ index, playStyle: newPlayStyle }));
  };

  const handleTogglePlayerStackSize = (
    index: number,
    currentStackSize: StackSize
  ) => {
    const newStackSize = getNextStackSize(currentStackSize);
    dispatch(setEightMaxPlayerStackSize({ index, stackSize: newStackSize }));
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

  const handleCategoryChange = (newCategory: TournamentCategory) => {
    dispatch(setEightMaxCategory(newCategory));
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Шапка с кнопкой "Назад" */}
      <Header showBackButton backUrl="/" title="8-Max Турнир" />

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

        {/* Покерный стол */}
        <section className="relative">
          <PokerTable
            users={users}
            tableType="8-max"
            heroIndex={heroIndex}
            basePot={pot}
            onRotateTable={handleRotateTable}
            onTogglePlayerStrength={handleTogglePlayerStrength}
            onTogglePlayerPlayStyle={handleTogglePlayerPlayStyle}
            onTogglePlayerStackSize={handleTogglePlayerStackSize}
            onCardsChange={handleCardsChange}
            onRangeChange={handleRangeChange}
            onActionChange={handleActionChange}
            onBetChange={handleBetChange}
          />
        </section>

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
