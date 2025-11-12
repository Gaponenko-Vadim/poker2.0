"use client";

import { createPortal } from "react-dom";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  TablePosition,
  PlayerStrength,
  PlayerPlayStyle,
  StackSize,
  PlayerAction,
  TournamentStage,
  TournamentCategory,
} from "@/lib/redux/slices/tableSlice";
import {
  getTournamentRangeFromJSON,
  getRangeFromData,
  TournamentActionType,
  generateFullRange,
} from "@/lib/utils/tournamentRangeLoader";
import SaveRangeDialog from "./SaveRangeDialog";
import { createFullJSONWithTemporaryRanges } from "@/lib/utils/rangeDataManager";
import { TableType } from "@/lib/types/userRanges";

interface RangeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  currentRange: string[];
  onRangeChange: (range: string[]) => void;
  onTemporaryRangeChange?: (
    action: TournamentActionType,
    range: string[]
  ) => void; // Функция для временного изменения
  temporaryRanges?: Map<string, string[]>; // Map с временными диапазонами
  playerIndex?: number; // Индекс игрока в массиве
  // Новые параметры для загрузки диапазонов
  tableType: TableType; // Тип стола (6-max, 8-max, cash)
  position: TablePosition;
  strength: PlayerStrength;
  playStyle: PlayerPlayStyle;
  stackSize: StackSize;
  currentAction: PlayerAction | null;
  stage: TournamentStage; // Добавляем стадию турнира
  category: TournamentCategory; // Категория турнира
  startingStack: number; // Начальный стек турнира в BB
  bounty: boolean; // Наличие баунти
  customRangeData?: any; // НОВОЕ: Данные диапазонов из БД (если есть)
}

// Маппинг действий игрока в действия из JSON (константа вне компонента)
const ACTION_TO_TOURNAMENT_ACTION: Record<PlayerAction, TournamentActionType> =
  {
    fold: "defense_vs_open",
    call: "defense_vs_open",
    check: "defense_vs_open",
    "bet-open": "open_raise",
    "raise-3bet": "3bet",
    "raise-4bet": "4bet",
    "raise-5bet": "5bet",
    "all-in": "push_range",
  };

