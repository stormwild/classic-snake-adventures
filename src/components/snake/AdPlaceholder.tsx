interface AdPlaceholderProps {
  variant: "rectangle" | "square";
}

const AdPlaceholder = ({ variant }: AdPlaceholderProps) => {
  return (
    <div
      className="flex items-center justify-center border-2 border-dashed border-border rounded-sm bg-card/50 text-muted-foreground text-[10px] tracking-wider"
      style={{
        width: variant === "rectangle" ? 150 : 120,
        height: variant === "rectangle" ? 100 : 120,
      }}
    >
      AD
    </div>
  );
};

export default AdPlaceholder;
