import { TableShape, TableStatus } from "@/backend";

/**
 * One place decides how a table looks for a given status, so the live floor,
 * the legend and the editor preview never drift apart.
 */
export interface StatusStyle {
  /** Solid fill for the table body. */
  fill: string;
  /** Border colour. */
  border: string;
  /** Text colour on the fill. */
  text: string;
  /** Small dot used in the legend and the arrivals list. */
  dot: string;
  /** Soft chip background for lists. */
  chip: string;
  labelKey:
    | "floor.status.free"
    | "floor.status.booked"
    | "floor.status.seated"
    | "floor.status.finished";
}

export const STATUS_STYLES: Record<TableStatus, StatusStyle> = {
  [TableStatus.free]: {
    fill: "bg-card",
    border: "border-border",
    text: "text-foreground",
    dot: "bg-muted-foreground/40",
    chip: "bg-muted text-muted-foreground",
    labelKey: "floor.status.free",
  },
  [TableStatus.booked]: {
    fill: "bg-accent/25",
    border: "border-accent",
    text: "text-accent-foreground",
    dot: "bg-accent",
    chip: "bg-accent/20 text-accent-foreground",
    labelKey: "floor.status.booked",
  },
  [TableStatus.seated]: {
    fill: "bg-primary",
    border: "border-primary",
    text: "text-primary-foreground",
    dot: "bg-primary",
    chip: "bg-primary/12 text-primary",
    labelKey: "floor.status.seated",
  },
  [TableStatus.finished]: {
    fill: "bg-secondary",
    border: "border-border",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground/50",
    chip: "bg-secondary text-secondary-foreground",
    labelKey: "floor.status.finished",
  },
};

export const STATUS_ORDER: TableStatus[] = [
  TableStatus.free,
  TableStatus.booked,
  TableStatus.seated,
  TableStatus.finished,
];

/** Rounded corners per shape, used by both the canvas and the editor. */
export function shapeRadius(shape: TableShape): string {
  switch (shape) {
    case TableShape.round:
      return "rounded-full";
    case TableShape.square:
      return "rounded-xl";
    case TableShape.rectangle:
      return "rounded-lg";
  }
}

export const SHAPE_OPTIONS: { value: TableShape; labelKey: string }[] = [
  { value: TableShape.round, labelKey: "editor.table.shape.round" },
  { value: TableShape.square, labelKey: "editor.table.shape.square" },
  { value: TableShape.rectangle, labelKey: "editor.table.shape.rectangle" },
];

/** Canvas coordinate space. Positions are stored in these units. */
export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 640;
export const MIN_TABLE_SIZE = 60;
export const MAX_TABLE_SIZE = 260;
