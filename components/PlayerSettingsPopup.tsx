"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

// Типы для конструктора диапазонов
type TableType = "6-max" | "8-max" | "cash";
type StartingStack = 100 | 200;
type Category = "micro" | "low" | "mid" | "high";
type Stage = "early" | "middle" | "pre-bubble" | "late" | "pre-final" | "final" | string; // Добавлена поддержка пользовательских стадий
type Position = "UTG" | "UTG+1" | "MP" | "HJ" | "CO" | "BTN" | "SB" | "BB";
type Strength = "fish" | "amateur" | "regular";
type PlayStyle = "tight" | "balanced" | "aggressor";
type StackSize = "very_short" | "short" | "medium" | "big";
type ActionType = "open_raise" | "push_range" | "call_vs_shove" | "defense_vs_open" | "3bet" | "defense_vs_3bet" | "4bet" | "defense_vs_4bet" | "5bet" | "defense_vs_5bet";

// Интерфейс для пользовательской стадии турнира
interface CustomStage {
  id: string;
  label: string;
  order: number;
}

interface RangeConfig {
  // Основные параметры диапазона
  tableType: TableType;
  startingStack: StartingStack;
  category: Category;
  bounty: boolean;
  // Фильтры внутри диапазона
  stage: Stage;
  position: Position;
  strength: Strength;
  playStyle: PlayStyle;
  stackSize: StackSize;
  action: ActionType;
  range: string[];
}

// Интерфейс для набора диапазонов из БД
interface RangeSetFromDB {
  id: number;
  name: string;
  table_type: string;
  category: string;
  starting_stack: number;
  bounty: boolean;
  range_data: any;
  created_at: string;
  updated_at: string;
}

interface PlayerSettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  autoAllIn: boolean;
  onToggleAutoAllIn: (value: boolean) => void;
  // Размер опена и множители для рейзов
  openRaiseSize?: number;
  onOpenRaiseSizeChange?: (value: number) => void;
  threeBetMultiplier?: number;
  fourBetMultiplier?: number;
  fiveBetMultiplier?: number;
  onThreeBetMultiplierChange?: (value: number) => void;
  onFourBetMultiplierChange?: (value: number) => void;
  onFiveBetMultiplierChange?: (value: number) => void;
  // Включенные стили игры и силы игроков
  enabledPlayStyles?: { tight: boolean; balanced: boolean; aggressor: boolean };
  enabledStrengths?: { fish: boolean; amateur: boolean; regular: boolean };
  onEnabledPlayStylesChange?: (styles: { tight: boolean; balanced: boolean; aggressor: boolean }) => void;
  onEnabledStrengthsChange?: (strengths: { fish: boolean; amateur: boolean; regular: boolean }) => void;
}

