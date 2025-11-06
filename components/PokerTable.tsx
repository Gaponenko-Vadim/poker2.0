import { User, PlayerStrength, PlayerPlayStyle, Card, PlayerAction, StackSize } from "@/lib/redux/slices/tableSlice";
import PlayerSeat from "./PlayerSeat";
import PotDisplay from "./PotDisplay";
import { useMemo } from "react";
import { calculateGameEquity, findBBPlayer } from "@/lib/utils/equityCalculator";

interface PokerTableProps {
  users: User[]; // Массив игроков
  tableType: "6-max" | "8-max" | "cash";
  heroIndex: number; // Индекс Hero в массиве users
  basePot?: number; // Базовый банк (блайнды + анте), по умолчанию 0
  autoAllIn?: boolean; // Глобальная настройка: всегда ставить весь стек для всех игроков
  onToggleAutoAllIn?: (value: boolean) => void; // Функция для включения глобальной настройки autoAllIn
  onRotateTable?: () => void; // Вращение стола (изменение heroIndex)
  onTogglePlayerStrength: (
    index: number,
    currentStrength: PlayerStrength
  ) => void; // Переключение силы игрока
  onTogglePlayerPlayStyle: (
    index: number,
    currentPlayStyle: PlayerPlayStyle
  ) => void; // Переключение стиля игры
  onTogglePlayerStackSize: (
    index: number,
    currentStackSize: StackSize
  ) => void; // Переключение размера стека игрока
  onCardsChange: (index: number, cards: [Card | null, Card | null]) => void; // Изменение карт игрока
  onRangeChange: (index: number, range: string[]) => void; // Изменение диапазона игрока
  onActionChange: (index: number, action: PlayerAction | null) => void; // Изменение действия игрока
  onBetChange: (index: number, bet: number) => void; // Изменение ставки игрока
  openRaiseSize?: number; // Размер open raise в BB
  threeBetMultiplier?: number; // Множитель для 3-bet
  fourBetMultiplier?: number; // Множитель для 4-bet
  fiveBetMultiplier?: number; // Множитель для 5-bet
  enabledPlayStyles?: { tight: boolean; balanced: boolean; aggressor: boolean }; // Включенные стили игры
  enabledStrengths?: { fish: boolean; amateur: boolean; regular: boolean }; // Включенные силы игроков
}

