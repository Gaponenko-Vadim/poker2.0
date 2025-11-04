"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

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

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10001]">
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 shadow-2xl min-w-[350px] max-w-[450px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Настройки игрока</h3>
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

        <div className="mb-6">
          <p className="text-sm text-gray-300 mb-4">
            Игрок: <span className="font-bold text-white">{playerName}</span>
          </p>
        </div>

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
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
