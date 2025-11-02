import { StackSize } from "@/lib/redux/slices/tableSlice";
import { getStackSizeConfig } from "@/lib/utils/stackSize";

interface PlayerStackSizeProps {
  stackSize: StackSize;
  onToggle: () => void; // Функция для переключения размера стека
}

export default function PlayerStackSize({
  stackSize,
  onToggle,
}: PlayerStackSizeProps) {
  const config = getStackSizeConfig(stackSize);

  return (
    <div
      onClick={onToggle}
      className={`${config.bgColor} ${config.textColor} px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg whitespace-nowrap cursor-pointer hover:scale-105 transition-all duration-150 active:scale-95 border border-white/20`}
      title={`${config.description} стек. Кликните для изменения`}
    >
      {config.label}
    </div>
  );
}
