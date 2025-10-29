import { PlayerStrength as StrengthType } from "@/lib/redux/slices/tableSlice";
import { getStrengthConfig } from "@/lib/utils/playerStrength";

interface PlayerStrengthProps {
  strength: StrengthType;
  onToggle: () => void; // Функция для переключения силы
}

export default function PlayerStrength({
  strength,
  onToggle,
}: PlayerStrengthProps) {
  const config = getStrengthConfig(strength);

  // Индикатор всегда справа от игрока
  const position = {
    right: "-120px", // Смещение вправо от игрока
    top: "50%",
    transform: "translateY(-50%)",
  };

  return (
    <div
      className="absolute z-10 pointer-events-auto"
      style={position}
    >
      <div
        onClick={onToggle}
        className={`${config.bgColor} ${config.textColor} px-3 py-1 rounded-full text-xs font-semibold shadow-lg whitespace-nowrap cursor-pointer hover:scale-105 transition-transform duration-150 active:scale-95`}
        title="Кликните для изменения силы игрока"
      >
        {config.label}
      </div>
    </div>
  );
}
