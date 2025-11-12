"use client";

import { useMemo, useState, useEffect } from "react";
import { StackSize, TournamentStage, TournamentCategory } from "@/lib/redux/slices/tableSlice";
import { shouldUseTournamentRanges, getAvailableStartingStacks } from "@/lib/utils/tournamentRangeLoader";
import { UserRangeSet, TableType } from "@/lib/types/userRanges";

interface TournamentSettingsProps {
  tableType: TableType;
  averageStack: StackSize;
  onAverageStackChange: (stack: StackSize) => void;
  buyIn: number;
  onBuyInChange: (buyIn: number) => void;
  ante: number; // Общее анте на стол
  onAnteChange: (ante: number) => void;
  stage: TournamentStage; // Стадия турнира
  onStageChange: (stage: TournamentStage) => void;
  startingStack: number; // Начальный стек (100 или 200 BB)
  onStartingStackChange: (stack: number) => void;
  showAnte?: boolean; // Анте только для турниров
  playersCount: number; // Количество игроков для расчета анте на игрока
  bounty?: boolean; // Турнир с баунти
  onBountyChange?: (bounty: boolean) => void;
  activeRangeSetId: number | null; // ID активного набора диапазонов
  activeRangeSetName: string | null; // Название активного набора
  onActiveRangeSetChange: (id: number | null, name: string | null) => void; // Callback для изменения
}

const stackLabels: Record<StackSize, string> = {
  "very-small": "Очень короткий (<10 BB)",
  small: "Короткий (10-20 BB)",
  medium: "Средний (20-40 BB)",
  big: "Большой (>40 BB)",
};

const stageLabels: Record<TournamentStage, string> = {
  early: "Ранняя",
  middle: "Средняя",
  "pre-bubble": "Pre-Bubble + Bubble",
  late: "Поздняя (ITM)",
  "pre-final": "Предфинал",
  final: "Финал",
};

const categoryLabels: Record<TournamentCategory, string> = {
  micro: "Микро ($0.01 – $5)",
  low: "Низкие (Low) ($5 – $22)",
  mid: "Средние (Mid) ($22 – $109)",
  high: "Высокие (High) ($109+)",
};

// Средние значения buy-in для каждой категории
const categoryBuyIns: Record<TournamentCategory, number> = {
  micro: 2.5,
  low: 11,
  mid: 55,
  high: 215,
};

// Определяем категорию турнира по buy-in
const getBuyInCategory = (buyIn: number): TournamentCategory => {
  if (buyIn < 5) return "micro";
  if (buyIn < 22) return "low";
  if (buyIn < 109) return "mid";
  return "high";
};

// Рассчитываем средний стек в зависимости от стадии турнира
const getAverageStackByStage = (
  stage: TournamentStage,
  startingStack: number,
  averageStack: StackSize
): number => {
  // Процент от начального стека для каждой стадии
  const stagePercentages: Record<TournamentStage, number> = {
    early: 0.8, // 80% от начального стека (160 BB для 200 BB)
    middle: 0.55, // 55% от начального стека (110 BB для 200 BB)
    "pre-bubble": 0.225, // 22.5% от начального стека (45 BB для 200 BB)
    late: 0.14, // 14% от начального стека (28 BB для 200 BB)
    "pre-final": 0.1, // 10% от начального стека (20 BB для 200 BB)
    final: 0, // Для финала используется пользовательское значение
  };

  // Только для финала используем значение из averageStack
  if (stage === "final") {
    // Преобразуем StackSize в числовое значение
    const stackValues: Record<StackSize, number> = {
      "very-small": 8, // <10 BB
      small: 15, // 10-20 BB
      medium: 30, // 20-40 BB
      big: 50, // >40 BB
    };
    return stackValues[averageStack];
  }

  // Для всех остальных стадий (включая pre-final) рассчитываем автоматически
  return Math.round(startingStack * stagePercentages[stage]);
};

