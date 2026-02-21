import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

interface DPadProps {
  onDirection: (dir: Direction) => void;
  disabled?: boolean;
}

const DPad = ({ onDirection, disabled }: DPadProps) => {
  const handle = (dir: Direction) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!disabled) {
      if (navigator.vibrate) navigator.vibrate(15);
      onDirection(dir);
    }
  };

  const base =
    "absolute flex items-center justify-center text-foreground transition-colors touch-manipulation select-none";
  const active = disabled
    ? "opacity-30 bg-card"
    : "bg-card active:bg-primary active:text-primary-foreground";

  // Diamond layout: a rotated square where each triangle-quarter is a button
  // We use clip-path trapezoids to carve each direction
  const size = "100%";

  return (
    <div
      className="relative w-full"
      style={{ aspectRatio: "1 / 1", maxWidth: 220, touchAction: "none" }}
    >
      {/* UP */}
      <button
        className={`${base} ${active}`}
        style={{
          inset: 0,
          clipPath: "polygon(50% 50%, 0% 0%, 100% 0%)",
          borderRadius: "8px 8px 0 0",
        }}
        onTouchStart={handle("UP")}
        onMouseDown={handle("UP")}
        aria-label="Up"
      >
        <ChevronUp size={28} style={{ marginTop: "-20%" }} />
      </button>

      {/* DOWN */}
      <button
        className={`${base} ${active}`}
        style={{
          inset: 0,
          clipPath: "polygon(50% 50%, 0% 100%, 100% 100%)",
          borderRadius: "0 0 8px 8px",
        }}
        onTouchStart={handle("DOWN")}
        onMouseDown={handle("DOWN")}
        aria-label="Down"
      >
        <ChevronDown size={28} style={{ marginTop: "20%" }} />
      </button>

      {/* LEFT */}
      <button
        className={`${base} ${active}`}
        style={{
          inset: 0,
          clipPath: "polygon(50% 50%, 0% 0%, 0% 100%)",
          borderRadius: "8px 0 0 8px",
        }}
        onTouchStart={handle("LEFT")}
        onMouseDown={handle("LEFT")}
        aria-label="Left"
      >
        <ChevronLeft size={28} style={{ marginLeft: "-20%" }} />
      </button>

      {/* RIGHT */}
      <button
        className={`${base} ${active}`}
        style={{
          inset: 0,
          clipPath: "polygon(50% 50%, 100% 0%, 100% 100%)",
          borderRadius: "0 8px 8px 0",
        }}
        onTouchStart={handle("RIGHT")}
        onMouseDown={handle("RIGHT")}
        aria-label="Right"
      >
        <ChevronRight size={28} style={{ marginLeft: "20%" }} />
      </button>

      {/* Center divider lines */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: 0,
          background:
            "linear-gradient(45deg, transparent calc(50% - 1px), hsl(var(--border)) calc(50% - 1px), hsl(var(--border)) calc(50% + 1px), transparent calc(50% + 1px)), linear-gradient(-45deg, transparent calc(50% - 1px), hsl(var(--border)) calc(50% - 1px), hsl(var(--border)) calc(50% + 1px), transparent calc(50% + 1px))",
          borderRadius: 8,
        }}
      />

      {/* Outer border */}
      <div
        className="absolute pointer-events-none border-2 border-border rounded-lg"
        style={{ inset: 0 }}
      />
    </div>
  );
};

export default DPad;
