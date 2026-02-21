import SnakeGame from "@/components/SnakeGame";
import AdPlaceholder from "@/components/snake/AdPlaceholder";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-1 sm:p-4">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
        <SnakeGame />
        {/* Desktop: vertical ad on the right; Mobile: square ad below board */}
        <div className="shrink-0">
          <AdPlaceholder variant={isMobile ? "square" : "vertical"} />
        </div>
      </div>
    </div>
  );
};

export default Index;
