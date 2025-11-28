import { User, PlayerStrength, PlayerPlayStyle, Card, PlayerAction, StackSize, TournamentStage, TournamentCategory, CardRank, CardSuit } from "@/lib/redux/slices/tableSlice";
import PlayerSeat from "./PlayerSeat";
import PotDisplay from "./PotDisplay";
import CardPickerPopup from "./CardPickerPopup";
import { useMemo, useState, useEffect, useRef } from "react";
import { calculateGameEquity, findBBPlayer } from "@/lib/utils/equityCalculator";
import { TournamentActionType } from "@/lib/utils/tournamentRangeLoader";
import { parseCard, createCard } from "@/lib/utils/cardUtils";

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
  stage: TournamentStage; // Стадия турнира для загрузки диапазонов
  category: TournamentCategory; // Категория турнира
  startingStack: number; // Начальный стек турнира в BB
  bounty: boolean; // Наличие баунти
  customRangeData?: any; // Данные диапазонов из БД (если есть)
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
  stage,
  category,
  startingStack,
  bounty,
  customRangeData,
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

  // Локальный state для временных диапазонов (работают только в текущей раздаче)
  // Ключ формата: "playerIndex-action" (например, "3-open_raise")
  const [temporaryRanges, setTemporaryRanges] = useState<Map<string, string[]>>(new Map());

  // State для карт борда (флоп, тёрн, ривер)
  const [boardCards, setBoardCards] = useState<(Card | null)[]>([null, null, null, null, null]);
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  const [selectingBoardCardIndex, setSelectingBoardCardIndex] = useState<number | null>(null);

  // State для сворачивания/разворачивания подсказки эквити
  const [isEquityCollapsed, setIsEquityCollapsed] = useState(false);

  // State для позиции свернутой подсказки эквити
  const [equityPosition, setEquityPosition] = useState({ x: 0, y: 0 });
  const [isDraggingEquity, setIsDraggingEquity] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

  // Отслеживаем позиции игроков для очистки временных диапазонов при ротации
  const prevPositionsRef = useRef<string>("");

  // Очищаем временные диапазоны при изменении позиций игроков (ротация стола)
  useEffect(() => {
    const currentPositions = users.map(u => u.position).join(",");

    // Если позиции изменились и это не первый рендер
    if (prevPositionsRef.current !== "" && prevPositionsRef.current !== currentPositions) {
      setTemporaryRanges(new Map()); // Очищаем все временные диапазоны при ротации стола
      console.log("Временные диапазоны очищены из-за ротации стола");
    }

    prevPositionsRef.current = currentPositions;
  }, [users]);

  // Сбрасываем карты борда при новой раздаче (когда карты Hero очищаются)
  useEffect(() => {
    const hero = users[heroIndex];
    const heroCards = hero?.cards || [null, null];

    // Если обе карты Hero null - это новая раздача, сбрасываем борд
    if (heroCards[0] === null && heroCards[1] === null) {
      setBoardCards([null, null, null, null, null]);
      setIsEquityCollapsed(false);
      setEquityPosition({ x: 0, y: 0 });
    }
  }, [users, heroIndex]);

  // Функция для обновления временного диапазона
  const handleTemporaryRangeChange = (
    playerIndex: number,
    action: TournamentActionType,
    range: string[]
  ) => {
    const key = `${playerIndex}-${action}`;
    setTemporaryRanges((prev) => {
      const newMap = new Map(prev);
      newMap.set(key, range);
      return newMap;
    });
  };

  // Функция для получения эффективного диапазона (временный или из Redux)
  const getEffectiveRange = (
    playerIndex: number,
    action: TournamentActionType | null
  ): string[] => {
    if (action === null) {
      // Для null action всегда возвращаем диапазон из Redux
      return users[playerIndex].range;
    }

    const key = `${playerIndex}-${action}`;
    const tempRange = temporaryRanges.get(key);

    // Если есть временный диапазон, используем его, иначе берем из Redux
    return tempRange !== undefined ? tempRange : users[playerIndex].range;
  };

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

  // Создаем копию users с учетом временных диапазонов для расчета эквити
  const usersWithTemporaryRanges = useMemo(() => {
    return users.map((user, index) => {
      // Конвертируем PlayerAction в TournamentActionType
      const actionMapping: Record<PlayerAction, TournamentActionType> = {
        "fold": "defense_vs_open",
        "call": "defense_vs_open",
        "check": "defense_vs_open",
        "bet-open": "open_raise",
        "raise-3bet": "3bet",
        "raise-4bet": "4bet",
        "raise-5bet": "5bet",
        "all-in": "push_range",
      };

      const tournamentAction = user.action ? actionMapping[user.action] : null;
      const effectiveRange = getEffectiveRange(index, tournamentAction);

      return {
        ...user,
        range: effectiveRange,
      };
    });
  }, [users, temporaryRanges]);

  // Вычисляем эквити когда выбраны обе карты, используя users с временными диапазонами
  const equity = useMemo(() => {
    if (!hasBothCards) return null;
    return calculateGameEquity(usersWithTemporaryRanges, heroIndex);
  }, [hasBothCards, usersWithTemporaryRanges, heroIndex]);

  // Находим игрока BB для отображения (с временным диапазоном)
  const bbPlayer = useMemo(() => findBBPlayer(usersWithTemporaryRanges), [usersWithTemporaryRanges]);

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

  // Обработчики перетаскивания свернутой подсказки эквити
  const handleEquityMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingEquity(true);
    setDragStartPos({
      x: e.clientX - equityPosition.x,
      y: e.clientY - equityPosition.y,
    });
  };

  const handleEquityMouseMove = (e: React.MouseEvent) => {
    if (isDraggingEquity) {
      setEquityPosition({
        x: e.clientX - dragStartPos.x,
        y: e.clientY - dragStartPos.y,
      });
    }
  };

  const handleEquityMouseUp = () => {
    setIsDraggingEquity(false);
  };

  const handleEquityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDraggingEquity) {
      setIsEquityCollapsed(false);
    }
  };

  // Обработчики для выбора карт борда
  const handleBoardCardClick = (index: number) => {
    setSelectingBoardCardIndex(index);
    setShowBoardSelector(true);
  };

  const handleSelectBoardCard = (rank: CardRank, suit: CardSuit) => {
    if (selectingBoardCardIndex !== null) {
      const newBoardCards = [...boardCards];
      newBoardCards[selectingBoardCardIndex] = createCard(rank, suit);
      setBoardCards(newBoardCards);

      // Автоматически переходим к следующей пустой карте
      const nextEmptyIndex = newBoardCards.findIndex((c, i) => i > selectingBoardCardIndex && c === null);
      if (nextEmptyIndex !== -1 && nextEmptyIndex < 5) {
        setSelectingBoardCardIndex(nextEmptyIndex);
      } else {
        setSelectingBoardCardIndex(null);
        setShowBoardSelector(false);
      }
    }
  };

  const handleClearBoardCard = () => {
    if (selectingBoardCardIndex !== null) {
      const newBoardCards = [...boardCards];
      newBoardCards[selectingBoardCardIndex] = null;
      // Очищаем все карты после текущей
      for (let i = selectingBoardCardIndex + 1; i < 5; i++) {
        newBoardCards[i] = null;
      }
      setBoardCards(newBoardCards);
    }
  };

  const handleCloseBoardSelector = () => {
    setShowBoardSelector(false);
    setSelectingBoardCardIndex(null);
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
                      className={`absolute inset-0 z-20 ${isDraggingEquity ? 'pointer-events-auto' : 'pointer-events-none'}`}
                      onMouseMove={handleEquityMouseMove}
                      onMouseUp={handleEquityMouseUp}
                      onMouseLeave={handleEquityMouseUp}
                    >
                      {isEquityCollapsed ? (
                        // Свернутый вид - можно перетаскивать
                        <div
                          className="absolute bg-gradient-to-br from-emerald-900/95 to-emerald-800/95 backdrop-blur-sm border-2 border-emerald-400 rounded-xl px-6 py-3 shadow-2xl cursor-move hover:scale-105 transition-transform select-none pointer-events-auto"
                          style={{
                            left: '50%',
                            top: '50%',
                            transform: `translate(calc(-50% + ${equityPosition.x}px), calc(-50% + ${equityPosition.y}px))`,
                            animation: "fadeInScale 0.5s ease-out",
                          }}
                          onMouseDown={handleEquityMouseDown}
                          onClick={handleEquityClick}
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-emerald-400 rounded-full p-1.5">
                              <svg
                                className="w-4 h-4 text-gray-900"
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
                            {equity !== null ? (
                              <span className="text-white font-bold text-xl">
                                {equity.toFixed(2)}%
                              </span>
                            ) : (
                              <span className="text-yellow-300 text-sm">N/A</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        // Развернутый вид - всегда по центру
                        <div
                          className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                          style={{
                            animation: "fadeInScale 0.5s ease-out",
                          }}
                        >
                          <div className="bg-gradient-to-br from-emerald-900/95 to-emerald-800/95 backdrop-blur-sm border-2 border-emerald-400 rounded-2xl px-10 py-8 shadow-2xl max-w-md relative">
                            {/* Кнопка сворачивания */}
                            <button
                              onClick={() => setIsEquityCollapsed(true)}
                              className="absolute top-3 right-3 text-emerald-300 hover:text-white transition-colors"
                              title="Свернуть"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

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
                  )}
                </div>

                {/* Карты борда (флоп, тёрн, ривер) - отдельный элемент */}
                {(hasFirstCard || hasSecondCard) && (() => {
                  const selectedCount = boardCards.filter(c => c !== null).length;
                  const stageName = selectedCount === 0 ? "" : selectedCount <= 3 ? "Флоп" : selectedCount === 4 ? "Тёрн" : "Ривер";

                  const suits: { suit: string; symbol: string; color: string }[] = [
                    { suit: "hearts", symbol: "♥", color: "text-red-600" },
                    { suit: "diamonds", symbol: "♦", color: "text-red-600" },
                    { suit: "clubs", symbol: "♣", color: "text-gray-800" },
                    { suit: "spades", symbol: "♠", color: "text-gray-800" },
                  ];

                  const renderBoardCard = (card: Card | null, index: number) => {
                    if (!card) {
                      return (
                        <div
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBoardCardClick(index);
                          }}
                          className="w-12 h-16 bg-gradient-to-br from-blue-800 to-blue-900 border-2 border-blue-400/30 rounded shadow-lg flex items-center justify-center hover:border-blue-400/60 transition-colors cursor-pointer"
                          style={{
                            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)'
                          }}
                        >
                          <div className="text-blue-300/40 text-xs font-bold">?</div>
                        </div>
                      );
                    }

                    const parsedCard = parseCard(card);
                    const suitInfo = suits.find((s) => s.suit === parsedCard.suit);
                    return (
                      <div
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBoardCardClick(index);
                        }}
                        className="w-12 h-16 bg-white border-2 border-gray-300 rounded shadow-lg relative cursor-pointer hover:scale-105 hover:shadow-xl transition-all"
                      >
                        <div className="absolute top-0.5 left-0.5 flex flex-col items-start leading-none">
                          <span className={`text-sm font-bold ${suitInfo?.color}`}>
                            {parsedCard.rank}
                          </span>
                          <span className={`text-base leading-none ${suitInfo?.color}`}>
                            {suitInfo?.symbol}
                          </span>
                        </div>
                        <div className="absolute bottom-0.5 right-0.5 flex flex-col items-end rotate-180 leading-none">
                          <span className={`text-sm font-bold ${suitInfo?.color}`}>
                            {parsedCard.rank}
                          </span>
                          <span className={`text-base leading-none ${suitInfo?.color}`}>
                            {suitInfo?.symbol}
                          </span>
                        </div>
                      </div>
                    );
                  };

                  return (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                      <div className="flex flex-col items-center gap-2">
                        {stageName && (
                          <div className="px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold rounded-full shadow-lg">
                            {stageName}
                          </div>
                        )}
                        <div className="flex gap-2">
                          {boardCards.map((card, index) => renderBoardCard(card, index))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

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
                      tableType={tableType}
                      stage={stage}
                      category={category}
                      startingStack={startingStack}
                      bounty={bounty}
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
                      onRangeChange={(range) => onRangeChange(index, range)}
                      onTemporaryRangeChange={
                        !isHero
                          ? (action, range) => handleTemporaryRangeChange(index, action, range)
                          : undefined
                      }
                      temporaryRanges={temporaryRanges}
                      playerIndex={index}
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
                      customRangeData={customRangeData}
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

      {/* Модальное окно выбора карт борда */}
      {showBoardSelector && selectingBoardCardIndex !== null && (() => {
        // Создаём массив занятых карт (Hero + уже выбранные карты борда)
        const usedCardsList = [
          ...heroCards.filter((c): c is Card => c !== null),
          ...boardCards.filter((c): c is Card => c !== null),
        ];

        return (
          <CardPickerPopup
            isOpen={true}
            onClose={handleCloseBoardSelector}
            onSelectCard={handleSelectBoardCard}
            onClear={handleClearBoardCard}
            title={`Выбор карты борда ${selectingBoardCardIndex + 1}/5 - ${selectingBoardCardIndex < 3 ? "Флоп" : selectingBoardCardIndex === 3 ? "Тёрн" : "Ривер"}`}
            selectedCards={[null, null]}
            currentSelectingIndex={null}
            usedCards={usedCardsList}
            boardCards={boardCards}
            selectingBoardIndex={selectingBoardCardIndex}
            onBoardCardClick={handleBoardCardClick}
          />
        );
      })()}
    </div>
  );
}
