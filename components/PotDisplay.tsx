"use client";

import { useState, useRef, useEffect } from "react";

interface PotDisplayProps {
  pot: number; // Размер банка в BB
}

export default function PotDisplay({ pot }: PotDisplayProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const potRef = useRef<HTMLDivElement>(null);

  // Инициализация позиции (bottom-right)
  useEffect(() => {
    if (potRef.current && position.x === 0 && position.y === 0) {
      const parent = potRef.current.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        const potRect = potRef.current.getBoundingClientRect();
        setPosition({
          x: parentRect.width - potRect.width - 100, // 16px от правого края
          y: parentRect.height - potRect.height - 100, // 16px от нижнего края
        });
      }
    }
  }, [position.x, position.y]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Ограничиваем перемещение в пределах родительского контейнера
      if (potRef.current && potRef.current.parentElement) {
        const parent = potRef.current.parentElement;
        const parentRect = parent.getBoundingClientRect();
        const potRect = potRef.current.getBoundingClientRect();

        const maxX = parentRect.width - potRect.width;
        const maxY = parentRect.height - potRect.height;

        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  return (
    <div
      ref={potRef}
      className={`absolute bg-gradient-to-br from-yellow-600 to-yellow-700 border-2 border-yellow-400 rounded-xl px-6 py-3 shadow-2xl ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      } select-none transition-shadow hover:shadow-yellow-500/50`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="text-center pointer-events-none">
        <p className="text-xs font-semibold text-yellow-100 mb-1 uppercase tracking-wide">
          Банк
        </p>
        <p className="text-3xl font-bold text-white drop-shadow-lg">
          {pot.toFixed(1)} <span className="text-xl">BB</span>
        </p>
      </div>
    </div>
  );
}