export default function PlayerSettingsPopup({
  isOpen,
  onClose,
  playerName,
  autoAllIn,
  onToggleAutoAllIn,
  openRaiseSize = 2.5,
  onOpenRaiseSizeChange,
  threeBetMultiplier = 3,
  fourBetMultiplier = 2.7,
  fiveBetMultiplier = 2.2,
  onThreeBetMultiplierChange,
  onFourBetMultiplierChange,
  onFiveBetMultiplierChange,
  enabledPlayStyles = { tight: false, balanced: true, aggressor: false },
  enabledStrengths = { fish: false, amateur: true, regular: false },
  onEnabledPlayStylesChange,
  onEnabledStrengthsChange,
}: PlayerSettingsPopupProps) {
  const [showWarning, setShowWarning] = useState<string | null>(null);

  // Вкладки: "settings" или "rangeBuilder"
  const [activeTab, setActiveTab] = useState<"settings" | "rangeBuilder">("settings");

  // Режим конструктора диапазонов: "opponent" (противники) или "player" (игрок)
  const [rangeBuilderMode, setRangeBuilderMode] = useState<"opponent" | "player">("opponent");

  // Для режима "игрок" - против какого стиля противника играем
  const [againstStyle, setAgainstStyle] = useState<PlayStyle>("balanced");

  // Состояния для конструктора диапазонов
  // Основные параметры
  const [tableType, setTableType] = useState<TableType | "">("");
  const [startingStack, setStartingStack] = useState<StartingStack | "">("" );
  const [category, setCategory] = useState<Category | "">("");
  const [bounty, setBounty] = useState<boolean>(false);
  // Фильтры
  const [stage, setStage] = useState<Stage>("early");
  const [position, setPosition] = useState<Position>("UTG");
  const [strength, setStrength] = useState<Strength>("fish");
  const [playStyle, setPlayStyle] = useState<PlayStyle>("tight");
  const [stackSize, setStackSize] = useState<StackSize>("short");
  const [action, setAction] = useState<ActionType>("open_raise");

  const [currentRange, setCurrentRange] = useState<string[]>([]);
  const [savedRanges, setSavedRanges] = useState<RangeConfig[]>([]);
  const [dbRangeSets, setDbRangeSets] = useState<RangeSetFromDB[]>([]);
  const [copyStatus, setCopyStatus] = useState<string>("");
  const [showAllTableTypes, setShowAllTableTypes] = useState<boolean>(false);
  const [isLoadingDbRanges, setIsLoadingDbRanges] = useState<boolean>(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null);

  // State для player ranges (диапазоны игрока)
  const [playerRanges, setPlayerRanges] = useState<any[]>([]);
  const [isLoadingPlayerRanges, setIsLoadingPlayerRanges] = useState<boolean>(false);
  const [deletePlayerRangeConfirmation, setDeletePlayerRangeConfirmation] = useState<{ id: number } | null>(null);
  const [editingRangeSet, setEditingRangeSet] = useState<RangeSetFromDB | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [newSetName, setNewSetName] = useState<string>("");
  const [fillEmptyRanges, setFillEmptyRanges] = useState<"empty" | "default" | null>(null);
  // Параметры для сохраняемого набора (отдельно от фильтров)
  const [saveTableType, setSaveTableType] = useState<TableType | "">("");
  const [saveStartingStack, setSaveStartingStack] = useState<StartingStack | "">("" );
  const [saveCategory, setSaveCategory] = useState<Category | "">("");
  const [saveBounty, setSaveBounty] = useState<boolean>(false);
  // Фильтр для баунти (отдельно от saveBounty)
  const [bountyFilter, setBountyFilter] = useState<"all" | "true" | "false">("all");

  // Управление пользовательскими стадиями турнира
  const [customStages, setCustomStages] = useState<CustomStage[]>([
    { id: "early", label: "Early (Ранняя)", order: 0 },
    { id: "middle", label: "Middle (Средняя)", order: 1 },
    { id: "pre-bubble", label: "Pre-Bubble (Перед баблом)", order: 2 },
    { id: "late", label: "Late (Поздняя)", order: 3 },
    { id: "pre-final", label: "Pre-Final (Перед финалом)", order: 4 },
    { id: "final", label: "Final (Финальная)", order: 5 },
  ]);
  const [showStageManager, setShowStageManager] = useState<boolean>(false);
  const [newStageName, setNewStageName] = useState<string>("");
  const [insertAfterStageId, setInsertAfterStageId] = useState<string>("");

  // Загружаем сохраненные диапазоны из localStorage при монтировании
  useEffect(() => {
    const loadSavedRanges = () => {
      try {
        const saved = localStorage.getItem('rangeBuilderRanges');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Добавляем bounty: false для старых диапазонов без этого поля
          const updatedRanges = parsed.map((range: RangeConfig) => ({
            ...range,
            bounty: range.bounty ?? false,
          }));
          setSavedRanges(updatedRanges);
        }
      } catch (error) {
        console.error('Failed to load saved ranges:', error);
      }
    };
    loadSavedRanges();
  }, []);

  // Автоматически сохраняем диапазоны в localStorage при их изменении
  useEffect(() => {
    if (typeof window !== 'undefined' && savedRanges.length >= 0) {
      try {
        localStorage.setItem('rangeBuilderRanges', JSON.stringify(savedRanges));
      } catch (error) {
        console.error('Failed to save ranges to localStorage:', error);
      }
    }
  }, [savedRanges]);

  // Автоматически сбрасываем saveBounty при переключении на cash
  useEffect(() => {
    if ((saveTableType === "cash" || saveTableType === "") && saveBounty) {
      setSaveBounty(false);
    }
  }, [saveTableType, saveBounty]);

  // Фильтрация наборов при изменении фильтров
  const [filteredDbRangeSets, setFilteredDbRangeSets] = useState<RangeSetFromDB[]>([]);

  useEffect(() => {
    let filtered = [...dbRangeSets];

    if (tableType !== "") {
      filtered = filtered.filter(set => set.table_type === tableType);
    }

    if (startingStack !== "") {
      filtered = filtered.filter(set => set.starting_stack === startingStack);
    }

    if (category !== "") {
      filtered = filtered.filter(set => set.category === category);
    }

    if (bountyFilter !== "all") {
      const bountyValue = bountyFilter === "true";
      filtered = filtered.filter(set => set.bounty === bountyValue);
    }

    setFilteredDbRangeSets(filtered);
  }, [dbRangeSets, tableType, startingStack, category, bountyFilter]);

  // Helper функция для получения headers с токеном
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    console.log('🔑 [getAuthHeaders] Токен из localStorage:', token ? `${token.substring(0, 20)}...` : 'ТОКЕН ОТСУТСТВУЕТ');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || ''}`
    };
  };

  // Перезагружаем диапазон при изменении фильтров в режиме редактирования
  useEffect(() => {
    if (editingRangeSet && editingRangeSet.range_data) {
      loadRangeFromEditingSet(editingRangeSet.range_data);
    }
  }, [stage, position, strength, playStyle, stackSize, action, editingRangeSet]);

  // Загружаем наборы диапазонов из БД при открытии вкладки
  useEffect(() => {
    if (activeTab === "rangeBuilder" && !isLoadingDbRanges) {
      if (rangeBuilderMode === "opponent") {
        loadDbRangeSets();
      } else if (rangeBuilderMode === "player") {
        loadPlayerRanges();
      }
    }
  }, [activeTab, rangeBuilderMode]);

  const loadDbRangeSets = async () => {
    setIsLoadingDbRanges(true);
    try {
      console.log('📥 [loadDbRangeSets] Загружаю диапазоны противников из БД...');
      const response = await fetch('/api/user-ranges/get', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      console.log('📥 [loadDbRangeSets] Ответ сервера:', data);

      if (data.success && data.data) {
        setDbRangeSets(data.data);
        console.log('✅ [loadDbRangeSets] Загружено наборов:', data.data.length);
      } else {
        console.error('❌ [loadDbRangeSets] Ошибка или пустой результат:', data.error || 'Нет данных');
        setDbRangeSets([]);
      }
    } catch (error) {
      console.error('❌ [loadDbRangeSets] Исключение:', error);
      setDbRangeSets([]);
    } finally {
      setIsLoadingDbRanges(false);
    }
  };

  const loadPlayerRanges = async () => {
    setIsLoadingPlayerRanges(true);
    try {
      console.log('📥 [loadPlayerRanges] Загружаю диапазоны игрока из БД...');
      const response = await fetch('/api/player-ranges/get', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      console.log('📥 [loadPlayerRanges] Ответ сервера:', data);

      if (data.success && data.data) {
        setPlayerRanges(data.data);
        console.log('✅ [loadPlayerRanges] Загружено наборов:', data.data.length);
      } else {
        console.error('❌ [loadPlayerRanges] Ошибка или пустой результат:', data.error || 'Нет данных');
        setPlayerRanges([]);
      }
    } catch (error) {
      console.error('❌ [loadPlayerRanges] Исключение:', error);
      setPlayerRanges([]);
    } finally {
      setIsLoadingPlayerRanges(false);
    }
  };

  const confirmDeleteDbRangeSet = async () => {
    if (!deleteConfirmation) return;

    const { id } = deleteConfirmation;

    try {
      const response = await fetch(`/api/user-ranges/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        setCopyStatus("Набор удален!");
        setTimeout(() => setCopyStatus(""), 2000);
        // Перезагружаем список
        loadDbRangeSets();
      } else {
        setCopyStatus("Ошибка удаления набора");
        setTimeout(() => setCopyStatus(""), 2000);
      }
    } catch (error) {
      console.error('Error deleting range set:', error);
      setCopyStatus("Ошибка удаления набора");
      setTimeout(() => setCopyStatus(""), 2000);
    } finally {
      setDeleteConfirmation(null);
    }
  };

  const confirmDeletePlayerRange = async () => {
    if (!deletePlayerRangeConfirmation) return;

    const { id } = deletePlayerRangeConfirmation;

    try {
      const response = await fetch(`/api/player-ranges/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (data.success) {
        setCopyStatus("Диапазон удален!");
        setTimeout(() => setCopyStatus(""), 2000);
        // Перезагружаем список
        loadPlayerRanges();
      } else {
        setCopyStatus("Ошибка удаления диапазона");
        setTimeout(() => setCopyStatus(""), 2000);
      }
    } catch (error) {
      console.error('Error deleting player range:', error);
      setCopyStatus("Ошибка удаления диапазона");
      setTimeout(() => setCopyStatus(""), 2000);
    } finally {
      setDeletePlayerRangeConfirmation(null);
    }
  };

  const startEditingRangeSet = async (rangeSet: RangeSetFromDB) => {
    try {
      // Загружаем полные данные из БД (включая range_data)
      const response = await fetch(`/api/user-ranges/${rangeSet.id}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (data.success && data.data) {
        const fullRangeSet = data.data;
        setEditingRangeSet(fullRangeSet);
        // Устанавливаем параметры набора
        setTableType(fullRangeSet.table_type as TableType);
        setStartingStack(fullRangeSet.starting_stack as StartingStack);
        setCategory(fullRangeSet.category as Category);
        setBounty(fullRangeSet.bounty);
        // Загружаем диапазон для текущих фильтров
        loadRangeFromEditingSet(fullRangeSet.range_data);
      } else {
        setCopyStatus("Ошибка загрузки набора для редактирования");
        setTimeout(() => setCopyStatus(""), 2000);
      }
    } catch (error) {
      console.error('Error loading range set for editing:', error);
      setCopyStatus("Ошибка загрузки набора");
      setTimeout(() => setCopyStatus(""), 2000);
    }
  };

  const startEditingPlayerRangeSet = async (rangeSet: RangeSetFromDB) => {
    try {
      // Загружаем полные данные из БД (включая range_data)
      const response = await fetch(`/api/player-ranges/${rangeSet.id}/get`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (data.success && data.data) {
        const fullRangeSet = data.data;
        setEditingRangeSet(fullRangeSet);
        // Устанавливаем параметры набора
        setTableType(fullRangeSet.table_type as TableType);
        setStartingStack(fullRangeSet.starting_stack as StartingStack);
        setCategory(fullRangeSet.category as Category);
        setBounty(fullRangeSet.bounty);
        // Загружаем диапазон для текущих фильтров
        loadRangeFromEditingSet(fullRangeSet.range_data);
      } else {
        setCopyStatus("Ошибка загрузки набора для редактирования");
        setTimeout(() => setCopyStatus(""), 2000);
      }
    } catch (error) {
      console.error('Error loading player range set for editing:', error);
      setCopyStatus("Ошибка загрузки набора");
      setTimeout(() => setCopyStatus(""), 2000);
    }
  };

  const loadRangeFromEditingSet = (rangeData: any) => {
    if (!rangeData || !rangeData.ranges || !rangeData.ranges.user || !rangeData.ranges.user.stages) {
      setCurrentRange([]);
      return;
    }

    // Загружаем customStages если они есть в rangeData
    if (rangeData.customStages && Array.isArray(rangeData.customStages)) {
      setCustomStages(rangeData.customStages);
    }

    try {
      const stageData = rangeData.ranges.user.stages[stage];
      if (!stageData || !stageData.positions) {
        setCurrentRange([]);
        return;
      }

      const positionData = stageData.positions[position];
      if (!positionData) {
        setCurrentRange([]);
        return;
      }

      let stackData;

      if (rangeBuilderMode === "opponent") {
        // Для opponent ranges: position -> strength -> playStyle -> ranges_by_stack
        if (!positionData[strength]) {
          setCurrentRange([]);
          return;
        }

        const strengthData = positionData[strength];
        if (!strengthData || !strengthData[playStyle]) {
          setCurrentRange([]);
          return;
        }

        const playStyleData = strengthData[playStyle];
        if (!playStyleData || !playStyleData.ranges_by_stack) {
          setCurrentRange([]);
          return;
        }

        stackData = playStyleData.ranges_by_stack[stackSize];
      } else {
        // Для player ranges: position -> against_style -> ranges_by_stack (без strength!)
        const againstStyleKey = againstStyle; // используем againstStyle вместо playStyle

        if (!positionData[againstStyleKey]) {
          setCurrentRange([]);
          return;
        }

        const againstStyleData = positionData[againstStyleKey];
        if (!againstStyleData || !againstStyleData.ranges_by_stack) {
          setCurrentRange([]);
          return;
        }

        stackData = againstStyleData.ranges_by_stack[stackSize];
      }

      if (!stackData || !stackData[action]) {
        setCurrentRange([]);
        return;
      }

      const rangeString = stackData[action];
      if (rangeString === "NEVER" || !rangeString) {
        setCurrentRange([]);
        return;
      }

      // Парсим строку диапазона в массив
      const rangeArray = rangeString.split(',').map((h: string) => h.trim()).filter((h: string) => h);
      setCurrentRange(rangeArray);
    } catch (error) {
      console.error('Error loading range from editing set:', error);
      setCurrentRange([]);
    }
  };

  const cancelEditing = () => {
    setEditingRangeSet(null);
    setCurrentRange([]);
    // Сбрасываем параметры
    setTableType("");
    setStartingStack("");
    setCategory("");
    setBounty(false);
  };

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

  // Функции управления стадиями турнира
  const addCustomStage = () => {
    if (!newStageName.trim()) {
      setCopyStatus("Введите название стадии!");
      setTimeout(() => setCopyStatus(""), 2000);
      return;
    }

    const stageId = newStageName.trim().toLowerCase().replace(/\s+/g, '-');

    // Проверка на дублирование
    if (customStages.find(s => s.id === stageId)) {
      setCopyStatus("Стадия с таким названием уже существует!");
      setTimeout(() => setCopyStatus(""), 2000);
      return;
    }

    let newOrder: number;
    if (!insertAfterStageId) {
      // Добавляем в конец
      newOrder = customStages.length > 0 ? Math.max(...customStages.map(s => s.order)) + 1 : 0;
    } else {
      // Вставляем после выбранной стадии
      const afterStage = customStages.find(s => s.id === insertAfterStageId);
      if (!afterStage) {
        newOrder = customStages.length;
      } else {
        newOrder = afterStage.order + 0.5;
        // Перенормализуем порядок
        const updatedStages = customStages.map(s =>
          s.order > afterStage.order ? { ...s, order: s.order + 1 } : s
        );
        setCustomStages(updatedStages);
      }
    }

    const newStage: CustomStage = {
      id: stageId,
      label: newStageName.trim(),
      order: newOrder,
    };

    setCustomStages([...customStages, newStage].sort((a, b) => a.order - b.order));
    setNewStageName("");
    setInsertAfterStageId("");
    setCopyStatus("Стадия добавлена!");
    setTimeout(() => setCopyStatus(""), 2000);
  };

  const deleteCustomStage = (stageId: string) => {
    // Нельзя удалить дефолтные стадии
    const defaultStages = ["early", "middle", "pre-bubble", "late", "pre-final", "final"];
    if (defaultStages.includes(stageId)) {
      setCopyStatus("Нельзя удалить дефолтную стадию!");
      setTimeout(() => setCopyStatus(""), 2000);
      return;
    }

    setCustomStages(customStages.filter(s => s.id !== stageId));

    // Если удаляемая стадия была выбрана, сбрасываем на первую
    if (stage === stageId) {
      setStage(customStages[0]?.id || "early");
    }

    setCopyStatus("Стадия удалена!");
    setTimeout(() => setCopyStatus(""), 2000);
  };

  const moveStageUp = (stageId: string) => {
    const index = customStages.findIndex(s => s.id === stageId);
    if (index <= 0) return;

    const newStages = [...customStages];
    [newStages[index - 1], newStages[index]] = [newStages[index], newStages[index - 1]];

    // Обновляем order
    newStages.forEach((stage, idx) => {
      stage.order = idx;
    });

    setCustomStages(newStages);
  };

  const moveStageDown = (stageId: string) => {
    const index = customStages.findIndex(s => s.id === stageId);
    if (index < 0 || index >= customStages.length - 1) return;

    const newStages = [...customStages];
    [newStages[index], newStages[index + 1]] = [newStages[index + 1], newStages[index]];

    // Обновляем order
    newStages.forEach((stage, idx) => {
      stage.order = idx;
    });

    setCustomStages(newStages);
  };

  const savePlayerRangeLocally = () => {
    if (currentRange.length === 0) {
      setCopyStatus("Выберите хотя бы одну руку для сохранения!");
      setTimeout(() => setCopyStatus(""), 2000);
      return;
    }

    // Создаем конфигурацию диапазона
    const newConfig: RangeConfig = {
      tableType: "6-max", // временно, будет задано при финальном сохранении
      startingStack: 100, // временно
      category: "micro", // временно
      bounty: false, // временно
      stage,
      position,
      strength: "regular", // не используется для player ranges, но нужно для типа
      playStyle: againstStyle, // в player ranges это against_style
      stackSize,
      action,
      range: [...currentRange],
    };

    // Проверяем есть ли уже такой диапазон
    const existingIndex = savedRanges.findIndex(
      (r) =>
        r.stage === stage &&
        r.position === position &&
        r.playStyle === againstStyle && // для player это against_style
        r.stackSize === stackSize &&
        r.action === action
    );

    if (existingIndex !== -1) {
      // Обновляем существующий
      const updated = [...savedRanges];
      updated[existingIndex] = newConfig;
      setSavedRanges(updated);
      setCopyStatus("Диапазон обновлен!");
    } else {
      // Добавляем новый
      setSavedRanges([...savedRanges, newConfig]);
      setCopyStatus("Диапазон добавлен в набор!");
    }

    setTimeout(() => setCopyStatus(""), 2000);
    // НЕ очищаем currentRange - он понадобится при открытии диалога
  };

  const saveCurrentRange = async () => {
    // Если редактируем набор из БД - сохраняем изменения
    if (editingRangeSet) {
      await saveEditedRangeToDb();
      return;
    }

    // Для создания нового набора (как opponent, так и player):
    // Сохраняем локально
    if (rangeBuilderMode === "player") {
      savePlayerRangeLocally();
    }

    // Открываем диалог для сохранения в БД
    setShowSaveDialog(true);
  };

  const finalizeAndSaveToDb = async () => {
    // Проверка названия
    if (!newSetName.trim()) {
      setCopyStatus("Введите название набора!");
      setTimeout(() => setCopyStatus(""), 2000);
      return;
    }

    // Проверяем параметры
    if (!saveTableType || !saveStartingStack || !saveCategory) {
      setCopyStatus("Заполните все параметры набора!");
      setTimeout(() => setCopyStatus(""), 2000);
      return;
    }

    // Проверяем выбор обработки пустых диапазонов
    if (fillEmptyRanges === null) {
      setCopyStatus("Выберите действие с пустыми диапазонами!");
      setTimeout(() => setCopyStatus(""), 2000);
      return;
    }

    try {
      // Обновляем параметры (tableType, startingStack, category, bounty) для всех сохраненных диапазонов
      let rangesForDb = savedRanges.map(r => ({
        ...r,
        tableType: saveTableType as TableType,
        startingStack: saveStartingStack as StartingStack,
        category: saveCategory as Category,
        bounty: saveBounty,
      }));

      // Добавляем текущий диапазон если он не пустой
      if (currentRange.length > 0) {
        const currentConfig: RangeConfig = {
          tableType: saveTableType as TableType,
          startingStack: saveStartingStack as StartingStack,
          category: saveCategory as Category,
          bounty: saveBounty,
          stage,
          position,
          strength: rangeBuilderMode === "player" ? "regular" : strength,
          playStyle: rangeBuilderMode === "player" ? againstStyle : playStyle,
          stackSize,
          action,
          range: [...currentRange],
        };

        // Проверяем, нет ли уже такого диапазона в rangesForDb
        const existingIndex = rangesForDb.findIndex(
          (r) =>
            r.stage === currentConfig.stage &&
            r.position === currentConfig.position &&
            r.playStyle === currentConfig.playStyle &&
            r.stackSize === currentConfig.stackSize &&
            r.action === currentConfig.action
        );

        // Добавляем только если такого диапазона еще нет
        if (existingIndex === -1) {
          rangesForDb.push(currentConfig);
        }
      }

      // Строим структуру range_data из rangesForDb
      const rangeData: any = {
        customStages: customStages, // Сохраняем пользовательские стадии
        ranges: {
          user: {
            stages: {}
          }
        }
      };

      console.log('📊 [finalizeAndSaveToDb] Сохраняем диапазоны:', {
        mode: rangeBuilderMode,
        rangesCount: rangesForDb.length,
        ranges: rangesForDb.map(r => ({
          stage: r.stage,
          position: r.position,
          playStyle: r.playStyle,
          stackSize: r.stackSize,
          action: r.action,
          rangeLength: r.range.length
        }))
      });

      // Заполняем структуру из rangesForDb
      rangesForDb.forEach(config => {
        if (!rangeData.ranges.user.stages[config.stage]) {
          rangeData.ranges.user.stages[config.stage] = { positions: {} };
        }
        const stageData = rangeData.ranges.user.stages[config.stage];

        if (!stageData.positions[config.position]) {
          stageData.positions[config.position] = {};
        }
        const positionData = stageData.positions[config.position];

        if (rangeBuilderMode === "opponent") {
          // Для opponent ranges: position -> strength -> playStyle -> ranges_by_stack
          if (!positionData[config.strength]) {
            positionData[config.strength] = {};
          }
          const strengthData = positionData[config.strength];

          if (!strengthData[config.playStyle]) {
            strengthData[config.playStyle] = { ranges_by_stack: {} };
          }
          const playStyleData = strengthData[config.playStyle];

          if (!playStyleData.ranges_by_stack[config.stackSize]) {
            playStyleData.ranges_by_stack[config.stackSize] = {};
          }

          // Сохраняем диапазон
          const rangeString = config.range.length > 0 ? config.range.join(", ") : "NEVER";
          playStyleData.ranges_by_stack[config.stackSize][config.action] = rangeString;
        } else {
          // Для player ranges: position -> against_style -> ranges_by_stack (без strength!)
          const againstStyleKey = config.playStyle; // в RangeConfig это playStyle, но для player это against_style

          if (!positionData[againstStyleKey]) {
            positionData[againstStyleKey] = { ranges_by_stack: {} };
          }
          const againstStyleData = positionData[againstStyleKey];

          if (!againstStyleData.ranges_by_stack[config.stackSize]) {
            againstStyleData.ranges_by_stack[config.stackSize] = {};
          }

          // Сохраняем диапазон
          const rangeString = config.range.length > 0 ? config.range.join(", ") : "NEVER";
          againstStyleData.ranges_by_stack[config.stackSize][config.action] = rangeString;
        }
      });

      // Если выбрано заполнение дефолтными диапазонами
      if (fillEmptyRanges === "default") {
        // TODO: загрузить дефолтные диапазоны из constants
        // Пока оставляем пустым - будет реализовано позже
        setCopyStatus("Дефолтные диапазоны с такими настройками пока не реализованы");
        setTimeout(() => setCopyStatus(""), 3000);
      }

      console.log('📦 [finalizeAndSaveToDb] Итоговая структура rangeData:', JSON.stringify(rangeData, null, 2));

      // Отправляем на сервер (выбираем endpoint в зависимости от режима)
      const apiEndpoint = rangeBuilderMode === "player"
        ? '/api/player-ranges'
        : '/api/user-ranges/create';

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newSetName.trim(),
          tableType: saveTableType as TableType,
          startingStack: saveStartingStack as StartingStack,
          category: saveCategory as Category,
          bounty: saveBounty,
          rangeData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCopyStatus("Набор успешно сохранен в БД!");
        setShowSaveDialog(false);
        setNewSetName("");
        setFillEmptyRanges(null);
        // Сбрасываем параметры сохранения
        setSaveTableType("");
        setSaveStartingStack("");
        setSaveCategory("");
        setSaveBounty(false);
        // Перезагружаем список
        loadDbRangeSets();
        // Очищаем локальные сохраненные диапазоны
        setSavedRanges([]);
        // Очищаем текущий диапазон
        setCurrentRange([]);
      } else {
        setCopyStatus("Ошибка сохранения: " + (data.error || "Неизвестная ошибка"));
      }
    } catch (error) {
      console.error('Error saving range set to DB:', error);
      setCopyStatus("Ошибка сохранения в БД");
    }

    setTimeout(() => setCopyStatus(""), 3000);
  };

  const saveEditedRangeToDb = async () => {
    if (!editingRangeSet) return;

    try {
      // Обновляем range_data (инициализируем если undefined)
      let updatedRangeData;
      if (!editingRangeSet.range_data) {
        updatedRangeData = {
          customStages: customStages, // Сохраняем пользовательские стадии
          ranges: {
            user: {
              stages: {}
            }
          }
        };
      } else {
        updatedRangeData = JSON.parse(JSON.stringify(editingRangeSet.range_data));
        // Обновляем customStages в существующих данных
        updatedRangeData.customStages = customStages;
      }

      // Создаем путь к диапазону если не существует
      if (!updatedRangeData.ranges) updatedRangeData.ranges = { user: { stages: {} } };
      if (!updatedRangeData.ranges.user) updatedRangeData.ranges.user = { stages: {} };
      if (!updatedRangeData.ranges.user.stages) updatedRangeData.ranges.user.stages = {};
      if (!updatedRangeData.ranges.user.stages[stage]) {
        updatedRangeData.ranges.user.stages[stage] = { positions: {} };
      }

      const stageData = updatedRangeData.ranges.user.stages[stage];
      if (!stageData.positions[position]) stageData.positions[position] = {};

      // Сохраняем диапазон в зависимости от режима
      const rangeString = currentRange.length > 0 ? currentRange.join(", ") : "NEVER";

      if (rangeBuilderMode === "opponent") {
        // Для opponent ranges: position -> strength -> playStyle -> ranges_by_stack
        if (!stageData.positions[position][strength]) stageData.positions[position][strength] = {};
        if (!stageData.positions[position][strength][playStyle]) {
          stageData.positions[position][strength][playStyle] = { ranges_by_stack: {} };
        }
        if (!stageData.positions[position][strength][playStyle].ranges_by_stack[stackSize]) {
          stageData.positions[position][strength][playStyle].ranges_by_stack[stackSize] = {};
        }

        stageData.positions[position][strength][playStyle].ranges_by_stack[stackSize][action] = rangeString;
      } else {
        // Для player ranges: position -> against_style -> ranges_by_stack (без strength!)
        const againstStyleKey = againstStyle;

        if (!stageData.positions[position][againstStyleKey]) {
          stageData.positions[position][againstStyleKey] = { ranges_by_stack: {} };
        }
        if (!stageData.positions[position][againstStyleKey].ranges_by_stack[stackSize]) {
          stageData.positions[position][againstStyleKey].ranges_by_stack[stackSize] = {};
        }

        stageData.positions[position][againstStyleKey].ranges_by_stack[stackSize][action] = rangeString;
      }

      // Выбираем endpoint в зависимости от режима
      const apiEndpoint = rangeBuilderMode === "player"
        ? `/api/player-ranges/update`
        : `/api/user-ranges/update`;

      // Отправляем на сервер
      const response = await fetch(apiEndpoint, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: editingRangeSet.id,
          rangeData: updatedRangeData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCopyStatus("Изменения сохранены!");
        // Обновляем локальное состояние
        setEditingRangeSet({
          ...editingRangeSet,
          range_data: updatedRangeData,
        });
        // Перезагружаем список в зависимости от режима
        if (rangeBuilderMode === "player") {
          loadPlayerRanges();
        } else {
          loadDbRangeSets();
        }
      } else {
        setCopyStatus("Ошибка сохранения");
      }
    } catch (error) {
      console.error('Error saving edited range:', error);
      setCopyStatus("Ошибка сохранения");
    }

    setTimeout(() => setCopyStatus(""), 2000);
  };

  const loadRange = (config: RangeConfig) => {
    // Основные параметры
    setTableType(config.tableType);
    setStartingStack(config.startingStack);
    setCategory(config.category);
    setBounty(config.bounty);
    // Фильтры
    setStage(config.stage);
    setPosition(config.position);
    setStrength(config.strength);
    setPlayStyle(config.playStyle);
    setStackSize(config.stackSize);
    setAction(config.action);
    setCurrentRange([...config.range]);
  };

  const deleteRange = (config: RangeConfig) => {
    setSavedRanges(savedRanges.filter((r) =>
      !(r.tableType === config.tableType &&
        r.startingStack === config.startingStack &&
        r.category === config.category &&
        r.bounty === config.bounty &&
        r.stage === config.stage &&
        r.position === config.position &&
        r.strength === config.strength &&
        r.playStyle === config.playStyle &&
        r.stackSize === config.stackSize &&
        r.action === config.action)
    ));
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

  // Обработчики переключения стилей игры
  const handlePlayStyleToggle = (style: 'tight' | 'balanced' | 'aggressor') => {
    const newValue = !enabledPlayStyles[style];

    // Показываем предупреждение при включении tight или aggressor
    if ((style === 'tight' || style === 'aggressor') && newValue) {
      const label = style === 'tight' ? 'тайтовых' : 'агрессивных';
      setShowWarning(`На данный момент диапазоны для ${label} игроков пустые, они в разработке, но вы самостоятельно можете настроить их в конструкторе диапазонов`);
    }

    // Включаем стиль даже при предупреждении
    if (onEnabledPlayStylesChange) {
      onEnabledPlayStylesChange({
        ...enabledPlayStyles,
        [style]: newValue,
      });
    }
  };

  // Обработчики переключения силы игроков
  const handleStrengthToggle = (strength: 'fish' | 'regular') => {
    const newValue = !enabledStrengths[strength];

    // Показываем предупреждение при включении fish или regular
    if ((strength === 'fish' || strength === 'regular') && newValue) {
      const label = strength === 'fish' ? 'фиш' : 'регуляр';
      setShowWarning(`На данный момент диапазоны для ${label} игроков пустые, они в разработке, но вы самостоятельно можете настроить их в конструкторе диапазонов`);
    }

    // Включаем силу даже при предупреждении
    if (onEnabledStrengthsChange) {
      onEnabledStrengthsChange({
        ...enabledStrengths,
        [strength]: newValue,
      });
    }
  };

  if (!isOpen) {
    return null;
  }

  // Модальное окно с предупреждением
  const warningModal = showWarning && (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10002]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 border-4 border-yellow-500 rounded-2xl shadow-2xl p-8 max-w-md mx-4">
        <div className="flex flex-col items-center gap-4">
          {/* Иконка предупреждения */}
          <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-yellow-900" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Заголовок */}
          <h3 className="text-2xl font-bold text-yellow-100 text-center">
            Внимание!
          </h3>

          {/* Текст предупреждения */}
          <p className="text-base text-yellow-50 text-center leading-relaxed">
            {showWarning}
          </p>

          {/* Кнопка ОК */}
          <button
            onClick={() => setShowWarning(null)}
            className="mt-4 w-full bg-yellow-500 hover:bg-yellow-400 text-yellow-900 font-bold text-lg px-8 py-4 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            ОК, понятно
          </button>
        </div>
      </div>
    </div>
  );

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10001] p-4"
      onClick={onClose}
    >
      <div
        className={`bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl p-4 relative ${
          activeTab === "rangeBuilder" ? "max-w-7xl w-full max-h-[95vh] overflow-y-auto" : "min-w-[800px] max-w-[900px]"
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
          <div className="grid grid-cols-2 gap-4">
            {/* Левая колонка */}
            <div className="space-y-4">
            {/* Настройка автоматического All-In */}
            <div className="bg-gray-700 rounded-lg p-4">
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

            {/* Настройка размера опена */}
            {onOpenRaiseSizeChange && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Размер открытия (Open Raise)
                </h4>
                <p className="text-xs text-gray-400 mb-3">
                  Настройте размер опен-рейза в BB
                </p>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-300 font-medium">Open</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenRaiseSizeChange(Math.max(2, openRaiseSize - 0.1))}
                      className="w-8 h-8 flex items-center justify-center bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M15 19l-7-7 7-7"></path>
                      </svg>
                    </button>
                    <span className="text-sm font-bold text-white min-w-[48px] text-center bg-gray-800 rounded px-2 py-1">
                      {openRaiseSize.toFixed(1)} BB
                    </span>
                    <button
                      onClick={() => onOpenRaiseSizeChange(Math.min(4, openRaiseSize + 0.1))}
                      className="w-8 h-8 flex items-center justify-center bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M9 5l7 7-7 7"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Настройки множителей для рейзов */}
            {onThreeBetMultiplierChange && onFourBetMultiplierChange && onFiveBetMultiplierChange && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Множители для рейзов
                </h4>
                <p className="text-xs text-gray-400 mb-3">
                  Настройте на сколько умножается последняя ставка при рейзе
                </p>

                <div className="space-y-2">
                  {/* 3-bet множитель */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-300 font-medium">3-bet</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onThreeBetMultiplierChange(Math.max(2, threeBetMultiplier - 0.1))}
                        className="w-8 h-8 flex items-center justify-center bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M15 19l-7-7 7-7"></path>
                        </svg>
                      </button>
                      <span className="text-sm font-bold text-white min-w-[48px] text-center bg-gray-800 rounded px-2 py-1">
                        {threeBetMultiplier.toFixed(1)}x
                      </span>
                      <button
                        onClick={() => onThreeBetMultiplierChange(Math.min(5, threeBetMultiplier + 0.1))}
                        className="w-8 h-8 flex items-center justify-center bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M9 5l7 7-7 7"></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* 4-bet множитель */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-300 font-medium">4-bet</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onFourBetMultiplierChange(Math.max(2, fourBetMultiplier - 0.1))}
                        className="w-8 h-8 flex items-center justify-center bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M15 19l-7-7 7-7"></path>
                        </svg>
                      </button>
                      <span className="text-sm font-bold text-white min-w-[48px] text-center bg-gray-800 rounded px-2 py-1">
                        {fourBetMultiplier.toFixed(1)}x
                      </span>
                      <button
                        onClick={() => onFourBetMultiplierChange(Math.min(4, fourBetMultiplier + 0.1))}
                        className="w-8 h-8 flex items-center justify-center bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M9 5l7 7-7 7"></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* 5-bet множитель */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-300 font-medium">5-bet</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onFiveBetMultiplierChange(Math.max(1.5, fiveBetMultiplier - 0.1))}
                        className="w-8 h-8 flex items-center justify-center bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M15 19l-7-7 7-7"></path>
                        </svg>
                      </button>
                      <span className="text-sm font-bold text-white min-w-[48px] text-center bg-gray-800 rounded px-2 py-1">
                        {fiveBetMultiplier.toFixed(1)}x
                      </span>
                      <button
                        onClick={() => onFiveBetMultiplierChange(Math.min(3.5, fiveBetMultiplier + 0.1))}
                        className="w-8 h-8 flex items-center justify-center bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M9 5l7 7-7 7"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Включенные стили игры */}
            <div className="bg-slate-900/50 rounded-lg p-4">
              <h3 className="text-base font-semibold text-white mb-3">Стили игры</h3>
              <p className="text-xs text-gray-400 mb-3">Balanced (Баланс) - базовый стиль, всегда включен</p>
              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled={true}
                    className="w-4 h-4 rounded border-gray-600 text-blue-600 opacity-50 cursor-not-allowed"
                  />
                  <span className="text-sm text-white font-semibold">Balanced (Баланс) - базовый</span>
                </label>
                <div className="border-t border-gray-600 my-2 pt-2">
                  <p className="text-xs text-gray-500 mb-2">Дополнительные стили:</p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabledPlayStyles.tight}
                    onChange={() => handlePlayStyleToggle('tight')}
                    className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Tight (Тайт)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabledPlayStyles.aggressor}
                    onChange={() => handlePlayStyleToggle('aggressor')}
                    className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Aggressor (Агрессор)</span>
                </label>
              </div>
            </div>
            </div>

            {/* Правая колонка */}
            <div className="space-y-4">
            {/* Включенные силы игроков */}
            <div className="bg-slate-900/50 rounded-lg p-4">
              <h3 className="text-base font-semibold text-white mb-3">Силы игроков</h3>
              <p className="text-xs text-gray-400 mb-3">Amateur (Любитель) - базовая сила, всегда включена</p>
              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled={true}
                    className="w-4 h-4 rounded border-gray-600 text-blue-600 opacity-50 cursor-not-allowed"
                  />
                  <span className="text-sm text-white font-semibold">Amateur (Любитель) - базовая</span>
                </label>
                <div className="border-t border-gray-600 my-2 pt-2">
                  <p className="text-xs text-gray-500 mb-2">Дополнительные силы:</p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabledStrengths.fish}
                    onChange={() => handleStrengthToggle('fish')}
                    className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Fish (Фиш)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabledStrengths.regular}
                    onChange={() => handleStrengthToggle('regular')}
                    className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Regular (Регуляр)</span>
                </label>
              </div>
            </div>


            {/* Кнопка сброса настроек */}
            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-white mb-1">
                    Сброс настроек
                  </h4>
                  <p className="text-xs text-gray-400">
                    Сбросить все настройки к значениям по умолчанию
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Вы уверены? Все настройки будут сброшены, и страница перезагрузится.')) {
                      localStorage.removeItem('pokerTableSettings');
                      window.location.reload();
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                >
                  Сбросить
                </button>
              </div>
            </div>
            </div>

            {/* Кнопка закрытия на всю ширину */}
            <div className="col-span-2 flex gap-3 mt-6">
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
            {/* Левая колонка - фильтры и матрица */}
            <div className="space-y-3">
              {/* Переключатель режима конструктора */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg p-2 border border-slate-700">
                <div className="flex gap-2">
                  <button
                    onClick={() => setRangeBuilderMode("opponent")}
                    className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm transition-all ${
                      rangeBuilderMode === "opponent"
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-slate-700/50 text-gray-300 hover:bg-slate-700"
                    }`}
                  >
                    Диапазоны противников
                  </button>
                  <button
                    onClick={() => setRangeBuilderMode("player")}
                    className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm transition-all ${
                      rangeBuilderMode === "player"
                        ? "bg-green-600 text-white shadow-lg"
                        : "bg-slate-700/50 text-gray-300 hover:bg-slate-700"
                    }`}
                  >
                    Диапазон игрока
                  </button>
                </div>
              </div>

              {/* Информация о редактируемом наборе */}
              {editingRangeSet && (
                <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-lg p-2 border border-purple-600/30">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0"></span>
                        <p className="text-xs font-bold text-white truncate">
                          {editingRangeSet.name}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[9px] font-bold bg-purple-600/80 text-white px-1 py-0.5 rounded">
                          {editingRangeSet.table_type}
                        </span>
                        <span className="text-[9px] font-semibold bg-purple-500/70 text-white px-1 py-0.5 rounded">
                          {editingRangeSet.starting_stack}BB
                        </span>
                        <span className="text-[9px] font-semibold bg-purple-500/60 text-white px-1 py-0.5 rounded uppercase">
                          {editingRangeSet.category}
                        </span>
                        {editingRangeSet.bounty && (
                          <span className="text-[9px] font-semibold bg-yellow-600/80 text-white px-1 py-0.5 rounded">
                            PKO
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={cancelEditing}
                      className="text-[10px] bg-red-600/80 hover:bg-red-600 text-white px-2 py-1 rounded flex-shrink-0"
                    >
                      Отменить
                    </button>
                  </div>
                </div>
              )}

              {/* Фильтры внутри диапазона */}
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <h4 className="text-sm font-semibold text-emerald-300 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                  {rangeBuilderMode === "player" ? "Параметры игрока" : "Фильтры диапазона"}
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  {/* Стадия турнира */}
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-gray-400">Стадия турнира</label>
                      <button
                        onClick={() => setShowStageManager(!showStageManager)}
                        className="text-[10px] bg-emerald-600/80 hover:bg-emerald-600 text-white px-2 py-0.5 rounded"
                        title="Добавить или управлять стадиями"
                      >
                        {showStageManager ? "Скрыть" : "Добавить стадию"}
                      </button>
                    </div>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value as Stage)}
                      className="w-full bg-slate-800 text-white text-xs rounded px-2 py-1.5 border border-slate-600"
                    >
                      {customStages.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    {showStageManager && (
                      <div className="mt-2 p-2 bg-slate-800 rounded border border-slate-600 space-y-2">
                        <div className="text-xs font-semibold text-emerald-300 mb-2">Управление стадиями</div>

                        {/* Список стадий */}
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {customStages.map((s, index) => {
                            const isDefault = ["early", "middle", "pre-bubble", "late", "pre-final", "final"].includes(s.id);
                            return (
                              <div key={s.id} className="flex items-center justify-between gap-1 bg-slate-700 p-1.5 rounded">
                                <span className="text-xs text-white flex-1">{s.label}</span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => moveStageUp(s.id)}
                                    disabled={index === 0}
                                    className="text-[10px] bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:text-gray-500 text-white px-1.5 py-0.5 rounded"
                                    title="Вверх"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    onClick={() => moveStageDown(s.id)}
                                    disabled={index === customStages.length - 1}
                                    className="text-[10px] bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:text-gray-500 text-white px-1.5 py-0.5 rounded"
                                    title="Вниз"
                                  >
                                    ▼
                                  </button>
                                  {!isDefault && (
                                    <button
                                      onClick={() => deleteCustomStage(s.id)}
                                      className="text-[10px] bg-red-600/80 hover:bg-red-600 text-white px-1.5 py-0.5 rounded"
                                      title="Удалить"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Добавление новой стадии */}
                        <div className="pt-2 border-t border-slate-600 space-y-1">
                          <div className="text-[10px] text-gray-400">Добавить новую стадию:</div>
                          <input
                            type="text"
                            value={newStageName}
                            onChange={(e) => setNewStageName(e.target.value)}
                            placeholder="Название (напр: Early-Middle)"
                            className="w-full bg-slate-900 text-white text-xs rounded px-2 py-1 border border-slate-600"
                          />
                          <select
                            value={insertAfterStageId}
                            onChange={(e) => setInsertAfterStageId(e.target.value)}
                            className="w-full bg-slate-900 text-white text-xs rounded px-2 py-1 border border-slate-600"
                          >
                            <option value="">В конец списка</option>
                            {customStages.map((s) => (
                              <option key={s.id} value={s.id}>
                                После: {s.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={addCustomStage}
                            className="w-full text-xs bg-emerald-600/80 hover:bg-emerald-600 text-white px-2 py-1 rounded"
                          >
                            Добавить стадию
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

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

                  {/* Против кого - только для режима игрока */}
                  {rangeBuilderMode === "player" && (
                    <>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Против кого</label>
                        <select
                          value={againstStyle}
                          onChange={(e) => setAgainstStyle(e.target.value as PlayStyle)}
                          className="w-full bg-slate-800 text-white text-xs rounded px-2 py-1.5 border border-slate-600"
                        >
                          <option value="tight">Против тайтового</option>
                          <option value="balanced">Против баланса</option>
                          <option value="aggressor">Против агрессора</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Размер стека</label>
                        <select
                          value={stackSize}
                          onChange={(e) => setStackSize(e.target.value as StackSize)}
                          className="w-full bg-slate-800 text-white text-xs rounded px-2 py-1.5 border border-slate-600"
                        >
                          <option value="very_short">Очень маленький (&lt;20 BB)</option>
                          <option value="short">Маленький (20-80 BB)</option>
                          <option value="medium">Средний (80-180 BB)</option>
                          <option value="big">Большой (&gt;180 BB)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Сила игрока - только для противников */}
                  {rangeBuilderMode === "opponent" && (
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
                  )}

                  {/* Стиль игры - только для противников */}
                  {rangeBuilderMode === "opponent" && (
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
                  )}

                  {/* Размер стека - только для противников */}
                  {rangeBuilderMode === "opponent" && (
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
                  )}

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
                  {editingRangeSet ? "Сохранить изменения" : "Сохранить диапазон"}
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

            {/* Правая колонка - фильтры и сохраненные диапазоны */}
            <div className="space-y-3">
              {/* Фильтры для сохраненных наборов (только для режима противников) */}
              {rangeBuilderMode === "opponent" && (
              <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-lg p-3 border border-blue-600/30">
                <h4 className="text-sm font-bold text-blue-300 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  Фильтры наборов
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  {/* Тип стола */}
                  <div className="col-span-2">
                    <label className="text-xs text-gray-300 block mb-1 font-semibold">Тип стола</label>
                    <select
                      value={tableType}
                      onChange={(e) => setTableType(e.target.value as TableType | "")}
                      className="w-full bg-slate-800 text-white text-xs rounded px-2 py-1.5 border border-blue-500/50 font-semibold"
                    >
                      <option value="">Все</option>
                      <option value="6-max">6-Max турнир</option>
                      <option value="8-max">8-Max турнир</option>
                      <option value="cash">Cash игра</option>
                    </select>
                  </div>

                  {/* Начальный стек */}
                  <div>
                    <label className="text-xs text-gray-300 block mb-1 font-semibold">Начальный стек</label>
                    <select
                      value={startingStack}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStartingStack(val === "" ? "" : Number(val) as StartingStack);
                      }}
                      className="w-full bg-slate-800 text-white text-xs rounded px-2 py-1.5 border border-blue-500/50"
                    >
                      <option value="">Все</option>
                      <option value={100}>100 BB</option>
                      <option value={200}>200 BB</option>
                    </select>
                  </div>

                  {/* Категория турнира */}
                  <div>
                    <label className="text-xs text-gray-300 block mb-1 font-semibold">Категория</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category | "")}
                      className="w-full bg-slate-800 text-white text-xs rounded px-2 py-1.5 border border-blue-500/50"
                    >
                      <option value="">Все</option>
                      <option value="micro">Micro</option>
                      <option value="low">Low</option>
                      <option value="mid">Mid</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  {/* Турнир с баунти */}
                  <div className="col-span-2">
                    <label className="text-xs text-gray-300 block mb-1 font-semibold">Баунти</label>
                    <select
                      value={bountyFilter}
                      onChange={(e) => setBountyFilter(e.target.value as "all" | "true" | "false")}
                      className="w-full bg-slate-800 text-white text-xs rounded px-2 py-1.5 border border-blue-500/50"
                    >
                      <option value="all">Все</option>
                      <option value="false">Без баунти</option>
                      <option value="true">С баунти (PKO)</option>
                    </select>
                  </div>
                </div>
              </div>
              )}

              {/* Статус операций */}
              {copyStatus && (
                <div className={`px-3 py-2 rounded text-sm ${
                  copyStatus.includes("Заполните")
                    ? "bg-red-600/20 border border-red-600 text-red-400"
                    : "bg-green-600/20 border border-green-600 text-green-400"
                }`}>
                  {copyStatus}
                </div>
              )}

              {/* Список сохраненных диапазонов из БД */}
              <div className="bg-slate-900/50 rounded-lg p-3 flex-1 overflow-y-auto max-h-[600px]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-white">
                    {rangeBuilderMode === "opponent"
                      ? `Сохраненные наборы (${filteredDbRangeSets.length} / ${dbRangeSets.length})`
                      : `Сохраненные диапазоны (${playerRanges.length})`
                    }
                  </h4>
                  {(rangeBuilderMode === "opponent" ? isLoadingDbRanges : isLoadingPlayerRanges) && (
                    <span className="text-xs text-gray-400">Загрузка...</span>
                  )}
                </div>

                {rangeBuilderMode === "opponent" ? (
                  // Режим противников - показываем наборы диапазонов
                  filteredDbRangeSets.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-8">
                      {isLoadingDbRanges ? "Загрузка диапазонов..." : dbRangeSets.length === 0 ? "Нет сохраненных наборов диапазонов" : "Нет наборов с выбранными фильтрами"}
                    </p>
                  ) : (
                  <div className="space-y-2">
                    {filteredDbRangeSets.map((rangeSet) => (
                      <div
                        key={rangeSet.id}
                        className={`rounded p-3 border transition-all ${
                          editingRangeSet?.id === rangeSet.id
                            ? "bg-yellow-900/30 border-yellow-500/50 shadow-lg shadow-yellow-500/20"
                            : "bg-slate-800/50 border-slate-700"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            {/* Название набора */}
                            <h5 className="text-sm font-bold text-white mb-2">
                              {rangeSet.name}
                            </h5>

                            {/* Параметры набора */}
                            <div className="flex flex-wrap gap-1 mb-2">
                              <span className="text-[10px] font-bold bg-blue-600/80 text-white px-1.5 py-0.5 rounded">
                                {rangeSet.table_type}
                              </span>
                              <span className="text-[10px] font-semibold bg-blue-500/70 text-white px-1.5 py-0.5 rounded">
                                {rangeSet.starting_stack} BB
                              </span>
                              <span className="text-[10px] font-semibold bg-blue-500/60 text-white px-1.5 py-0.5 rounded uppercase">
                                {rangeSet.category}
                              </span>
                              {rangeSet.bounty && (
                                <span className="text-[10px] font-semibold bg-yellow-600/80 text-white px-1.5 py-0.5 rounded">
                                  PKO
                                </span>
                              )}
                            </div>

                            {/* Дата обновления */}
                            <p className="text-[10px] text-gray-500">
                              Обновлено: {new Date(rangeSet.updated_at).toLocaleDateString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>

                          {/* Кнопки действий */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEditingRangeSet(rangeSet)}
                              className="text-[10px] bg-blue-600/80 hover:bg-blue-600 text-white px-2 py-1 rounded"
                            >
                              Редактировать
                            </button>
                            <button
                              onClick={() => setDeleteConfirmation({ id: rangeSet.id, name: rangeSet.name })}
                              className="text-[10px] bg-red-600/80 hover:bg-red-600 text-white px-2 py-1 rounded"
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  )
                ) : (
                  // Режим игрока - показываем наборы диапазонов игрока
                  playerRanges.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-8">
                      {isLoadingPlayerRanges ? "Загрузка диапазонов..." : "Нет сохраненных наборов диапазонов игрока"}
                    </p>
                  ) : (
                  <div className="space-y-2">
                    {playerRanges.map((rangeSet: any) => (
                      <div
                        key={rangeSet.id}
                        className={`rounded p-3 border transition-all ${
                          editingRangeSet?.id === rangeSet.id
                            ? "bg-yellow-900/30 border-yellow-500/50 shadow-lg shadow-yellow-500/20"
                            : "bg-slate-800/50 border-slate-700"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            {/* Название набора */}
                            <h5 className="text-sm font-bold text-white mb-2">
                              {rangeSet.name}
                            </h5>

                            {/* Параметры набора */}
                            <div className="flex flex-wrap gap-1 mb-2">
                              <span className="text-[10px] font-bold bg-purple-600/80 text-white px-1.5 py-0.5 rounded">
                                {rangeSet.table_type}
                              </span>
                              <span className="text-[10px] font-semibold bg-purple-500/70 text-white px-1.5 py-0.5 rounded">
                                {rangeSet.starting_stack} BB
                              </span>
                              <span className="text-[10px] font-semibold bg-purple-500/60 text-white px-1.5 py-0.5 rounded uppercase">
                                {rangeSet.category}
                              </span>
                              {rangeSet.bounty && (
                                <span className="text-[10px] font-semibold bg-yellow-600/80 text-white px-1.5 py-0.5 rounded">
                                  PKO
                                </span>
                              )}
                            </div>

                            {/* Дата обновления */}
                            <p className="text-[10px] text-gray-500">
                              Обновлено: {new Date(rangeSet.updated_at).toLocaleDateString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>

                          {/* Кнопки действий */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEditingPlayerRangeSet(rangeSet)}
                              className="text-[10px] bg-purple-600/80 hover:bg-purple-600 text-white px-2 py-1 rounded"
                            >
                              Редактировать
                            </button>
                            <button
                              onClick={() => setDeletePlayerRangeConfirmation({ id: rangeSet.id })}
                              className="text-[10px] bg-red-600/80 hover:bg-red-600 text-white px-2 py-1 rounded"
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Попап подтверждения удаления
  const deleteConfirmationModal = deleteConfirmation && (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10003]"
      onClick={() => setDeleteConfirmation(null)}
    >
      <div
        className="bg-gradient-to-br from-red-900 to-red-800 border-4 border-red-500 rounded-2xl shadow-2xl p-8 max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-4">
          {/* Иконка предупреждения */}
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-red-900" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Заголовок */}
          <h3 className="text-2xl font-bold text-red-100 text-center">
            Удалить набор?
          </h3>

          {/* Текст подтверждения */}
          <p className="text-base text-red-50 text-center leading-relaxed">
            Вы уверены, что хотите удалить набор<br />
            <span className="font-bold text-white">"{deleteConfirmation.name}"</span>?
          </p>
          <p className="text-sm text-red-200 text-center">
            Это действие нельзя отменить!
          </p>

          {/* Кнопки */}
          <div className="flex gap-3 w-full mt-4">
            <button
              onClick={() => setDeleteConfirmation(null)}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold text-lg px-6 py-4 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Отмена
            </button>
            <button
              onClick={confirmDeleteDbRangeSet}
              className="flex-1 bg-red-500 hover:bg-red-400 text-white font-bold text-lg px-6 py-4 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Попап подтверждения удаления player range
  const deletePlayerRangeModal = deletePlayerRangeConfirmation && (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10003]"
      onClick={() => setDeletePlayerRangeConfirmation(null)}
    >
      <div
        className="bg-gradient-to-br from-red-900 to-red-800 border-4 border-red-500 rounded-2xl shadow-2xl p-8 max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-4">
          {/* Иконка предупреждения */}
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-red-900" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Заголовок */}
          <h3 className="text-2xl font-bold text-red-100 text-center">
            Удалить диапазон?
          </h3>

          {/* Текст подтверждения */}
          <p className="text-base text-red-50 text-center leading-relaxed">
            Вы уверены, что хотите удалить этот диапазон игрока?
          </p>
          <p className="text-sm text-red-200 text-center">
            Это действие нельзя отменить!
          </p>

          {/* Кнопки */}
          <div className="flex gap-3 w-full mt-4">
            <button
              onClick={() => setDeletePlayerRangeConfirmation(null)}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold text-lg px-6 py-4 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Отмена
            </button>
            <button
              onClick={confirmDeletePlayerRange}
              className="flex-1 bg-red-500 hover:bg-red-400 text-white font-bold text-lg px-6 py-4 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Диалог сохранения нового набора в БД
  const saveDialogModal = showSaveDialog && (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10003]"
      onClick={() => {
        setShowSaveDialog(false);
        setNewSetName("");
        setFillEmptyRanges(null);
        setSaveTableType("");
        setSaveStartingStack("");
        setSaveCategory("");
        setSaveBounty(false);
      }}
    >
      <div
        className="bg-gradient-to-br from-blue-900 to-blue-800 border-4 border-blue-500 rounded-2xl shadow-2xl p-8 max-w-lg mx-4 w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-4">
          {/* Иконка */}
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-12 h-12 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
            </svg>
          </div>

          {/* Заголовок */}
          <h3 className="text-2xl font-bold text-blue-100 text-center">
            Сохранение набора диапазонов
          </h3>

          {/* Поле ввода названия */}
          <div>
            <label className="text-sm font-semibold text-blue-100 block mb-2">
              Название набора *
            </label>
            <input
              type="text"
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              placeholder="Например: Мои агрессивные диапазоны"
              className="w-full bg-blue-950/50 text-white border-2 border-blue-500/50 rounded-lg px-4 py-3 text-base focus:outline-none focus:border-blue-400"
              autoFocus
            />
          </div>

          {/* Параметры набора */}
          <div className="bg-blue-950/50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-blue-200 mb-3">Параметры набора *</p>

            <div className="grid grid-cols-2 gap-3">
              {/* Тип стола */}
              <div className="col-span-2">
                <label className="text-xs text-blue-200 block mb-1">Тип стола</label>
                <select
                  value={saveTableType}
                  onChange={(e) => setSaveTableType(e.target.value as TableType | "")}
                  className="w-full bg-blue-900/50 text-white text-sm rounded px-3 py-2 border border-blue-500/50"
                >
                  <option value="">Выберите тип стола</option>
                  <option value="6-max">6-Max турнир</option>
                  <option value="8-max">8-Max турнир</option>
                  <option value="cash">Cash игра</option>
                </select>
              </div>

              {/* Начальный стек */}
              <div>
                <label className="text-xs text-blue-200 block mb-1">Начальный стек</label>
                <select
                  value={saveStartingStack}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSaveStartingStack(val === "" ? "" : Number(val) as StartingStack);
                  }}
                  className="w-full bg-blue-900/50 text-white text-sm rounded px-3 py-2 border border-blue-500/50"
                >
                  <option value="">Выберите</option>
                  <option value={100}>100 BB</option>
                  <option value={200}>200 BB</option>
                </select>
              </div>

              {/* Категория */}
              <div>
                <label className="text-xs text-blue-200 block mb-1">Категория</label>
                <select
                  value={saveCategory}
                  onChange={(e) => setSaveCategory(e.target.value as Category | "")}
                  className="w-full bg-blue-900/50 text-white text-sm rounded px-3 py-2 border border-blue-500/50"
                >
                  <option value="">Выберите</option>
                  <option value="micro">Micro</option>
                  <option value="low">Low</option>
                  <option value="mid">Mid</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Баунти */}
              {saveTableType !== "cash" && saveTableType !== "" && (
                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveBounty}
                      onChange={(e) => setSaveBounty(e.target.checked)}
                      className="w-4 h-4 rounded border-blue-500/50 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-blue-200">Турнир с баунти (PKO)</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Выбор действия с пустыми диапазонами */}
          <div>
            <label className="text-sm font-semibold text-blue-100 block mb-2">
              Что делать с незаполненными диапазонами? *
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 bg-blue-950/50 p-3 rounded-lg cursor-pointer hover:bg-blue-950/70 transition-colors">
                <input
                  type="radio"
                  name="fillEmpty"
                  checked={fillEmptyRanges === "empty"}
                  onChange={() => setFillEmptyRanges("empty")}
                  className="w-5 h-5 text-blue-500"
                />
                <div>
                  <p className="text-sm font-semibold text-white">Оставить пустыми</p>
                  <p className="text-xs text-blue-300">Незаполненные позиции/действия останутся пустыми</p>
                </div>
              </label>
              <label className="flex items-center gap-3 bg-blue-950/50 p-3 rounded-lg cursor-pointer hover:bg-blue-950/70 transition-colors">
                <input
                  type="radio"
                  name="fillEmpty"
                  checked={fillEmptyRanges === "default"}
                  onChange={() => setFillEmptyRanges("default")}
                  className="w-5 h-5 text-blue-500"
                />
                <div>
                  <p className="text-sm font-semibold text-white">Загрузить дефолтные</p>
                  <p className="text-xs text-blue-300">Заполнить из стандартных диапазонов (если доступны)</p>
                </div>
              </label>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => {
                setShowSaveDialog(false);
                setNewSetName("");
                setFillEmptyRanges(null);
                setSaveTableType("");
                setSaveStartingStack("");
                setSaveCategory("");
                setSaveBounty(false);
              }}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold text-lg px-6 py-4 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Отмена
            </button>
            <button
              onClick={finalizeAndSaveToDb}
              disabled={!newSetName.trim() || !saveTableType || !saveStartingStack || !saveCategory || fillEmptyRanges === null}
              className={`flex-1 font-bold text-lg px-6 py-4 rounded-xl shadow-lg transition-all duration-200 ${
                !newSetName.trim() || !saveTableType || !saveStartingStack || !saveCategory || fillEmptyRanges === null
                  ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-400 text-white hover:scale-105 active:scale-95"
              }`}
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(modalContent, document.body)}
      {warningModal && createPortal(warningModal, document.body)}
      {deleteConfirmationModal && createPortal(deleteConfirmationModal, document.body)}
      {deletePlayerRangeModal && createPortal(deletePlayerRangeModal, document.body)}
      {saveDialogModal && createPortal(saveDialogModal, document.body)}
    </>
  );
}
