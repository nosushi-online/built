import type { RoomTable, TableShape } from "@/backend";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { TableShapeView } from "./TableShapeView";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  MAX_TABLE_SIZE,
  MIN_TABLE_SIZE,
} from "./tableStyles";

export interface CanvasPosition {
  x: number;
  y: number;
}

/**
 * The room canvas. Tables are absolutely positioned in a fixed coordinate
 * space and dragged with pointer events, so it works with mouse and touch.
 */
export function FloorCanvas({
  tables,
  selectedId,
  onSelect,
  onMove,
  onMoveEnd,
  zoom,
}: {
  tables: RoomTable[];
  selectedId: bigint | null;
  onSelect: (id: bigint) => void;
  onMove: (id: bigint, position: CanvasPosition) => void;
  onMoveEnd: (id: bigint, position: CanvasPosition) => void;
  zoom: number;
}) {
  const dragRef = useRef<{
    id: bigint;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const clamp = (value: number, size: number, max: number) =>
    Math.max(0, Math.min(max - size, value));

  const handlePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    table: RoomTable,
  ) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id: table.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: Number(table.position.x),
      originY: Number(table.position.y),
      moved: false,
    };
    onSelect(table.id);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = (event.clientX - drag.startX) / zoom;
    const dy = (event.clientY - drag.startY) / zoom;
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2 && !drag.moved) return;
    drag.moved = true;
    const table = tables.find((entry) => entry.id === drag.id);
    if (!table) return;
    const width = Number(table.position.width);
    const height = Number(table.position.height);
    onMove(drag.id, {
      x: clamp(drag.originX + dx, width, CANVAS_WIDTH),
      y: clamp(drag.originY + dy, height, CANVAS_HEIGHT),
    });
  };

  const handlePointerUp = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || !drag.moved) return;
    const table = tables.find((entry) => entry.id === drag.id);
    if (!table) return;
    onMoveEnd(drag.id, {
      x: Number(table.position.x),
      y: Number(table.position.y),
    });
  };

  return (
    <div
      data-ocid="editor.canvas"
      className="relative overflow-auto rounded-xl border border-border bg-[repeating-linear-gradient(0deg,oklch(var(--border)/0.35)_0_1px,transparent_1px_40px),repeating-linear-gradient(90deg,oklch(var(--border)/0.35)_0_1px,transparent_1px_40px)] bg-background"
    >
      <div
        className="relative"
        style={{
          width: CANVAS_WIDTH * zoom,
          height: CANVAS_HEIGHT * zoom,
        }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `scale(${zoom})`,
          }}
        >
          {tables.map((table) => {
            const width = Math.max(
              MIN_TABLE_SIZE,
              Math.min(MAX_TABLE_SIZE, Number(table.position.width)),
            );
            const height = Math.max(
              MIN_TABLE_SIZE,
              Math.min(MAX_TABLE_SIZE, Number(table.position.height)),
            );
            const selected = table.id === selectedId;
            return (
              <button
                key={table.id.toString()}
                type="button"
                data-ocid={`editor.canvas.table.${table.name}`}
                aria-label={table.name}
                aria-pressed={selected}
                onPointerDown={(event) => handlePointerDown(event, table)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className={cn(
                  "absolute cursor-grab touch-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing",
                  selected && "z-10",
                )}
                style={{
                  left: Number(table.position.x),
                  top: Number(table.position.y),
                }}
              >
                <TableShapeView
                  name={table.name}
                  seats={Number(table.maxSeats)}
                  shape={table.position.shape as TableShape}
                  width={width}
                  height={height}
                  rotation={Number(table.position.rotation)}
                  className={cn(
                    "bg-card text-foreground",
                    selected
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-primary/50",
                    !table.active && "opacity-50",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
