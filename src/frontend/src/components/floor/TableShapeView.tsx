import { TableShape } from "@/backend";
import { cn } from "@/lib/utils";

/**
 * A single table drawn on a floor canvas. Purely presentational: the parent
 * decides position, status colours and interaction.
 */
export function TableShapeView({
  name,
  seats,
  shape,
  width,
  height,
  rotation,
  className,
  children,
  style,
}: {
  name: string;
  seats?: number;
  shape: TableShape;
  width: number;
  height: number;
  rotation?: number;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const radius =
    shape === TableShape.round
      ? "rounded-full"
      : shape === TableShape.square
        ? "rounded-xl"
        : "rounded-lg";

  return (
    <div
      className={cn(
        "flex select-none flex-col items-center justify-center gap-0.5 border-2 text-center shadow-subtle transition-smooth",
        radius,
        className,
      )}
      style={{
        width,
        height,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        ...style,
      }}
    >
      <span className="max-w-full truncate px-1 text-xs font-semibold leading-tight">
        {name}
      </span>
      {seats !== undefined && (
        <span className="text-[10px] font-medium opacity-70">{seats}</span>
      )}
      {children}
    </div>
  );
}
