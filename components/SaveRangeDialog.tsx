"use client";

import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { TournamentCategory } from "@/lib/redux/slices/tableSlice";
import { UserRangeSet, TableType } from "@/lib/types/userRanges";

interface SaveRangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rangeSetId: number | null, name: string) => Promise<void>;
  tableType: TableType;
  category: TournamentCategory;
  startingStack: number;
  bounty: boolean;
}

export default function SaveRangeDialog({
  isOpen,
  onClose,
  onSave,
  tableType,
  category,
  startingStack,
  bounty,
}: SaveRangeDialogProps) {
  const [step, setStep] = useState<"confirm" | "loading" | "choose" | "create">("confirm");
  const [existingSets, setExistingSets] = useState<UserRangeSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<number | null>(null);
  const [newSetName, setNewSetName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загружаем существующие наборы при открытии
  useEffect(() => {
    if (isOpen && step === "loading") {
      loadExistingSets();
    }
  }, [isOpen, step]);

  const loadExistingSets = async () => {
    try {
      const params = new URLSearchParams({
        tableType,
        category,
        startingStack: startingStack.toString(),
        bounty: bounty.toString(),
      });

      const response = await fetch(`/api/user-ranges/get?${params}`);
      const data = await response.json();

      if (data.success && data.data) {
        setExistingSets(data.data);
        if (data.data.length > 0) {
          setStep("choose");
        } else {
          setStep("create");
        }
      } else {
        setStep("create");
      }
    } catch (err) {
      console.error("Error loading existing sets:", err);
      setStep("create");
    }
  };

  const handleConfirmSave = () => {
    setStep("loading");
  };

  const handleCreateNew = () => {
    setSelectedSetId(null);
    setNewSetName("");
    setStep("create");
  };

  const handleSelectExisting = (id: number) => {
    setSelectedSetId(id);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      if (selectedSetId) {
        // Обновляем существующий набор
        await onSave(selectedSetId, "");
      } else {
        // Создаем новый набор
        if (!newSetName.trim()) {
          setError("Введите название набора");
          setIsSaving(false);
          return;
        }
        await onSave(null, newSetName.trim());
      }
      onClose();
    } catch (err) {
      setError("Ошибка при сохранении");
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setStep("confirm");
    setSelectedSetId(null);
    setNewSetName("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const dialogContent = (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && handleCancel()}
    >
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl p-6 max-w-md w-full">
        {/* Этап 1: Подтверждение сохранения */}
        {step === "confirm" && (
          <>
            <h3 className="text-lg font-bold text-white mb-4">Сохранить изменения?</h3>
            <p className="text-sm text-gray-300 mb-6">
              Вы хотите сохранить измененный диапазон в базу данных?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded text-sm font-semibold transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm font-semibold transition-colors"
              >
                Сохранить
              </button>
            </div>
          </>
        )}

        {/* Этап 2: Загрузка */}
        {step === "loading" && (
          <>
            <h3 className="text-lg font-bold text-white mb-4">Загрузка...</h3>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          </>
        )}

        {/* Этап 3: Выбор существующего или создание нового */}
        {step === "choose" && (
          <>
            <h3 className="text-lg font-bold text-white mb-4">Выберите набор</h3>
            <p className="text-sm text-gray-300 mb-4">
              Обновить существующий набор или создать новый?
            </p>

            {/* Список существующих наборов */}
            <div className="mb-4 max-h-48 overflow-y-auto space-y-2">
              {existingSets.map((set) => (
                <button
                  key={set.id}
                  onClick={() => handleSelectExisting(set.id)}
                  className={`w-full text-left p-3 rounded border-2 transition-colors ${
                    selectedSetId === set.id
                      ? "bg-blue-600/20 border-blue-500 text-white"
                      : "bg-slate-800 border-slate-600 text-gray-300 hover:border-slate-500"
                  }`}
                >
                  <div className="font-semibold text-sm">{set.name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Обновлен: {new Date(set.updatedAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleCreateNew}
              className="w-full mb-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded text-sm font-semibold transition-colors"
            >
              + Создать новый набор
            </button>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded text-sm font-semibold transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={!selectedSetId || isSaving}
                className={`flex-1 py-2 px-4 rounded text-sm font-semibold transition-colors ${
                  selectedSetId && !isSaving
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isSaving ? "Сохранение..." : "Обновить"}
              </button>
            </div>
          </>
        )}

        {/* Этап 4: Создание нового набора */}
        {step === "create" && (
          <>
            <h3 className="text-lg font-bold text-white mb-4">Новый набор диапазонов</h3>
            <p className="text-sm text-gray-300 mb-4">Введите название для нового набора:</p>

            <input
              type="text"
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              placeholder="Например: Мои агрессивные диапазоны"
              className="w-full mb-4 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              autoFocus
            />

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={existingSets.length > 0 ? () => setStep("choose") : handleCancel}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded text-sm font-semibold transition-colors"
              >
                {existingSets.length > 0 ? "Назад" : "Отмена"}
              </button>
              <button
                onClick={handleSave}
                disabled={!newSetName.trim() || isSaving}
                className={`flex-1 py-2 px-4 rounded text-sm font-semibold transition-colors ${
                  newSetName.trim() && !isSaving
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isSaving ? "Создание..." : "Создать"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
