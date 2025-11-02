import { PlayerPlayStyle as PlayStyleType } from "@/lib/redux/slices/tableSlice";
import { getPlayStyleConfig } from "@/lib/utils/playerPlayStyle";

interface PlayerPlayStyleProps {
  playStyle: PlayStyleType;
  onToggle: () => void; // Функция для переключения стиля
}

export default function PlayerPlayStyle({
  playStyle,
  onToggle,
}: PlayerPlayStyleProps) {
  const config = getPlayStyleConfig(playStyle);

  // Индикатор всегда слева от игрока
  const position = {
    left: "-80px", // Смещение влево от игрока
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
        title="Кликните для изменения стиля игры"
      >
        {config.label}
      </div>
    </div>
  );
}