export default function RangeSelector({
  isOpen,
  onClose,
  playerName,
  currentRange,
  onRangeChange,
  onTemporaryRangeChange,
  temporaryRanges,
  playerIndex,
  tableType,
  position,
  strength,
  playStyle,
  stackSize,
  currentAction,
  stage,
  category,
  startingStack,
  bounty,
  customRangeData,
}: RangeSelectorProps) {
  // Используем ref для отслеживания предыдущего значения isOpen
  const prevIsOpenRef = useRef<boolean>(isOpen);

  // Вспомогательная функция для загрузки диапазона (из БД или из дефолтных файлов)
  const loadRange = (action: TournamentActionType): string[] => {
    // Если есть данные из БД - используем их
    if (customRangeData) {
      console.log(
        `📥 [RangeSelector] Загружаю диапазон из БД для действия: ${action}`
      );
      const range = getRangeFromData(
        stage,
        position,
        strength,
        playStyle,
        stackSize,
        action,
        customRangeData
      );
      console.log(`   ✅ Загружено ${range.length} комбинаций из БД`);
      return range;
    }

    // Иначе загружаем из дефолтных JSON файлов
    console.log(
      `📂 [RangeSelector] Загружаю диапазон из дефолтных файлов для действия: ${action}`
    );
    const range = getTournamentRangeFromJSON(
      stage,
      position,
      strength,
      playStyle,
      stackSize,
      action,
      category,
      startingStack,
      bounty
    );
    console.log(
      `   ✅ Загружено ${range.length} комбинаций из дефолтных файлов`
    );
    return range;
  };

  // Состояние для выбранного действия - инициализируем через функцию
  const [selectedAction, setSelectedAction] =
    useState<TournamentActionType | null>(() => {
      if (!currentAction) return null;
      return ACTION_TO_TOURNAMENT_ACTION[currentAction];
    });

  // State для диалога сохранения
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  // Отслеживаем, были ли изменения
  const hasChangesRef = useRef(false);

  // Вычисляем текущее действие из JSON на основе PlayerAction
  const currentTournamentAction = useMemo(() => {
    if (!currentAction) return null;
    return ACTION_TO_TOURNAMENT_ACTION[currentAction];
  }, [currentAction]);

  // Все возможные действия для отображения в UI
  const allPossibleActions: Array<{
    key: TournamentActionType | null;
    label: string;
  }> = [
    { key: null, label: "Нет действия (полный диапазон)" },
    { key: "open_raise", label: "Опен-рейз" },
    { key: "push_range", label: "Пуш" },
    { key: "call_vs_shove", label: "Колл на пуш" },
    { key: "defense_vs_open", label: "Защита vs опен" },
    { key: "3bet", label: "3-бет" },
    { key: "defense_vs_3bet", label: "Защита vs 3-бет" },
    { key: "4bet", label: "4-бет" },
    { key: "defense_vs_4bet", label: "Защита vs 4-бет" },
    { key: "5bet", label: "5-бет" },
    { key: "defense_vs_5bet", label: "Защита vs 5-бет" },
  ];

  // Фильтруем действия, показываем только те, у которых есть непустые диапазоны
  const availableActions = useMemo(() => {
    return allPossibleActions.filter((action) => {
      // "Нет действия" всегда доступно (показывает полный диапазон)
      if (action.key === null) {
        return true;
      }

      // Проверяем, есть ли диапазон для данного действия (используем loadRange)
      const range = loadRange(action.key);

      // Показываем действие только если диапазон не пустой
      return range.length > 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    stage,
    position,
    strength,
    playStyle,
    stackSize,
    category,
    startingStack,
    bounty,
    customRangeData,
  ]);

  // Вычисляем отображаемый диапазон на основе выбранного действия
  const displayedRange = useMemo(() => {
    if (!isOpen) return currentRange;

    // Если действие null - показываем полный диапазон (все 169 комбинаций)
    if (selectedAction === null) {
      return generateFullRange();
    }

    // Проверяем, есть ли временный диапазон для выбранного действия
    if (temporaryRanges && playerIndex !== undefined) {
      const key = `${playerIndex}-${selectedAction}`;
      const tempRange = temporaryRanges.get(key);
      if (tempRange !== undefined) {
        return tempRange; // Используем временный диапазон
      }
    }

    // Если это текущее действие игрока, используем currentRange
    if (selectedAction === currentTournamentAction) {
      return currentRange;
    }

    // Загружаем диапазон (из БД или из дефолтных JSON файлов)
    const newRange = loadRange(selectedAction);
    return newRange;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedAction,
    stage,
    position,
    strength,
    playStyle,
    stackSize,
    category,
    startingStack,
    bounty,
    isOpen,
    currentRange,
    temporaryRanges,
    playerIndex,
    currentTournamentAction,
    customRangeData,
  ]);

  // Сбрасываем selectedAction только при переходе из закрытого состояния в открытое
  useEffect(() => {
    const wasOpen = prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;

    // Обновляем selectedAction только если попап только что открылся (переход false -> true)
    // Это безопасно, потому что:
    // 1. Обновление происходит только при изменении isOpen с false на true
    // 2. Не вызывает бесконечных циклов или каскадных рендеров
    // 3. Синхронизирует внутреннее состояние с внешним пропсом currentAction
    if (!wasOpen && isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedAction(currentTournamentAction);
    }
  }, [isOpen, currentAction, currentTournamentAction]);

  // Сбрасываем selectedAction если оно больше не доступно в списке
  useEffect(() => {
    if (!isOpen) return;

    // Проверяем, доступен ли текущий selectedAction
    const isCurrentActionAvailable = availableActions.some(
      (action) => action.key === selectedAction
    );

    // Если недоступен, сбрасываем на первый доступный вариант
    if (!isCurrentActionAvailable && availableActions.length > 0) {
      setSelectedAction(availableActions[0].key);
    }
  }, [availableActions, selectedAction, isOpen]);

  if (!isOpen) return null;

  // Ранги карт от старших к младшим
  const ranks = [
    "A",
    "K",
    "Q",
    "J",
    "T",
    "9",
    "8",
    "7",
    "6",
    "5",
    "4",
    "3",
    "2",
  ];

  // Генерация матрицы покерных рук
  const generateHandMatrix = (): string[][] => {
    const matrix: string[][] = [];
    for (let i = 0; i < ranks.length; i++) {
      const row: string[] = [];
      for (let j = 0; j < ranks.length; j++) {
        if (i === j) {
          // Карманные пары (диагональ)
          row.push(`${ranks[i]}${ranks[j]}`);
        } else if (i < j) {
          // Одномастные (выше диагонали)
          row.push(`${ranks[i]}${ranks[j]}s`);
        } else {
          // Разномастные (ниже диагонали)
          row.push(`${ranks[j]}${ranks[i]}o`);
        }
      }
      matrix.push(row);
    }
    return matrix;
  };

  const handMatrix = generateHandMatrix();

  // Проверка, выбрана ли рука в отображаемом диапазоне
  const isHandSelected = (hand: string): boolean => {
    return displayedRange.includes(hand);
  };

  // Переключение выбора руки (работает для всех действий кроме null)
  const toggleHand = (hand: string) => {
    // Нельзя редактировать "нет действия" (null)
    if (selectedAction === null) return;

    // Отмечаем, что были изменения
    hasChangesRef.current = true;

    // Если это текущее действие игрока, используем onRangeChange (сохранение в Redux)
    const isCurrentAction = selectedAction === currentTournamentAction;
    if (isCurrentAction) {
      if (currentRange.includes(hand)) {
        onRangeChange(currentRange.filter((h) => h !== hand));
      } else {
        onRangeChange([...currentRange, hand]);
      }
      return;
    }

    // Для всех остальных действий используем onTemporaryRangeChange (временное изменение)
    if (onTemporaryRangeChange && selectedAction) {
      if (displayedRange.includes(hand)) {
        onTemporaryRangeChange(
          selectedAction,
          displayedRange.filter((h) => h !== hand)
        );
      } else {
        onTemporaryRangeChange(selectedAction, [...displayedRange, hand]);
      }
    }
  };

  // Очистка диапазона (работает для всех действий кроме null)
  const clearRange = () => {
    // Нельзя редактировать "нет действия" (null)
    if (selectedAction === null) return;

    // Отмечаем, что были изменения
    hasChangesRef.current = true;

    // Если это текущее действие игрока, используем onRangeChange (сохранение в Redux)
    const isCurrentAction = selectedAction === currentTournamentAction;
    if (isCurrentAction) {
      onRangeChange([]);
      return;
    }

    // Для всех остальных действий используем onTemporaryRangeChange (временное изменение)
    if (onTemporaryRangeChange && selectedAction) {
      onTemporaryRangeChange(selectedAction, []);
    }
  };

  // Обработчик кнопки "Готово"
  const handleDone = () => {
    // Если были изменения, показываем диалог сохранения
    if (hasChangesRef.current && temporaryRanges && temporaryRanges.size > 0) {
      setIsSaveDialogOpen(true);
    } else {
      // Если изменений нет, просто закрываем
      handleCloseSaveDialog();
    }
  };

  // Обработчик сохранения через API
  const handleSaveRange = async (rangeSetId: number | null, name: string) => {
    if (!temporaryRanges || playerIndex === undefined) {
      console.warn("⚠️ temporaryRanges or playerIndex is undefined");
      return;
    }

    try {
      console.log("📝 Saving range set with params:", {
        playerIndex,
        position,
        strength,
        playStyle,
        stackSize,
        stage,
        category,
        startingStack,
        bounty,
        temporaryRangesSize: temporaryRanges.size,
      });

      // Логируем содержимое temporaryRanges
      console.log("📦 Temporary ranges content:");
      temporaryRanges.forEach((range, key) => {
        console.log(`  ${key}: ${range.length} hands`, range.slice(0, 5));
      });

      // Создаем полный JSON с учетом временных изменений
      const fullJSON = createFullJSONWithTemporaryRanges(
        temporaryRanges,
        playerIndex,
        position,
        strength,
        playStyle,
        stackSize,
        stage,
        category,
        startingStack,
        bounty
      );

      console.log(
        "📄 Full JSON created:",
        JSON.stringify(fullJSON).substring(0, 500) + "..."
      );

      if (rangeSetId) {
        // Обновляем существующий набор
        const response = await fetch("/api/user-ranges/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: rangeSetId,
            rangeData: fullJSON,
          }),
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to update range set");
        }
      } else {
        // Создаем новый набор
        const response = await fetch("/api/user-ranges/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            tableType,
            category,
            startingStack,
            bounty,
            rangeData: fullJSON,
          }),
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to create range set");
        }
      }

      // Успешно сохранено - закрываем все диалоги
      handleCloseSaveDialog();
    } catch (error) {
      console.error("❌ Error saving range set:", error);
      throw error; // Пробрасываем ошибку для отображения в диалоге
    }
  };

  // Закрытие диалога сохранения и основного окна
  const handleCloseSaveDialog = () => {
    setIsSaveDialogOpen(false);
    hasChangesRef.current = false;
    onClose();
  };

  // Проверяем, смотрим ли мы на текущее действие
  const isViewingCurrentAction = selectedAction === currentTournamentAction;

  // Можно редактировать любое действие, кроме null
  const canEdit = selectedAction !== null;

  const popupContent = (
    <>
      {/* Оверлей */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Попап - увеличена ширина */}
        <div
          className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl p-3 relative z-[10000] max-w-4xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-white">
                Диапазон: {playerName}
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Позиция:{" "}
                <span className="text-blue-400 font-semibold">{position}</span>
                {" • "}Сила:{" "}
                <span className="text-purple-400">
                  {strength === "fish"
                    ? "Фиш"
                    : strength === "amateur"
                    ? "Любитель"
                    : "Регуляр"}
                </span>
                {" • "}Стиль:{" "}
                <span className="text-orange-400">
                  {playStyle === "tight"
                    ? "Тайт"
                    : playStyle === "balanced"
                    ? "Баланс"
                    : "Агрессор"}
                </span>
                {" • "}Стек:{" "}
                <span className="text-cyan-400">
                  {stackSize === "very-small"
                    ? "Очень маленький"
                    : stackSize === "small"
                    ? "Маленький"
                    : stackSize === "medium"
                    ? "Средний"
                    : "Большой"}
                </span>
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {selectedAction === null ? (
                  <span className="text-yellow-400 font-semibold">
                    🃏 Полный диапазон (только чтение)
                  </span>
                ) : isViewingCurrentAction ? (
                  <span className="text-green-400 font-semibold">
                    ⭐ Текущий диапазон (сохраняется)
                  </span>
                ) : (
                  <span className="text-orange-400 font-semibold">
                    ✏️ Временное изменение (только для раздачи)
                  </span>
                )}
                {" • "}Выбрано: {displayedRange.length}
                {selectedAction === null ? "/169" : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-sm font-bold w-6 h-6 flex items-center justify-center rounded hover:bg-white/10"
            >
              ✕
            </button>
          </div>

          {/* Основной контент - flex с переключателем действий слева */}
          <div className="flex gap-3">
            {/* Переключатель действий слева */}
            <div className="bg-slate-900/50 rounded-lg p-2 w-48 flex-shrink-0">
              <h4 className="text-xs font-semibold text-white mb-2">
                Действия:
              </h4>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {availableActions.map((action) => {
                  const isSelected = selectedAction === action.key;
                  const isCurrent = action.key === currentTournamentAction;

                  return (
                    <button
                      key={action.key}
                      onClick={() => setSelectedAction(action.key)}
                      className={`
                        w-full text-left px-2 py-1.5 rounded text-xs transition-all
                        ${
                          isSelected
                            ? "bg-blue-600 text-white font-semibold"
                            : "bg-slate-800/50 text-gray-300 hover:bg-slate-700"
                        }
                      `}
                    >
                      {action.label}
                      {isCurrent && (
                        <span className="ml-1 text-[10px] text-green-400">
                          ⭐
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Правая часть с матрицей и кнопками */}
            <div className="flex-1">
              {/* Матрица рук */}
              <div className="bg-slate-900/50 rounded-lg p-2 mb-2">
                <div className="grid grid-cols-13 gap-[2px]">
                  {handMatrix.map((row, rowIndex) =>
                    row.map((hand, colIndex) => {
                      const selected = isHandSelected(hand);
                      // Определяем тип руки для цвета
                      const isPair = rowIndex === colIndex;
                      const isSuited = rowIndex < colIndex;

                      return (
                        <button
                          key={`${rowIndex}-${colIndex}`}
                          onClick={() => toggleHand(hand)}
                          className={`
                        aspect-square text-[8px] font-bold rounded-sm transition-all duration-75
                        ${
                          selected
                            ? "bg-gradient-to-br from-red-200 to-red-300 text-gray-800 shadow-sm scale-105 border-red-400"
                            : isPair
                            ? "bg-gradient-to-br from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-800"
                            : isSuited
                            ? "bg-gradient-to-br from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 text-gray-800"
                            : "bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800"
                        }
                        hover:scale-105 hover:z-10 border border-gray-300
                      `}
                        >
                          {hand}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="flex gap-1.5">
                <button
                  onClick={clearRange}
                  disabled={!canEdit}
                  className={`flex-1 py-1 px-2 rounded text-xs font-semibold transition-all duration-200 ${
                    canEdit
                      ? "bg-red-600/90 hover:bg-red-600 text-white cursor-pointer"
                      : "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Очистить
                </button>
                <button
                  onClick={handleDone}
                  className="flex-1 bg-blue-600/90 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs font-semibold transition-all duration-200"
                >
                  Готово
                </button>
              </div>

              {/* Отображение выбранных рук */}
              {displayedRange.length > 0 && (
                <div className="mt-2 p-1.5 bg-slate-800/50 rounded">
                  <p className="text-[8px] text-gray-400 mb-1">Выбранные:</p>
                  <div className="flex flex-wrap gap-0.5">
                    {displayedRange.map((hand) => (
                      <span
                        key={hand}
                        className="px-1 py-0.5 bg-gradient-to-br from-red-200 to-red-300 text-gray-800 text-[8px] rounded font-semibold border border-red-400"
                      >
                        {hand}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {createPortal(popupContent, document.body)}
      <SaveRangeDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        onSave={handleSaveRange}
        tableType={tableType}
        category={category}
        startingStack={startingStack}
        bounty={bounty}
      />
    </>
  );
}