export default function PokerTable({
  users,
  tableType,
  heroIndex,
  basePot = 0,
  autoAllIn = false,
  onToggleAutoAllIn,
  onRotateTable,
  onTogglePlayerStrength,
  onTogglePlayerPlayStyle,
  onTogglePlayerStackSize,
  onCardsChange,
  onRangeChange,
  onActionChange,
  onBetChange,
  openRaiseSize,
  threeBetMultiplier,
  fourBetMultiplier,
  fiveBetMultiplier,
  enabledPlayStyles = { tight: false, balanced: true, aggressor: false },
  enabledStrengths = { fish: false, amateur: true, regular: false },
}: PokerTableProps) {
  const tableColors = {
    "6-max": {
      felt: "from-emerald-700 via-emerald-600 to-emerald-700",
      rail: "from-gray-800 via-gray-900 to-gray-800",
      positionColor: "text-blue-400",
      borderColor: "border-blue-400",
    },
    "8-max": {
      felt: "from-green-700 via-green-600 to-green-700",
      rail: "from-gray-800 via-gray-900 to-gray-800",
      positionColor: "text-emerald-400",
      borderColor: "border-emerald-400",
    },
    cash: {
      felt: "from-teal-700 via-teal-600 to-teal-700",
      rail: "from-gray-800 via-gray-900 to-gray-800",
      positionColor: "text-purple-400",
      borderColor: "border-purple-400",
    },
  };

  const colors = tableColors[tableType];

  // Вычисляем общий банк (базовый банк + все ставки игроков)
  const totalPot = useMemo(() => {
    const playersBets = users.reduce((sum, user) => sum + user.bet, 0);
    return basePot + playersBets;
  }, [basePot, users]);

  // Получаем карты Hero для проверки
  const hero = users[heroIndex];
  const heroCards = hero?.cards || [null, null];
  const hasFirstCard = heroCards[0] !== null;
  const hasSecondCard = heroCards[1] !== null;
  const hasBothCards = hasFirstCard && hasSecondCard;

  // Вычисляем эквити когда выбраны обе карты
  const equity = useMemo(() => {
    if (!hasBothCards) return null;
    return calculateGameEquity(users, heroIndex);
  }, [hasBothCards, users, heroIndex]);

  // Находим игрока BB для отображения
  const bbPlayer = useMemo(() => findBBPlayer(users), [users]);

  // Игроки теперь фиксированы на своих визуальных позициях

  // Координаты для позиций на столе
  const getPositionCoordinates = (index: number) => {
    if (tableType === "6-max") {
      const coords = [
        { left: "50%", top: "112%", transform: "translate(-50%, -50%)" }, // Hero (низ)
        { left: "0%", top: "100%", transform: "translate(-50%, -50%)" }, // 1 (левый низ)
        { left: "0%", top: "8%", transform: "translate(-50%, -50%)" }, // 2 (левый верх)
        { left: "50%", top: "-4%", transform: "translate(-50%, -50%)" }, // 3 (верх)
        { left: "101%", top: "10%", transform: "translate(-50%, -50%)" }, // 4 (правый верх)
        { left: "100%", top: "100%", transform: "translate(-50%, -50%)" }, // 5 (правый низ)
      ];
      return coords[index];
    } else {
      const coords = [
        { left: "50%", top: "112%", transform: "translate(-50%, -50%)" }, // Hero (низ)
        { left: "10%", top: "112%", transform: "translate(-50%, -50%)" }, // 1 (левый низ)
        { left: "-3%", top: "50%", transform: "translate(-50%, -50%)" }, // 2 (левый)
        { left: "9%", top: "-3%", transform: "translate(-50%, -50%)" }, // 3 (левый верх)
        { left: "50%", top: "-4%", transform: "translate(-50%, -50%)" }, // 4 (верх)
        { left: "93%", top: "-2%", transform: "translate(-50%, -50%)" }, // 5 (правый верх)
        { left: "104%", top: "50%", transform: "translate(-50%, -50%)" }, // 6 (правый)
        { left: "93%", top: "110%", transform: "translate(-50%, -50%)" }, // 7 (правый низ)
        { left: "90%", top: "112%", transform: "translate(-50%, -50%)" }, // 8 (правый низ 2)
      ];
      return coords[index];
    }
  };

  // Обработчик клика на Hero - вращение стола
  const handleHeroClick = () => {
    if (onRotateTable) {
      onRotateTable();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-8">
      <div className="relative w-full h-[500px]">
        {/* Деревянный фон */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-950 to-stone-950 rounded-3xl"></div>

        {/* Тень под столом */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[92%] h-[85%] rounded-[120px] bg-black/40 blur-2xl"></div>
        </div>

        {/* Покерный стол */}
        <div className="absolute inset-0 flex items-center justify-center p-6">
          {/* Чёрный бортик */}
          <div
            className={`relative w-full h-full rounded-[120px] bg-gradient-to-br ${colors.rail} shadow-2xl`}
            style={{
              boxShadow:
                "0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 2px 4px 0 rgba(255, 255, 255, 0.1)",
            }}
          >
            <div className="absolute inset-0 rounded-[120px] shadow-inner opacity-60"></div>

            {/* Зелёный фетр */}
            <div className="absolute inset-0 p-6 flex items-center justify-center">
              <div
                className={`relative w-full h-full rounded-[100px] bg-gradient-to-br ${colors.felt} shadow-inner`}
                style={{
                  boxShadow: "inset 0 4px 20px rgba(0, 0, 0, 0.4)",
                }}
              >
                {/* Текстура фетра */}
                <div
                  className="absolute inset-0 rounded-[100px] opacity-10"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 50%, transparent 0%, rgba(0,0,0,0.1) 100%)",
                  }}
                ></div>

                {/* Центральный текст */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {!hasFirstCard && !hasSecondCard ? (
                    <div className="text-center">
                      <p className="text-white/20 text-4xl font-bold tracking-widest mb-2">
                        POKER
                      </p>
                      <p
                        className={`${colors.positionColor} opacity-30 text-sm font-semibold tracking-wider`}
                      >
                        {tableType === "6-max"
                          ? "6-MAX"
                          : tableType === "8-max"
                          ? "8-MAX"
                          : "CASH GAME"}
                      </p>
                    </div>
                  ) : null}

                  {/* Подсказка при выборе одной карты */}
                  {hasFirstCard && !hasSecondCard && (
                    <div
                      className="absolute inset-0 flex items-center justify-center animate-fade-in"
                      style={{
                        animation: "fadeInScale 0.4s ease-out",
                      }}
                    >
                      <div className="bg-gray-900/95 backdrop-blur-sm border-2 border-yellow-400 rounded-2xl px-8 py-6 shadow-2xl max-w-md">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="bg-yellow-400 rounded-full p-2">
                            <svg
                              className="w-5 h-5 text-gray-900"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-yellow-400 font-bold text-lg">
                            Внимание
                          </h3>
                        </div>
                        <p className="text-gray-200 text-center leading-relaxed">
                          Надо выбрать вторую карту для отображения эквити
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Подсказка при выборе обеих карт */}
                  {hasBothCards && (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        animation: "fadeInScale 0.5s ease-out",
                      }}
                    >
                      <div className="bg-gradient-to-br from-emerald-900/95 to-emerald-800/95 backdrop-blur-sm border-2 border-emerald-400 rounded-2xl px-10 py-8 shadow-2xl max-w-md">
                        <div className="flex flex-col items-center gap-4">
                          {/* Иконка и заголовок */}
                          <div className="flex items-center gap-3">
                            <div className="bg-emerald-400 rounded-full p-2 animate-pulse">
                              <svg
                                className="w-6 h-6 text-gray-900"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                              </svg>
                            </div>
                            <h3 className="text-emerald-300 font-bold text-2xl">
                              Эквити
                            </h3>
                          </div>

                          {/* Эквити */}
                          {equity !== null ? (
                            <div className="text-center">
                              <div className="text-5xl font-bold text-white mb-2">
                                {equity.toFixed(2)}%
                              </div>
                              <div className="text-emerald-200 text-sm opacity-80">
                                против {bbPlayer?.name || "BB"} (
                                {bbPlayer?.position})
                              </div>
                              {bbPlayer?.range && bbPlayer.range.length > 0 && (
                                <div className="text-emerald-300/70 text-xs mt-1">
                                  Диапазон: {bbPlayer.range.slice(0, 5).join(", ")}
                                  {bbPlayer.range.length > 5 && "..."}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="text-yellow-300 text-sm">
                                Нет данных для расчета эквити
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Игроки */}
                {users.map((user, index) => {
                  const coords = getPositionCoordinates(index);

                  // Пропускаем если нет координат (для cash > 8 игроков)
                  if (!coords) return null;

                  const isHero = index === heroIndex;

                  // Получаем массив всех действий игроков
                  const allPlayersActions = users.map((u) => u.action);
                  // Получаем массив всех ставок игроков
                  const allPlayersBets = users.map((u) => u.bet);

                  return (
                    <PlayerSeat
                      key={index}
                      user={user}
                      position={coords}
                      isHero={isHero}
                      onHeroClick={handleHeroClick}
                      autoAllIn={autoAllIn}
                      onToggleAutoAllIn={onToggleAutoAllIn}
                      onToggleStrength={() =>
                        onTogglePlayerStrength(index, user.strength)
                      }
                      onTogglePlayStyle={() =>
                        onTogglePlayerPlayStyle(index, user.playStyle)
                      }
                      onToggleStackSize={() =>
                        onTogglePlayerStackSize(index, user.stackSize)
                      }
                      onCardsChange={
                        isHero
                          ? (cards) => onCardsChange(index, cards)
                          : undefined
                      }
                      onRangeChange={
                        !isHero
                          ? (range) => onRangeChange(index, range)
                          : undefined
                      }
                      onActionChange={(action) => onActionChange(index, action)}
                      onBetChange={(bet) => onBetChange(index, bet)}
                      allPlayersActions={allPlayersActions}
                      allPlayersBets={allPlayersBets}
                      openRaiseSize={openRaiseSize}
                      threeBetMultiplier={threeBetMultiplier}
                      fourBetMultiplier={fourBetMultiplier}
                      fiveBetMultiplier={fiveBetMultiplier}
                      enabledPlayStyles={enabledPlayStyles}
                      enabledStrengths={enabledStrengths}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Отображение банка */}
        <PotDisplay pot={totalPot} />
      </div>
    </div>
  );
}