export default function TournamentSettings({
  tableType,
  averageStack,
  onAverageStackChange,
  buyIn,
  onBuyInChange,
  ante,
  onAnteChange,
  stage,
  onStageChange,
  startingStack,
  onStartingStackChange,
  showAnte = true,
  playersCount,
  bounty = false,
  onBountyChange,
  activeRangeSetId,
  activeRangeSetName,
  onActiveRangeSetChange,
}: TournamentSettingsProps) {
  const [availableRangeSets, setAvailableRangeSets] = useState<UserRangeSet[]>([]);
  const [loadingRangeSets, setLoadingRangeSets] = useState(false);

  // Вычисляем анте на игрока
  const antePerPlayer = ante / playersCount;

  // Загружаем доступные наборы диапазонов при изменении настроек
  useEffect(() => {
    const loadRangeSets = async () => {
      setLoadingRangeSets(true);
      try {
        const category = getBuyInCategory(buyIn);
        const params = new URLSearchParams({
          tableType,
          category,
          startingStack: startingStack.toString(),
          bounty: bounty.toString(),
        });

        const response = await fetch(`/api/user-ranges/get?${params}`);
        const data = await response.json();

        if (data.success && data.data) {
          setAvailableRangeSets(data.data);
        } else {
          setAvailableRangeSets([]);
        }
      } catch (err) {
        console.error("Error loading range sets:", err);
        setAvailableRangeSets([]);
      } finally {
        setLoadingRangeSets(false);
      }
    };

    loadRangeSets();
  }, [tableType, buyIn, startingStack, bounty]);

  // Показываем средний стек только для финала
  const showAverageStack = stage === "final";

  // Вычисляем средний стек по текущей стадии
  const calculatedAverageStack = getAverageStackByStage(
    stage,
    startingStack,
    averageStack
  );

  // Получаем доступные значения начального стека для текущей категории
  const availableStacks = useMemo(() => {
    return getAvailableStartingStacks(getBuyInCategory(buyIn), bounty);
  }, [buyIn, bounty]);

  // Проверяем, доступны ли диапазоны для текущих настроек
  // Используем useMemo для избежания каскадных рендеров
  const rangesAvailable = useMemo(() => {
    return shouldUseTournamentRanges(
      startingStack,
      stage,
      getBuyInCategory(buyIn),
      bounty
    );
  }, [startingStack, stage, buyIn, bounty]);

  return (
    <section className="max-w-4xl mx-auto mb-8">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-100 mb-4">
          Настройки турнира
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Начальный стек */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Начальный стек
            </label>
            <div className="flex gap-2">
              {availableStacks.length > 0 ? (
                <>
                  {availableStacks.includes(100) && (
                    <button
                      onClick={() => onStartingStackChange(100)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        startingStack === 100
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      }`}
                    >
                      100 BB
                    </button>
                  )}
                  {availableStacks.includes(200) && (
                    <button
                      onClick={() => onStartingStackChange(200)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        startingStack === 200
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      }`}
                    >
                      200 BB
                    </button>
                  )}
                </>
              ) : (
                <div className="text-sm text-gray-500 italic">
                  Нет доступных диапазонов для данной категории
                </div>
              )}
            </div>
          </div>

          {/* Стадия турнира */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Стадия турнира
            </label>
            <select
              value={stage}
              onChange={(e) => onStageChange(e.target.value as TournamentStage)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="early">{stageLabels.early}</option>
              <option value="middle">{stageLabels.middle}</option>
              <option value="pre-bubble">{stageLabels["pre-bubble"]}</option>
              <option value="late">{stageLabels.late}</option>
              <option value="pre-final">{stageLabels["pre-final"]}</option>
              <option value="final">{stageLabels.final}</option>
            </select>
          </div>

          {/* Категория турнира */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Категория турнира
            </label>
            <select
              value={getBuyInCategory(buyIn)}
              onChange={(e) => {
                const category = e.target.value as TournamentCategory;
                onBuyInChange(categoryBuyIns[category]);
              }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="micro">{categoryLabels.micro}</option>
              <option value="low">{categoryLabels.low}</option>
              <option value="mid">{categoryLabels.mid}</option>
              <option value="high">{categoryLabels.high}</option>
            </select>
          </div>

          {/* Bounty турнир */}
          {onBountyChange && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Формат турнира
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => onBountyChange(false)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    !bounty
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  Обычный
                </button>
                <button
                  onClick={() => onBountyChange(true)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    bounty
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  Bounty
                </button>
              </div>
            </div>
          )}

          {/* Загрузка диапазонов */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Загрузка диапазонов
            </label>
            <select
              value={activeRangeSetId?.toString() || "default"}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "default") {
                  onActiveRangeSetChange(null, null);
                } else {
                  const setId = parseInt(value);
                  const set = availableRangeSets.find((s) => s.id === setId);
                  onActiveRangeSetChange(setId, set?.name || null);
                }
              }}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={loadingRangeSets}
            >
              <option value="default">Дефолтовый</option>
              {availableRangeSets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.name}
                </option>
              ))}
            </select>
            {loadingRangeSets && (
              <p className="text-xs text-gray-500 mt-1">Загрузка...</p>
            )}
            {!loadingRangeSets && availableRangeSets.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Нет сохраненных диапазонов
              </p>
            )}
          </div>

          {/* Анте (только для турниров) */}
          {showAnte && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Анте общее (BB)
              </label>
              <input
                type="number"
                value={ante === 0 ? "" : ante}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    onAnteChange(0);
                  } else {
                    const num = Number(value);
                    if (!isNaN(num) && num >= 0) {
                      onAnteChange(num);
                    }
                  }
                }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="1.6"
              />
              <p className="text-xs text-gray-500 mt-1">
                На игрока: {antePerPlayer.toFixed(2)} BB
              </p>
            </div>
          )}
        </div>

        {/* Средний стек (только для финала) */}
        {showAverageStack && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Средний стек игроков за финальным столом
            </label>
            <select
              value={averageStack}
              onChange={(e) => onAverageStackChange(e.target.value as StackSize)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="very-small">{stackLabels["very-small"]}</option>
              <option value="small">{stackLabels.small}</option>
              <option value="medium">{stackLabels.medium}</option>
              <option value="big">{stackLabels.big}</option>
            </select>
          </div>
        )}

        {/* Статус диапазонов */}
        {!rangesAvailable && (
          <div className="mt-6 bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm font-medium text-yellow-300">
                Диапазоны недоступны для текущих настроек
              </p>
            </div>
            <p className="text-xs text-yellow-400 mt-1 ml-7">
              Для загрузки диапазонов установите: 200BB начальный стек, Ранняя стадия, Микро категория, Bounty = Да
            </p>
          </div>
        )}

        {rangesAvailable && (
          <div className="mt-6 bg-emerald-900/20 border border-emerald-600/50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-emerald-300">
                Диапазоны доступны и загружены
              </p>
            </div>
          </div>
        )}

        {/* Информация */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Средний стек</p>
            <p className="text-lg font-semibold text-emerald-400">
              {calculatedAverageStack} BB
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Категория</p>
            <p className="text-lg font-semibold text-gray-100">
              {categoryLabels[getBuyInCategory(buyIn)].split(" ")[0]}
            </p>
          </div>
          {showAnte && (
            <div
              className="bg-gray-800/50 rounded-lg p-3 cursor-help"
              title={`Анте на игрока: ${antePerPlayer.toFixed(2)} BB`}
            >
              <p className="text-xs text-gray-500 mb-1">Анте общее</p>
              <p className="text-lg font-semibold text-yellow-400">
                {ante.toFixed(1)} BB
              </p>
            </div>
          )}
          {!showAnte && (
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Формат</p>
              <p className="text-lg font-semibold text-gray-100">Cash</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
