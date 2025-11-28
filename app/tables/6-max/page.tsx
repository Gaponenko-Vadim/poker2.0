"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import PokerTable from "@/components/PokerTable";
import TournamentSettings from "@/components/TournamentSettings";
import PlayerSettingsPopup from "@/components/PlayerSettingsPopup";
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import { getAvailableStartingStacks } from "@/lib/utils/tournamentRangeLoader";
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
  setSixMaxActiveRangeSet,
  setSixMaxActiveRangeSetData,
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
  const category = useAppSelector((state) => state.table.sixMaxCategory);
  const autoAllIn = useAppSelector((state) => state.table.sixMaxAutoAllIn);
  const openRaiseSize = useAppSelector((state) => state.table.sixMaxOpenRaiseSize);
  const threeBetMultiplier = useAppSelector((state) => state.table.sixMaxThreeBetMultiplier);
  const fourBetMultiplier = useAppSelector((state) => state.table.sixMaxFourBetMultiplier);
  const fiveBetMultiplier = useAppSelector((state) => state.table.sixMaxFiveBetMultiplier);
  const enabledPlayStyles = useAppSelector((state) => state.table.sixMaxEnabledPlayStyles);
  const enabledStrengths = useAppSelector((state) => state.table.sixMaxEnabledStrengths);
  const activeRangeSetId = useAppSelector((state) => state.table.sixMaxActiveRangeSetId);
  const activeRangeSetName = useAppSelector((state) => state.table.sixMaxActiveRangeSetName);
  const activeRangeSetData = useAppSelector((state) => state.table.sixMaxActiveRangeSetData);

  // Получаем токен авторизации из Redux
  const authToken = useAppSelector((state) => state.auth.user?.token);

  // Вычисляем средний размер стека
  const averageStackSize: StackSize = users[0]?.stackSize || "medium";

  // Автоматическая корректировка startingStack при загрузке и смене категории
  useEffect(() => {
    const availableStacks = getAvailableStartingStacks(category, bounty);

    // Если текущий startingStack недоступен для категории
    if (availableStacks.length > 0 && !availableStacks.includes(startingStack)) {
      // Выбираем первый доступный вариант
      dispatch(setSixMaxStartingStack(availableStacks[0]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, bounty, dispatch]); // Намеренно не включаем startingStack в зависимости

  // Загрузка и применение диапазонов из БД
  useEffect(() => {
    const loadAndApplyRanges = async () => {
      console.log("\n🔄 === НАЧАЛО ЗАГРУЗКИ ДИАПАЗОНОВ ===");
      console.log("📊 Текущее состояние:");
      console.log("  - activeRangeSetId:", activeRangeSetId);
      console.log("  - activeRangeSetName:", activeRangeSetName);
      console.log("  - stage:", stage);
      console.log("  - Количество игроков:", users.length);

      // Если выбран дефолтный набор - очищаем данные и перезагружаем дефолтные диапазоны
      if (activeRangeSetId === null) {
        console.log("ℹ️ Выбран ДЕФОЛТНЫЙ набор диапазонов");
        console.log("🗑️ Очищаю пользовательские данные из Redux");
        dispatch(setSixMaxActiveRangeSetData(null));
        console.log("✅ Теперь будут использоваться дефолтные JSON файлы (tournamentRanges_micro_200bb.json и т.д.)");

        console.log("\n🔄 ПРИНУДИТЕЛЬНО перезагружаю ДЕФОЛТНЫЕ диапазоны для ВСЕХ игроков...");
        // Принудительно перезагружаем диапазоны для всех игроков из дефолтных JSON файлов
        let reloadedCount = 0;
        users.forEach((user, index) => {
          if (index === heroIndex) {
            console.log(`  [Игрок ${index}] HERO - пропускаю`);
            return;
          }
          console.log(`  [Игрок ${index}] ${user.name}: Перезагружаю из дефолтных JSON...`);
          dispatch(setSixMaxPlayerStackSize({ index, stackSize: user.stackSize }));
          reloadedCount++;
        });
        console.log(`\n📊 Перезагружено ${reloadedCount} диапазонов из дефолтных JSON файлов`);
        console.log("=== КОНЕЦ ЗАГРУЗКИ ДИАПАЗОНОВ ===\n");
        return;
      }

      console.log("📥 Загружаю пользовательский набор из БД...");
      console.log("  - ID:", activeRangeSetId);
      console.log("  - Название:", activeRangeSetName);

      // Проверяем наличие токена
      if (!authToken) {
        console.error("❌ [6-max] Токен авторизации не найден");
        return;
      }

      try {
        // Загружаем набор диапазонов по ID
        const response = await fetch(`/api/user-ranges/${activeRangeSetId}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const result = await response.json();

        console.log("📦 Ответ от API:", result.success ? "✅ Успешно" : "❌ Ошибка");

        if (!result.success || !result.data) {
          console.error("❌ Не удалось загрузить набор диапазонов:", result.error);
          console.log("=== КОНЕЦ ЗАГРУЗКИ ДИАПАЗОНОВ ===\n");
          return;
        }

        // PostgreSQL JSONB поле уже возвращается как объект, парсинг не нужен
        const rangeData = result.data.range_data;
        console.log("📊 Структура загруженных данных:");
        console.log("  - Верхний уровень:", Object.keys(rangeData));
        if (rangeData.ranges) {
          console.log("  - ranges:", Object.keys(rangeData.ranges));
          if (rangeData.ranges.user) {
            console.log("  - ranges.user:", Object.keys(rangeData.ranges.user));
          }
        }

        // ВАЖНО: Сохраняем данные диапазонов в Redux СНАЧАЛА!
        dispatch(setSixMaxActiveRangeSetData(rangeData));
        console.log("💾 Данные диапазонов сохранены в Redux!");
        console.log("✅ Теперь при изменении параметров игроков будут использоваться ДАННЫЕ ИЗ БД");

        console.log("\n🔄 ПРИНУДИТЕЛЬНО перезагружаю диапазоны для ВСЕХ игроков через редьюсеры...");
        console.log("   Это гарантирует использование данных из БД, а не дефолтных JSON файлов!");

        // КРИТИЧЕСКИ ВАЖНО: Принудительно обновляем диапазоны для ВСЕХ игроков
        // Вызываем редьюсер для каждого игрока, чтобы диапазоны загрузились из БД
        let reloadedCount = 0;
        users.forEach((user, index) => {
          if (index === heroIndex) {
            console.log(`  [Игрок ${index}] HERO - пропускаю`);
            return;
          }

          console.log(`\n  [Игрок ${index}] ${user.name}:`);
          console.log(`    - Триггерю перезагрузку через setSixMaxPlayerStackSize...`);

          // Вызываем редьюсер для обновления стека, это автоматически перезагрузит диапазон
          // Редьюсер использует state.sixMaxActiveRangeSetData (который мы только что установили)
          dispatch(setSixMaxPlayerStackSize({ index, stackSize: user.stackSize }));
          reloadedCount++;
          console.log(`    ✅ Диапазон перезагружен из БД!`);
        });

        console.log("\n📊 Итоговая статистика:");
        console.log(`  - Всего игроков (без Hero): ${users.length - 1}`);
        console.log(`  - Перезагружено диапазонов из БД: ${reloadedCount}`);
        console.log(`\n✅ Загрузка завершена! Набор "${activeRangeSetName}" АКТИВЕН И ИСПОЛЬЗУЕТСЯ!`);
        console.log("=== КОНЕЦ ЗАГРУЗКИ ДИАПАЗОНОВ ===\n");
      } catch (error) {
        console.error("❌ ОШИБКА при загрузке набора диапазонов:", error);
        console.log("=== КОНЕЦ ЗАГРУЗКИ ДИАПАЗОНОВ ===\n");
      }
    };

    loadAndApplyRanges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRangeSetId, stage, authToken]);

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

  const handleActiveRangeSetChange = (id: number | null, name: string | null) => {
    console.log("🔄 === СМЕНА НАБОРА ДИАПАЗОНОВ ===");
    console.log("📋 Предыдущий набор:", {
      id: activeRangeSetId,
      name: activeRangeSetName
    });
    console.log("📋 Новый набор:", {
      id,
      name
    });
    dispatch(setSixMaxActiveRangeSet({ id, name }));
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
          tableType="6-max"
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
          customRangeData={activeRangeSetData}
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
            stage={stage}
            category={category}
            startingStack={startingStack}
            bounty={bounty}
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
            customRangeData={activeRangeSetData}
          />
        </section>
        {/* Кнопки управления игрой */}
        <div className="max-w-6xl mx-auto mb-4 mt-20">
          <div className="grid grid-cols-2 gap-4">
            {/* Кнопка смены позиции */}
            <button
              onClick={handleRotateTable}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
            >
              <span className="text-xl">🔄</span>
              <span>Сменить позицию</span>
            </button>

            {/* Кнопка новой раздачи */}
            <button
              onClick={handleNewDeal}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
            >
              <span className="text-xl">🃏</span>
              <span>Новая раздача</span>
            </button>
          </div>
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
