import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

interface DPadProps {
  onDirection: (dir: Direction) => void;
  disabled?: boolean;
}

const DPad = ({ onDirection, disabled }: DPadProps) => {
  const btn =
    "flex items-center justify-center w-12 h-12 rounded-sm border border-border bg-card text-foreground active:bg-primary active:text-primary-foreground transition-colors touch-manipulation";

  const handle = (dir: Direction) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!disabled) onDirection(dir);
  };

  return (
    <div className="grid grid-cols-3 gap-1 w-[156px]" style={{ touchAction: "none" }}>
      <div />
      <button className={btn} onTouchStart={handle("UP")} onMouseDown={handle("UP")} aria-label="Up">
        <ChevronUp size={24} />
      </button>
      <div />
      <button className={btn} onTouchStart={handle("LEFT")} onMouseDown={handle("LEFT")} aria-label="Left">
        <ChevronLeft size={24} />
      </button>
      <div />
      <button className={btn} onTouchStart={handle("RIGHT")} onMouseDown={handle("RIGHT")} aria-label="Right">
        <ChevronRight size={24} />
      </button>
      <div />
      <button className={btn} onTouchStart={handle("DOWN")} onMouseDown={handle("DOWN")} aria-label="Down">
        <ChevronDown size={24} />
      </button>
      <div />
    </div>
  );
};

export default DPad;
