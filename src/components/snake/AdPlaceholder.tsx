interface AdPlaceholderProps {
  variant: "vertical" | "square";
}

const AdPlaceholder = ({ variant }: AdPlaceholderProps) => {
  const isVertical = variant === "vertical";

  return (
    <div
      className="flex items-center justify-center border-2 border-dashed border-border rounded-sm bg-card/50 text-muted-foreground text-[10px] tracking-wider"
      style={{
        width: isVertical ? 160 : 300,
        height: isVertical ? 600 : 250,
        maxHeight: "100%",
      }}
    >
      AD SPACE
    </div>
  );
};

export default AdPlaceholder;
