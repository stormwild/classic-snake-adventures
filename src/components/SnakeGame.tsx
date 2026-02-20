import { useState, useEffect, useCallback, useRef } from "react";
import { playEatSound, playWallHitSound, playSelfHitSound, startEngine, updateEngine, stopEngine } from "./snake/sounds";

const GRID_SIZE = 20;
const CELL_SIZE = 22;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 3;

type Position = { x: number; y: number };
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

const getRandomFood = (snake: Position[]): Position => {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  return pos;
};

const SnakeGame = () => {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("snake-high-score");
    return saved ? parseInt(saved) : 0;
  });
  const [started, setStarted] = useState(false);
  const dirRef = useRef<Direction>("RIGHT");
  const nextDirRef = useRef<Direction>("RIGHT");

  const reset = useCallback(() => {
    const initial = [{ x: 10, y: 10 }];
    setSnake(initial);
    setFood(getRandomFood(initial));
    setDirection("RIGHT");
    dirRef.current = "RIGHT";
    nextDirRef.current = "RIGHT";
    setGameOver(false);
    setScore(0);
    setStarted(true);
    startEngine();
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (!started || gameOver) {
        if (e.key === " " || e.key === "Enter") reset();
        return;
      }

      const cur = dirRef.current;
      const map: Record<string, Direction> = {
        ArrowUp: "UP", w: "UP", W: "UP",
        ArrowDown: "DOWN", s: "DOWN", S: "DOWN",
        ArrowLeft: "LEFT", a: "LEFT", A: "LEFT",
        ArrowRight: "RIGHT", d: "RIGHT", D: "RIGHT",
      };

      const next = map[e.key];
      if (!next) return;

      const opposites: Record<Direction, Direction> = {
        UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT",
      };
      if (opposites[next] !== cur) {
        nextDirRef.current = next;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [started, gameOver, reset]);

  // Game loop
  useEffect(() => {
    if (!started || gameOver) return;

    updateEngine(score);
    const speed = Math.max(60, INITIAL_SPEED - score * SPEED_INCREMENT);
    const interval = setInterval(() => {
      dirRef.current = nextDirRef.current;
      setDirection(nextDirRef.current);

      setSnake((prev) => {
        const head = { ...prev[0] };
        const dir = dirRef.current;
        if (dir === "UP") head.y -= 1;
        if (dir === "DOWN") head.y += 1;
        if (dir === "LEFT") head.x -= 1;
        if (dir === "RIGHT") head.x += 1;

        // Wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          playWallHitSound();
          stopEngine();
          setGameOver(true);
          return prev;
        }

        // Self collision
        if (prev.some((s) => s.x === head.x && s.y === head.y)) {
          playSelfHitSound();
          stopEngine();
          setGameOver(true);
          return prev;
        }

        const newSnake = [head, ...prev];

        // Eat food
        if (head.x === food.x && head.y === food.y) {
          playEatSound();
          setScore((s) => {
            const ns = s + 1;
            setHighScore((h) => {
              const nh = Math.max(h, ns);
              localStorage.setItem("snake-high-score", String(nh));
              return nh;
            });
            return ns;
          });
          setFood(getRandomFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [started, gameOver, food, score]);

  // Touch controls
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const cur = dirRef.current;
    const opposites: Record<Direction, Direction> = {
      UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT",
    };

    let next: Direction;
    if (Math.abs(dx) > Math.abs(dy)) {
      next = dx > 0 ? "RIGHT" : "LEFT";
    } else {
      next = dy > 0 ? "DOWN" : "UP";
    }
    if (opposites[next] !== cur) nextDirRef.current = next;
    touchStart.current = null;
  };

const boardPx = GRID_SIZE * CELL_SIZE;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const maxW = window.innerWidth - 32;
      const maxH = window.innerHeight - 160;
      const s = Math.min(maxW / boardPx, maxH / boardPx, 1);
      setScale(s);
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [boardPx]);

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 select-none">
      <h1
        className="text-base sm:text-2xl text-foreground tracking-wider"
        style={{ textShadow: "var(--neon-glow)" }}
      >
        SNAKE
      </h1>

      <div className="flex gap-8 text-[10px] sm:text-xs text-muted-foreground">
        <span>SCORE: <span className="text-foreground">{score}</span></span>
        <span>BEST: <span className="text-accent" style={{ textShadow: "var(--neon-glow-accent)" }}>{highScore}</span></span>
      </div>

      <div
        ref={containerRef}
        className="relative border-2 border-border rounded-sm origin-top"
        style={{
          width: boardPx,
          height: boardPx,
          transform: `scale(${scale})`,
          boxShadow: "var(--neon-glow)",
          background: "hsl(var(--card))",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Grid dots */}
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const x = i % GRID_SIZE;
          const y = Math.floor(i / GRID_SIZE);
          return (
            <div
              key={i}
              className="absolute rounded-full bg-muted"
              style={{
                width: 2,
                height: 2,
                left: x * CELL_SIZE + CELL_SIZE / 2 - 1,
                top: y * CELL_SIZE + CELL_SIZE / 2 - 1,
                opacity: 0.3,
              }}
            />
          );
        })}

        {/* Food */}
        <div
          className="absolute rounded-sm bg-accent"
          style={{
            width: CELL_SIZE - 2,
            height: CELL_SIZE - 2,
            left: food.x * CELL_SIZE + 1,
            top: food.y * CELL_SIZE + 1,
            boxShadow: "var(--neon-glow-accent)",
            transition: "left 0.05s, top 0.05s",
          }}
        />

        {/* Snake */}
        {snake.map((seg, i) => (
          <div
            key={i}
            className="absolute rounded-sm"
            style={{
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
              left: seg.x * CELL_SIZE + 1,
              top: seg.y * CELL_SIZE + 1,
              background: i === 0
                ? "hsl(var(--primary))"
                : `hsl(120 80% ${55 - (i / snake.length) * 20}%)`,
              boxShadow: i === 0 ? "var(--neon-glow)" : "none",
            }}
          />
        ))}

        {/* Overlay */}
        {(!started || gameOver) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-sm gap-4">
            {gameOver && (
              <p className="text-destructive text-sm" style={{ textShadow: "0 0 10px hsl(0 85% 55% / 0.5)" }}>
                GAME OVER
              </p>
            )}
            <button
              onClick={reset}
              className="text-xs text-foreground border border-border px-4 py-2 rounded-sm hover:bg-primary hover:text-primary-foreground transition-colors"
              style={{ boxShadow: "var(--neon-glow)" }}
            >
              {gameOver ? "PLAY AGAIN" : "START"}
            </button>
            <p className="text-[10px] text-muted-foreground mt-2">
              WASD / ARROWS / SWIPE
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SnakeGame;
