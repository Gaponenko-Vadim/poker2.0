"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

// Типы для конструктора диапазонов
type Position = "UTG" | "UTG+1" | "MP" | "HJ" | "CO" | "BTN" | "SB" | "BB";
type Strength = "fish" | "amateur" | "regular";
type PlayStyle = "tight" | "balanced" | "aggressor";
type StackSize = "very_short" | "short" | "medium" | "big";
type ActionType = "open_raise" | "push_range" | "call_vs_shove" | "defense_vs_open" | "3bet" | "defense_vs_3bet" | "4bet" | "defense_vs_4bet" | "5bet" | "defense_vs_5bet";

interface RangeConfig {
  position: Position;
  strength: Strength;
  playStyle: PlayStyle;
  stackSize: StackSize;
  action: ActionType;
  range: string[];
}

interface PlayerSettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  autoAllIn: boolean;
  onToggleAutoAllIn: (value: boolean) => void;
}

export default function PlayerSettingsPopup({
  isOpen,
  onClose,
  playerName,
  autoAllIn,
  onToggleAutoAllIn,
}: PlayerSettingsPopupProps) {
  const [mounted, setMounted] = useState(false);

  // Вкладки: "settings" или "rangeBuilder"
  const [activeTab, setActiveTab] = useState<"settings" | "rangeBuilder">("settings");

  // Состояния для конструктора диапазонов
  const [position, setPosition] = useState<Position>("UTG");
  const [strength, setStrength] = useState<Strength>("fish");
  const [playStyle, setPlayStyle] = useState<PlayStyle>("tight");
  const [stackSize, setStackSize] = useState<StackSize>("short");
  const [action, setAction] = useState<ActionType>("open_raise");
  const [currentRange, setCurrentRange] = useState<string[]>([]);
  const [savedRanges, setSavedRanges] = useState<RangeConfig[]>([]);
  const [copyStatus, setCopyStatus] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Функции для конструктора диапазонов
  const ranks = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

  const generateHandMatrix = (): string[][] => {
    const matrix: string[][] = [];
    for (let i = 0; i < ranks.length; i++) {
      const row: string[] = [];
      for (let j = 0; j < ranks.length; j++) {
        if (i === j) {
          row.push(`${ranks[i]}${ranks[j]}`);
        } else if (i < j) {
          row.push(`${ranks[i]}${ranks[j]}s`);
        } else {
          row.push(`${ranks[j]}${ranks[i]}o`);
        }
      }
      matrix.push(row);
    }
    return matrix;
  };

  const handMatrix = generateHandMatrix();

  const isHandSelected = (hand: string): boolean => {
    return currentRange.includes(hand);
  };

  const toggleHand = (hand: string) => {
    if (currentRange.includes(hand)) {
      setCurrentRange(currentRange.filter((h) => h !== hand));
    } else {
      setCurrentRange([...currentRange, hand]);
    }
  };

  const clearRange = () => {
    setCurrentRange([]);
  };

  const selectAllHands = () => {
    const allHands: string[] = [];
    handMatrix.forEach((row) => {
      row.forEach((hand) => {
        allHands.push(hand);
      });
    });
    setCurrentRange(allHands);
  };

  const saveCurrentRange = () => {
    const newConfig: RangeConfig = {
      position,
      strength,
      playStyle,
      stackSize,
      action,
      range: [...currentRange],
    };

    const existingIndex = savedRanges.findIndex(
      (r) =>
        r.position === position &&
        r.strength === strength &&
        r.playStyle === playStyle &&
        r.stackSize === stackSize &&
        r.action === action
    );

    if (existingIndex !== -1) {
      const updated = [...savedRanges];
      updated[existingIndex] = newConfig;
      setSavedRanges(updated);
      setCopyStatus("Диапазон обновлен!");
    } else {
      setSavedRanges([...savedRanges, newConfig]);
      setCopyStatus("Диапазон сохранен!");
    }

    setTimeout(() => setCopyStatus(""), 2000);
  };

  const loadRange = (config: RangeConfig) => {
    setPosition(config.position);
    setStrength(config.strength);
    setPlayStyle(config.playStyle);
    setStackSize(config.stackSize);
    setAction(config.action);
    setCurrentRange([...config.range]);
  };

  const deleteRange = (index: number) => {
    setSavedRanges(savedRanges.filter((_, i) => i !== index));
  };

  const exportToJSON = () => {
    const exported: any = {
      ranges: {
        user: {
          positions: {},
        },
      },
    };

    savedRanges.forEach((config) => {
      const { position, strength, playStyle, stackSize, action, range } = config;

      if (!exported.ranges.user.positions[position]) {
        exported.ranges.user.positions[position] = {};
      }
      if (!exported.ranges.user.positions[position][strength]) {
        exported.ranges.user.positions[position][strength] = {};
      }
      if (!exported.ranges.user.positions[position][strength][playStyle]) {
        exported.ranges.user.positions[position][strength][playStyle] = {
          ranges_by_stack: {},
        };
      }
      if (!exported.ranges.user.positions[position][strength][playStyle].ranges_by_stack[stackSize]) {
        exported.ranges.user.positions[position][strength][playStyle].ranges_by_stack[stackSize] = {};
      }

      exported.ranges.user.positions[position][strength][playStyle].ranges_by_stack[stackSize][action] =
        range.length > 0 ? range.join(", ") : "NEVER";
    });

    return JSON.stringify(exported, null, 2);
  };

  const copyToClipboard = () => {
    const json = exportToJSON();
    navigator.clipboard.writeText(json).then(() => {
      setCopyStatus("JSON скопирован в буфер обмена!");
      setTimeout(() => setCopyStatus(""), 3000);
    });
  };

  const downloadJSON = () => {
    const json = exportToJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ranges_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setCopyStatus("JSON файл скачан!");
    setTimeout(() => setCopyStatus(""), 3000);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) {
    return null;
  }

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10001] p-4"
      onClick={onClose}
    >
      <div
        className={`bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl p-4 relative ${
          activeTab === "rangeBuilder" ? "max-w-7xl w-full max-h-[95vh] overflow-y-auto" : "min-w-[350px] max-w-[450px]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок с вкладками */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white">Настройки игрока</h3>
            <p className="text-xs text-gray-400 mt-1">
              Игрок: <span className="font-bold text-white">{playerName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Вкладки */}
        <div className="flex gap-2 mb-4 border-b border-slate-600">
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === "settings"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Основные настройки
          </button>
          <button
            onClick={() => setActiveTab("rangeBuilder")}
            className={`px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === "rangeBuilder"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Конструктор диапазонов
          </button>
        </div>

        {/* Контент вкладок */}
        {activeTab === "settings" && (
          <div>
            {/* Настройка автоматического All-In */}
            <div className="bg-gray-700 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-white mb-1">
                    Автоматический All-In
                  </h4>
                  <p className="text-xs text-gray-400">
                    Ставить весь стек без подтверждения
                  </p>
                </div>
                <button
                  onClick={() => onToggleAutoAllIn(!autoAllIn)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    autoAllIn ? "bg-green-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      autoAllIn ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}

        {activeTab === "rangeBuilder" && (
          <div className="grid grid-cols-2 gap-4">
            {/* Левая колонка - параметры и матрица */}
            <div className="space-y-3">
              {/* Селекторы параметров */}
              <div className="bg-slate-900/50 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-white mb-3">Параметры диапазона</h4>

                <div className="grid grid-cols-2 gap-3">
                  {/* Позиция */}
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Позиция</label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value as Position)}
                      className="w-full bg-slate-800 text-white text-xs rounded px-2 py-1.5 border border-slate-600"
                    >
                      <option value="UTG">UTG</option>
                      <option value="UTG+1">UTG+1</option>
                      <option value="MP">MP</option>
                      <option value="HJ">HJ</option>
                      <option value="CO">CO</option>
                      <option value="BTN">BTN</option>
                      <option value="SB">SB</option>
                      <option value="BB">BB</option>
                    </select>
                  </div>

                  {/* Сила игрока */}
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Сила игрока</label>
                    <select
                      value={strength}
                      onChange={(e) => setStrength(e.target.value as Strength)}
                      className="w-full bg-slate-800 text-white text-xs rounded px-2 py-1.5 border border-slate-600"
                    >
                      <option value="fish">Fish (Фиш)</option>
                      <option value="amateur">Amateur (Любитель)</option>
                      <option value="regular">Regular (Регуляр)</option>
                    </select>
                  </div>

                  {/* Стиль игры */}
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Стиль игры</label>
                    <select
                      value={playStyle}
                      onChange={(e) => setPlayStyle(e.target.value as PlayStyle)}
                      className="w-full bg-slate-800 text-white text-xs rounded px-2 py-1.5 border border-slate-600"
                    >
                      <option value="tight">Tight (Тайт)</option>
                      <option value="balanced">Balanced (Баланс)</option>
                      <option value="aggressor">Aggressor (Агрессор)</option>
                    </select>
                  </div>

                  {/* Размер стека */}
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Размер стека</label>
                    <select
                      value={stackSize}
                      onChange={(e) => setStackSize(e.target.value as StackSize)}
                      className="w-full bg-slate-800 text-white text-xs rounded px-2 py-1.5 border border-slate-600"
                    >
                      <option value="very_short">Very Short (&lt;20 BB)</option>
                      <option value="short">Short (20-80 BB)</option>
                      <option value="medium">Medium (80-180 BB)</option>
                      <option value="big">Big (&gt;180 BB)</option>
                    </select>
                  </div>

                  {/* Действие */}
                  <div className="col-span-2">
                    <label className="text-xs text-gray-400 block mb-1">Действие</label>
                    <select
                      value={action}
                      onChange={(e) => setAction(e.target.value as ActionType)}
                      className="w-full bg-slate-800 text-white text-xs rounded px-2 py-1.5 border border-slate-600"
                    >
                      <option value="open_raise">Open Raise (Опен-рейз)</option>
                      <option value="push_range">Push Range (Пуш)</option>
                      <option value="call_vs_shove">Call vs Shove (Колл на пуш)</option>
                      <option value="defense_vs_open">Defense vs Open (Защита vs опен)</option>
                      <option value="3bet">3-Bet (3-бет)</option>
                      <option value="defense_vs_3bet">Defense vs 3-Bet (Защита vs 3-бет)</option>
                      <option value="4bet">4-Bet (4-бет)</option>
                      <option value="defense_vs_4bet">Defense vs 4-Bet (Защита vs 4-бет)</option>
                      <option value="5bet">5-Bet (5-бет)</option>
                      <option value="defense_vs_5bet">Defense vs 5-Bet (Защита vs 5-бет)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Матрица рук */}
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-white">
                    Выбор рук ({currentRange.length}/169)
                  </h4>
                  <div className="flex gap-1">
                    <button
                      onClick={selectAllHands}
                      className="text-xs bg-green-600/90 hover:bg-green-600 text-white px-2 py-1 rounded"
                    >
                      Выбрать все
                    </button>
                    <button
                      onClick={clearRange}
                      className="text-xs bg-red-600/90 hover:bg-red-600 text-white px-2 py-1 rounded"
                    >
                      Очистить
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-13 gap-[2px]">
                  {handMatrix.map((row, rowIndex) =>
                    row.map((hand, colIndex) => {
                      const selected = isHandSelected(hand);
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

                {/* Кнопка сохранения */}
                <button
                  onClick={saveCurrentRange}
                  className="w-full mt-3 bg-green-600/90 hover:bg-green-600 text-white py-2 rounded font-semibold text-sm"
                >
                  Сохранить диапазон
                </button>
              </div>

              {/* Отображение выбранных рук */}
              {currentRange.length > 0 && (
                <div className="bg-slate-900/50 rounded-lg p-2">
                  <p className="text-xs text-gray-400 mb-2">Выбранные руки:</p>
                  <div className="flex flex-wrap gap-1">
                    {currentRange.map((hand) => (
                      <span
                        key={hand}
                        className="px-1.5 py-0.5 bg-gradient-to-br from-red-200 to-red-300 text-gray-800 text-[10px] rounded font-semibold border border-red-400"
                      >
                        {hand}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Правая колонка - сохраненные диапазоны и экспорт */}
            <div className="space-y-3">
              {/* Статус операций */}
              {copyStatus && (
                <div className="bg-green-600/20 border border-green-600 text-green-400 px-3 py-2 rounded text-sm">
                  {copyStatus}
                </div>
              )}

              {/* Кнопки экспорта */}
              <div className="bg-slate-900/50 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-white mb-3">Экспорт</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={copyToClipboard}
                    disabled={savedRanges.length === 0}
                    className={`py-2 px-3 rounded text-sm font-semibold ${
                      savedRanges.length > 0
                        ? "bg-blue-600/90 hover:bg-blue-600 text-white"
                        : "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Копировать JSON
                  </button>
                  <button
                    onClick={downloadJSON}
                    disabled={savedRanges.length === 0}
                    className={`py-2 px-3 rounded text-sm font-semibold ${
                      savedRanges.length > 0
                        ? "bg-purple-600/90 hover:bg-purple-600 text-white"
                        : "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Скачать JSON
                  </button>
                </div>
              </div>

              {/* Список сохраненных диапазонов */}
              <div className="bg-slate-900/50 rounded-lg p-3 flex-1 overflow-y-auto max-h-[600px]">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Сохраненные диапазоны ({savedRanges.length})
                </h4>

                {savedRanges.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">
                    Нет сохраненных диапазонов. Создайте первый диапазон!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {savedRanges.map((config, index) => (
                      <div
                        key={index}
                        className="bg-slate-800/50 rounded p-2 border border-slate-700"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-white">
                              {config.position} • {config.strength} • {config.playStyle}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {config.stackSize} • {config.action}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => loadRange(config)}
                              className="text-[10px] bg-blue-600/80 hover:bg-blue-600 text-white px-2 py-1 rounded"
                            >
                              Загрузить
                            </button>
                            <button
                              onClick={() => deleteRange(index)}
                              className="text-[10px] bg-red-600/80 hover:bg-red-600 text-white px-2 py-1 rounded"
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-0.5 mt-1">
                          {config.range.slice(0, 15).map((hand) => (
                            <span
                              key={hand}
                              className="px-1 py-0.5 bg-gradient-to-br from-red-200 to-red-300 text-gray-800 text-[8px] rounded font-semibold border border-red-400"
                            >
                              {hand}
                            </span>
                          ))}
                          {config.range.length > 15 && (
                            <span className="px-1 py-0.5 text-gray-400 text-[8px]">
                              +{config.range.length - 15} еще
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
