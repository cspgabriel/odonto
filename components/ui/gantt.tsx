"use client";

import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import {
  DndContext,
  MouseSensor,
  useDraggable,
  useSensor,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { useMouse, useThrottle, useWindowScroll } from "@uidotdev/usehooks";
import {
  format,
  formatDistance,
  getDate,
  isSameDay,
  addDays,
  addMonths,
  differenceInDays,
  differenceInHours,
  differenceInMonths,
  endOfDay,
  endOfMonth,
  getDaysInMonth,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { atom, useAtom } from "jotai";
import throttle from "lodash.throttle";
import { CalendarIcon, ChevronDown, PlusIcon, TrashIcon } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
  FC,
  KeyboardEventHandler,
  MouseEventHandler,
  ReactNode,
  RefObject,
} from "react";

const draggingAtom = atom(false);
const scrollXAtom = atom(0);

export const useGanttDragging = () => useAtom(draggingAtom);
export const useGanttScrollX = () => useAtom(scrollXAtom);

export type GanttStatus = {
  id: string;
  name: string;
  color: string;
};

export type GanttFeature = {
  id: string;
  name: string;
  startAt: Date;
  endAt: Date;
  status: GanttStatus;
  /** Horizontal pixel offset when same-day bars overlap (spreads them across the timeline). */
  spreadOffsetPx?: number;
};

export type GanttMarkerProps = {
  id: string;
  date: Date;
  label: string;
};

export type Range = "daily" | "monthly" | "quarterly";

export type TimelineData = {
  year: number;
  /** When set (e.g. for ~30-day window), first column is this month (0–11) instead of January. */
  startMonthIndex?: number;
  quarters: {
    months: {
      days: number;
    }[];
  }[];
}[];

export type GanttContextProps = {
  zoom: number;
  range: Range;
  columnWidth: number;
  sidebarWidth: number;
  headerHeight: number;
  rowHeight: number;
  onAddItem: ((date: Date) => void) | undefined;
  placeholderLength: number;
  timelineData: TimelineData;
  ref: RefObject<HTMLDivElement | null> | null;
  scrollToToday?: () => void;
  goToTodayTitle?: string;
};

const getsDaysIn = (range: Range) => {
  let fn = (_date: Date) => 1;
  if (range === "monthly" || range === "quarterly") {
    fn = getDaysInMonth;
  }
  return fn;
};

const getDifferenceIn = (range: Range) => {
  let fn = differenceInDays;
  if (range === "monthly" || range === "quarterly") {
    fn = differenceInMonths;
  }
  return fn;
};

const getInnerDifferenceIn = (range: Range) => {
  let fn = differenceInHours;
  if (range === "monthly" || range === "quarterly") {
    fn = differenceInDays;
  }
  return fn;
};

const getStartOf = (range: Range) => {
  let fn = startOfDay;
  if (range === "monthly" || range === "quarterly") {
    fn = startOfMonth;
  }
  return fn;
};

const getEndOf = (range: Range) => {
  let fn = endOfDay;
  if (range === "monthly" || range === "quarterly") {
    fn = endOfMonth;
  }
  return fn;
};

const getAddRange = (range: Range) => {
  let fn = addDays;
  if (range === "monthly" || range === "quarterly") {
    fn = addMonths;
  }
  return fn;
};

const getTimelineStartDate = (timelineData: TimelineData): Date => {
  const first = timelineData[0];
  if (!first) return new Date(0, 0, 1);
  return new Date(first.year, first.startMonthIndex ?? 0, 1);
};

const getDateByMousePosition = (context: GanttContextProps, mouseX: number) => {
  const timelineStartDate = getTimelineStartDate(context.timelineData);
  const columnWidth = (context.columnWidth * context.zoom) / 100;
  const offset = Math.floor(mouseX / columnWidth);
  const daysIn = getsDaysIn(context.range);
  const addRange = getAddRange(context.range);
  const month = addRange(timelineStartDate, offset);
  const daysInMonth = daysIn(month);
  const pixelsPerDay = Math.round(columnWidth / daysInMonth);
  const dayOffset = Math.floor((mouseX % columnWidth) / pixelsPerDay);
  const actualDate = addDays(month, dayOffset);
  return actualDate;
};

/** Build months array from startMonthIndex through endMonthIndex (0–11) for a given year. */
const buildMonthsForYear = (y: number, startMonth: number, endMonth: number): { days: number }[] => {
  const months: { days: number }[] = [];
  for (let m = startMonth; m <= endMonth; m++) {
    months.push({ days: getDaysInMonth(new Date(y, m, 1)) });
  }
  return months;
};

/** If endYear is set (e.g. 2030), timeline from today through Dec endYear. If initialMonths is set, that many months. Otherwise full 3 years. */
const createInitialTimelineData = (
  today: Date,
  initialMonths?: number,
  endYear?: number
): TimelineData => {
  const year = today.getFullYear();
  const currentMonthIndex = today.getMonth();

  if (endYear != null && endYear >= year) {
    const data: TimelineData = [];
    for (let y = year; y <= endYear; y++) {
      const startMonth = y === year ? currentMonthIndex : 0;
      const endMonth = 11;
      const months = buildMonthsForYear(y, startMonth, endMonth);
      data.push({
        year: y,
        ...(y === year && { startMonthIndex: currentMonthIndex }),
        quarters: [{ months }],
      });
    }
    return data;
  }

  if (initialMonths != null && initialMonths > 0) {
    const months: { days: number }[] = [];
    for (let i = 0; i < initialMonths; i++) {
      const monthIndex = currentMonthIndex + i;
      const y = monthIndex >= 12 ? year + 1 : year;
      const m = monthIndex >= 12 ? monthIndex - 12 : monthIndex;
      months.push({ days: getDaysInMonth(new Date(y, m, 1)) });
    }
    return [{ year, startMonthIndex: currentMonthIndex, quarters: [{ months }] }];
  }

  const data: TimelineData = [];
  data.push(
    { year: year - 1, quarters: new Array(4).fill(null) },
    { year, quarters: new Array(4).fill(null) },
    { year: year + 1, quarters: new Array(4).fill(null) }
  );
  for (const yearObj of data) {
    yearObj.quarters = new Array(4).fill(null).map((_, quarterIndex) => ({
      months: new Array(3).fill(null).map((_, monthIndex) => {
        const month = quarterIndex * 3 + monthIndex;
        return {
          days: getDaysInMonth(new Date(yearObj.year, month, 1)),
        };
      }),
    }));
  }
  return data;
};

const getOffset = (
  date: Date,
  timelineStartDate: Date,
  context: GanttContextProps
) => {
  const parsedColumnWidth = (context.columnWidth * context.zoom) / 100;
  const differenceIn = getDifferenceIn(context.range);
  const startOf = getStartOf(context.range);
  const fullColumns = differenceIn(startOf(date), timelineStartDate);
  if (context.range === "daily") {
    return parsedColumnWidth * fullColumns;
  }
  const partialColumns = date.getDate();
  const daysInMonth = getDaysInMonth(date);
  const pixelsPerDay = parsedColumnWidth / daysInMonth;
  return fullColumns * parsedColumnWidth + partialColumns * pixelsPerDay;
};

const getWidth = (
  startAt: Date,
  endAt: Date | null,
  context: GanttContextProps
) => {
  const parsedColumnWidth = (context.columnWidth * context.zoom) / 100;
  if (!endAt) {
    return parsedColumnWidth * 2;
  }
  const differenceIn = getDifferenceIn(context.range);
  if (context.range === "daily") {
    const delta = differenceIn(endAt, startAt);
    return parsedColumnWidth * (delta ? delta : 1);
  }
  const daysInStartMonth = getDaysInMonth(startAt);
  const pixelsPerDayInStartMonth = parsedColumnWidth / daysInStartMonth;
  if (isSameDay(startAt, endAt)) {
    return pixelsPerDayInStartMonth;
  }
  const innerDifferenceIn = getInnerDifferenceIn(context.range);
  const startOf = getStartOf(context.range);
  if (isSameDay(startOf(startAt), startOf(endAt))) {
    return innerDifferenceIn(endAt, startAt) * pixelsPerDayInStartMonth;
  }
  const startRangeOffset = daysInStartMonth - getDate(startAt);
  const endRangeOffset = getDate(endAt);
  const fullRangeOffset = differenceIn(startOf(endAt), startOf(startAt));
  const daysInEndMonth = getDaysInMonth(endAt);
  const pixelsPerDayInEndMonth = parsedColumnWidth / daysInEndMonth;
  return (
    (fullRangeOffset - 1) * parsedColumnWidth +
    startRangeOffset * pixelsPerDayInStartMonth +
    endRangeOffset * pixelsPerDayInEndMonth
  );
};

const calculateInnerOffset = (
  date: Date,
  range: Range,
  columnWidth: number
) => {
  const startOf = getStartOf(range);
  const endOf = getEndOf(range);
  const differenceIn = getInnerDifferenceIn(range);
  const startOfRange = startOf(date);
  const endOfRange = endOf(date);
  const totalRangeDays = differenceIn(endOfRange, startOfRange);
  const dayOfMonth = date.getDate();
  return (dayOfMonth / totalRangeDays) * columnWidth;
};

const GanttContext = createContext<GanttContextProps>({
  zoom: 100,
  range: "monthly",
  columnWidth: 50,
  headerHeight: 60,
  sidebarWidth: 300,
  rowHeight: 36,
  onAddItem: undefined,
  placeholderLength: 2,
  timelineData: [],
  ref: null,
  scrollToToday: undefined,
  goToTodayTitle: "Go to today and zoom in",
});

export type GanttContentHeaderProps = {
  renderHeaderItem: (index: number) => ReactNode;
  title: string;
  columns: number;
};

export const GanttContentHeader: FC<GanttContentHeaderProps> = ({
  title,
  columns,
  renderHeaderItem,
}) => {
  const id = useId();
  return (
    <div
      className="sticky top-0 z-20 grid w-full shrink-0 bg-backdrop/90 backdrop-blur-sm"
      style={{
        height: "var(--gantt-content-header-height, var(--gantt-header-height))",
      }}
    >
      <div>
        <div
          className="sticky inline-flex whitespace-nowrap px-3 py-2 text-muted-foreground text-xs"
          style={{ left: "var(--gantt-sidebar-width)" }}
        >
          <p>{title}</p>
        </div>
      </div>
      <div
        className="grid w-full"
        style={{
          gridTemplateColumns: `repeat(${columns}, var(--gantt-column-width))`,
        }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <div
            key={`${id}-${index}`}
            className="shrink-0 border-border/50 border-b py-1 text-center text-xs"
          >
            {renderHeaderItem(index)}
          </div>
        ))}
      </div>
    </div>
  );
};

/** Resolve actual month Date for a year+months structure (supports startMonthIndex and year rollover) */
const getMonthDate = (year: { year: number; startMonthIndex?: number }, monthIndex: number): Date => {
  const base = year.startMonthIndex ?? 0;
  const total = base + monthIndex;
  const y = year.year + Math.floor(total / 12);
  const m = total % 12;
  return new Date(y, m, 1);
};

const DailyHeader: FC = () => {
  const gantt = useContext(GanttContext);
  return gantt.timelineData.map((year) =>
    year.quarters
      .flatMap((quarter) => quarter.months)
      .map((month, index) => {
        const monthDate = getMonthDate(year, index);
        return (
          <div className="relative flex flex-col" key={`${year.year}-${index}`}>
            <GanttContentHeader
              title={format(monthDate, "MMMM yyyy")}
              columns={month.days}
              renderHeaderItem={(item: number) => {
                const day = addDays(monthDate, item);
                return (
                  <p className="text-center text-xs text-muted-foreground">
                    {format(day, "EEE")}
                  </p>
                );
              }}
            />
            <GanttColumns columns={month.days} />
          </div>
        );
      })
  );
};

const MonthlyHeader: FC = () => {
  const gantt = useContext(GanttContext);
  return gantt.timelineData.map((year) => {
    const startMonth = year.startMonthIndex ?? 0;
    return (
      <div className="relative flex flex-col" key={year.year}>
        <GanttContentHeader
          title={`${year.year}`}
          columns={year.quarters.flatMap((quarter) => quarter.months).length}
          renderHeaderItem={(item: number) => (
            <p>{format(new Date(year.year, startMonth + item, 1), "MMM")}</p>
          )}
        />
        <GanttColumns
          columns={year.quarters.flatMap((quarter) => quarter.months).length}
        />
      </div>
    );
  });
};

const QuarterlyHeader: FC = () => {
  const gantt = useContext(GanttContext);
  return gantt.timelineData.map((year) =>
    year.quarters.map((quarter, quarterIndex) => (
      <div
        className="relative flex flex-col"
        key={`${year.year}-${quarterIndex}`}
      >
        <GanttContentHeader
          title={`Q${quarterIndex + 1} ${year.year}`}
          columns={quarter.months.length}
          renderHeaderItem={(item: number) => (
            <p>
              {format(
                new Date(year.year, quarterIndex * 3 + item, 1),
                "MMM"
              )}
            </p>
          )}
        />
        <GanttColumns columns={quarter.months.length} />
      </div>
    ))
  );
};

const headers: Record<Range, FC> = {
  daily: DailyHeader,
  monthly: MonthlyHeader,
  quarterly: QuarterlyHeader,
};

export type GanttHeaderProps = { className?: string };

export const GanttHeader: FC<GanttHeaderProps> = ({ className }) => {
  const gantt = useContext(GanttContext);
  const Header = headers[gantt.range];
  return (
    <div
      className={cn(
        "-space-x-px sticky top-0 z-20 flex h-full w-max shrink-0 divide-x divide-border/50 bg-background/95 backdrop-blur-sm",
        className
      )}
      style={{ height: "var(--gantt-header-height)" }}
    >
      <Header />
    </div>
  );
};

export type GanttSidebarItemProps = {
  feature: GanttFeature;
  onSelectItem?: (id: string) => void;
  className?: string;
};

export const GanttSidebarItem: FC<GanttSidebarItemProps> = ({
  feature,
  onSelectItem,
  className,
}) => {
  const duration = feature.endAt
    ? formatDistance(feature.startAt, feature.endAt)
    : `${formatDistance(feature.startAt, new Date())} so far`;

  const handleClick: MouseEventHandler<HTMLDivElement> = (event) => {
    if (event.target === event.currentTarget) {
      onSelectItem?.(feature.id);
    }
  };

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === "Enter") {
      onSelectItem?.(feature.id);
    }
  };

  return (
    <div
      role="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      key={feature.id}
      className={cn(
        "relative flex items-center gap-2.5 p-2.5 text-xs",
        className
      )}
      style={{ height: "var(--gantt-row-height)" }}
    >
      <div
        className="pointer-events-none h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: feature.status.color }}
      />
      <p className="pointer-events-none flex-1 truncate text-left font-medium">
        {feature.name}
      </p>
      <p className="pointer-events-none text-muted-foreground">{duration}</p>
    </div>
  );
};

export const GanttSidebarHeader: FC = () => (
  <div
    className="sticky top-0 z-10 flex shrink-0 items-end justify-between gap-2.5 border-border/50 border-b bg-slate-100/90 dark:bg-slate-800/90 p-2.5 font-medium text-muted-foreground text-xs backdrop-blur-sm"
    style={{ height: "var(--gantt-header-height)" }}
  >
    <p className="flex-1 truncate text-left">Appointment</p>
    <p className="shrink-0">Duration</p>
  </div>
);

export type GanttSidebarGroupProps = {
  children: ReactNode;
  name: string;
  /** Doctor/group color – shown as left border on group header and sidebar items use feature.status.color */
  groupColor?: string;
  /** When true, group header acts as trigger – click to expand/collapse appointments */
  collapsible?: boolean;
  /** Initial open state when collapsible (default: false) */
  defaultOpen?: boolean;
  className?: string;
};

export const GanttSidebarGroup: FC<GanttSidebarGroupProps> = ({
  children,
  name,
  groupColor,
  collapsible = false,
  defaultOpen = false,
  className,
}) => {
  const header = (
    <p
      style={{
        height: "var(--gantt-row-height)",
        ...(groupColor && { borderLeftColor: groupColor }),
      }}
      className={cn(
        "flex w-full items-center justify-between gap-1 truncate p-2.5 text-left font-medium text-muted-foreground text-xs",
        groupColor && "border-l-4",
        collapsible && "cursor-pointer hover:bg-muted/50 rounded-r"
      )}
    >
      <span className="min-w-0 truncate">{name}</span>
      {collapsible && (
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
            "group-data-[state=open]:rotate-180"
          )}
        />
      )}
    </p>
  );

  if (collapsible) {
    return (
      <Collapsible defaultOpen={defaultOpen} className={cn("group", className)}>
        <CollapsibleTrigger asChild className="w-full">
          {header}
        </CollapsibleTrigger>
        <CollapsibleContent className="grid grid-rows-[0fr] data-[state=open]:grid-rows-[1fr] overflow-hidden transition-[grid-template-rows] duration-200 ease-out">
          <div className="divide-y divide-border/50 min-h-0">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className={className}>
      {header}
      <div className="divide-y divide-border/50">{children}</div>
    </div>
  );
};

export type GanttSidebarProps = {
  children: ReactNode;
  className?: string;
};

export const GanttSidebar: FC<GanttSidebarProps> = ({ children, className }) => (
  <div
    data-roadmap-ui="gantt-sidebar"
    className={cn(
      "sticky left-0 z-30 h-max min-h-full w-[300px] shrink-0 overflow-x-clip border-border/50 border-r bg-slate-50/95 dark:bg-slate-900/70 backdrop-blur-md",
      className
    )}
  >
    <GanttSidebarHeader />
    <div className="space-y-4">{children}</div>
  </div>
);

export type GanttAddFeatureHelperProps = {
  top: number;
  className?: string;
};

export const GanttAddFeatureHelper: FC<GanttAddFeatureHelperProps> = ({
  top,
  className,
}) => {
  const [scrollX] = useGanttScrollX();
  const gantt = useContext(GanttContext);
  const [mousePosition, mouseRef] = useMouse<HTMLDivElement>();

  const handleClick = () => {
    const ganttRect = gantt.ref?.current?.getBoundingClientRect();
    const x =
      mousePosition.x - (ganttRect?.left ?? 0) + scrollX - gantt.sidebarWidth;
    const currentDate = getDateByMousePosition(gantt, x);
    gantt.onAddItem?.(currentDate);
  };

  return (
    <div
      className={cn("absolute top-0 w-full px-0.5", className)}
      style={{
        marginTop: -gantt.rowHeight / 2,
        transform: `translateY(${top}px)`,
      }}
      ref={mouseRef}
    >
      <button
        onClick={handleClick}
        type="button"
        className="flex h-full w-full items-center justify-center rounded-md border border-dashed p-2"
      >
        <PlusIcon
          size={16}
          className="pointer-events-none select-none text-muted-foreground"
        />
      </button>
    </div>
  );
};

export type GanttColumnProps = {
  index: number;
  isColumnSecondary?: (item: number) => boolean;
};

export const GanttColumn: FC<GanttColumnProps> = ({
  index,
  isColumnSecondary,
}) => {
  const gantt = useContext(GanttContext);
  const [dragging] = useGanttDragging();
  const [mousePosition, mouseRef] = useMouse<HTMLDivElement>();
  const [hovering, setHovering] = useState(false);
  const [windowScroll] = useWindowScroll();
  const top = useThrottle(
    mousePosition.y -
      (mouseRef.current?.getBoundingClientRect().y ?? 0) -
      (windowScroll.y ?? 0),
    10
  );

  return (
    <div
      className="group relative h-full min-h-[44px] overflow-hidden"
      ref={mouseRef}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {!dragging && hovering && gantt.onAddItem ? (
        <GanttAddFeatureHelper top={top} />
      ) : null}
    </div>
  );
};

export type GanttColumnsProps = {
  columns: number;
  isColumnSecondary?: (item: number) => boolean;
};

export const GanttColumns: FC<GanttColumnsProps> = ({
  columns,
  isColumnSecondary,
}) => {
  const id = useId();
  return (
    <div
      className="divide grid h-full w-full divide-x divide-border/50"
      style={{
        gridTemplateColumns: `repeat(${columns}, var(--gantt-column-width))`,
      }}
    >
      {Array.from({ length: columns }).map((_, index) => (
        <GanttColumn
          key={`${id}-${index}`}
          index={index}
          isColumnSecondary={isColumnSecondary}
        />
      ))}
    </div>
  );
};

export type GanttCreateMarkerTriggerProps = {
  onCreateMarker: (date: Date) => void;
  className?: string;
};

export const GanttCreateMarkerTrigger: FC<GanttCreateMarkerTriggerProps> = ({
  onCreateMarker,
  className,
}) => {
  const gantt = useContext(GanttContext);
  const [mousePosition, mouseRef] = useMouse<HTMLDivElement>();
  const [windowScroll] = useWindowScroll();
  const x = useThrottle(
    mousePosition.x -
      (mouseRef.current?.getBoundingClientRect().x ?? 0) -
      (windowScroll.x ?? 0),
    10
  );
  const date = getDateByMousePosition(gantt, x);
  const handleClick = () => onCreateMarker(date);

  return (
    <div
      className={cn(
        "group pointer-events-none absolute top-0 left-0 h-full w-full select-none overflow-visible",
        className
      )}
      ref={mouseRef}
    >
      <div
        className="-ml-2 pointer-events-auto sticky top-6 z-20 flex w-4 flex-col items-center justify-center gap-1 overflow-visible opacity-0 group-hover:opacity-100"
        style={{ transform: `translateX(${x}px)` }}
      >
        <button
          type="button"
          className="z-50 inline-flex h-4 w-4 items-center justify-center rounded-full bg-card"
          onClick={handleClick}
        >
          <PlusIcon size={12} className="text-muted-foreground" />
        </button>
        <div className="whitespace-nowrap rounded-full border border-border/50 bg-background/90 px-2 py-1 text-foreground text-xs backdrop-blur-lg">
          {format(date, "MMM dd, yyyy")}
        </div>
      </div>
    </div>
  );
};

export type GanttFeatureDragHelperProps = {
  featureId: GanttFeature["id"];
  direction: "left" | "right";
  date: Date | null;
};

export const GanttFeatureDragHelper: FC<GanttFeatureDragHelperProps> = ({
  direction,
  featureId,
  date,
}) => {
  const [, setDragging] = useGanttDragging();
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `feature-drag-helper-${featureId}`,
  });
  const isPressed = Boolean(attributes["aria-pressed"]);
  useEffect(() => setDragging(isPressed), [isPressed, setDragging]);

  return (
    <div
      className={cn(
        "group -translate-y-1/2 !cursor-col-resize absolute top-1/2 z-[3] h-full w-6 rounded-md outline-none",
        direction === "left" ? "-left-2.5" : "-right-2.5"
      )}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      <div
        className={cn(
          "-translate-y-1/2 absolute top-1/2 h-[80%] w-1 rounded-sm bg-muted-foreground opacity-0 transition-all",
          direction === "left" ? "left-2.5" : "right-2.5",
          direction === "left" ? "group-hover:left-0" : "group-hover:right-0",
          isPressed && (direction === "left" ? "left-0" : "right-0"),
          "group-hover:opacity-100",
          isPressed && "opacity-100"
        )}
      />
      {date && (
        <div
          className={cn(
            "-translate-x-1/2 absolute top-10 hidden whitespace-nowrap rounded-lg border border-border/50 bg-background/90 px-2 py-1 text-foreground text-xs backdrop-blur-lg group-hover:block",
            isPressed && "block"
          )}
        >
          {format(date, "MMM dd, yyyy")}
        </div>
      )}
    </div>
  );
};

export type GanttFeatureItemCardProps = Pick<GanttFeature, "id"> & {
  children?: ReactNode;
  /** Status color for the card background (from feature.status.color) */
  statusColor?: string;
  /** Called when card is clicked (not when dragging). Use to open detail sidebar. */
  onSelectItem?: (id: string) => void;
};

export const GanttFeatureItemCard: FC<GanttFeatureItemCardProps> = ({
  id,
  children,
  statusColor,
  onSelectItem,
}) => {
  const [, setDragging] = useGanttDragging();
  const { attributes, listeners, setNodeRef } = useDraggable({ id });
  const isPressed = Boolean(attributes["aria-pressed"]);
  useEffect(() => setDragging(isPressed), [isPressed, setDragging]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isPressed && onSelectItem) {
      e.stopPropagation();
      onSelectItem(id);
    }
  };

  return (
    <Card
      className={cn(
        "h-full min-w-[80px] w-full rounded-md p-2 text-xs shadow-sm border-l-4 cursor-pointer",
        !statusColor && "bg-muted"
      )}
      style={
        statusColor
          ? {
              backgroundColor: `${statusColor}22`,
              borderLeftColor: statusColor,
            }
          : undefined
    }
    >
      <div
        className={cn(
          "flex h-full w-full min-w-0 items-center justify-between gap-2 text-left",
          isPressed && "cursor-grabbing"
        )}
        {...attributes}
        {...listeners}
        ref={setNodeRef}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectItem?.(id);
          }
        }}
      >
        {children}
      </div>
    </Card>
  );
};

export type GanttFeatureItemProps = GanttFeature & {
  onMove?: (id: string, startDate: Date, endDate: Date | null) => void;
  /** Called when card is clicked (not when dragging). Use to open detail sidebar. */
  onSelectItem?: (id: string) => void;
  children?: ReactNode;
  className?: string;
};

export const GanttFeatureItem: FC<GanttFeatureItemProps> = ({
  onMove,
  onSelectItem,
  children,
  className,
  ...feature
}) => {
  const [scrollX] = useGanttScrollX();
  const gantt = useContext(GanttContext);
  const timelineStartDate = getTimelineStartDate(gantt.timelineData);
  const [startAt, setStartAt] = useState<Date>(feature.startAt);
  const [endAt, setEndAt] = useState<Date | null>(feature.endAt);
  const rawWidth = getWidth(startAt, endAt, gantt);
  const width = Math.max(rawWidth, 80);
  const offset = getOffset(startAt, timelineStartDate, gantt);
  const addRange = getAddRange(gantt.range);
  const [mousePosition] = useMouse<HTMLDivElement>();
  const [previousMouseX, setPreviousMouseX] = useState(0);
  const [previousStartAt, setPreviousStartAt] = useState(startAt);
  const [previousEndAt, setPreviousEndAt] = useState(endAt);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 10 },
  });

  const handleItemDragStart = () => {
    setPreviousMouseX(mousePosition.x);
    setPreviousStartAt(startAt);
    setPreviousEndAt(endAt);
  };

  const handleItemDragMove = () => {
    const currentDate = getDateByMousePosition(gantt, mousePosition.x);
    const originalDate = getDateByMousePosition(gantt, previousMouseX);
    const delta =
      gantt.range === "daily"
        ? getDifferenceIn(gantt.range)(currentDate, originalDate)
        : getInnerDifferenceIn(gantt.range)(currentDate, originalDate);
    setStartAt(addDays(previousStartAt, delta));
    setEndAt(previousEndAt ? addDays(previousEndAt, delta) : null);
  };

  const onDragEnd = () => onMove?.(feature.id, startAt, endAt);

  const handleLeftDragMove = () => {
    const ganttRect = gantt.ref?.current?.getBoundingClientRect();
    const x =
      mousePosition.x - (ganttRect?.left ?? 0) + scrollX - gantt.sidebarWidth;
    setStartAt(getDateByMousePosition(gantt, x));
  };

  const handleRightDragMove = () => {
    const ganttRect = gantt.ref?.current?.getBoundingClientRect();
    const x =
      mousePosition.x - (ganttRect?.left ?? 0) + scrollX - gantt.sidebarWidth;
    setEndAt(getDateByMousePosition(gantt, x));
  };

  return (
    <div
      className={cn("relative flex w-max min-w-full py-0.5", className)}
      style={{ height: "var(--gantt-row-height)" }}
    >
      <div
        className="pointer-events-auto absolute top-0.5"
        style={{
          height: "calc(var(--gantt-row-height) - 4px)",
          width: Math.round(width),
          left: Math.round(offset) + (feature.spreadOffsetPx ?? 0),
        }}
      >
        {onMove && (
          <DndContext
            sensors={[mouseSensor]}
            modifiers={[restrictToHorizontalAxis]}
            onDragMove={handleLeftDragMove}
            onDragEnd={onDragEnd}
          >
            <GanttFeatureDragHelper
              direction="left"
              featureId={feature.id}
              date={startAt}
            />
          </DndContext>
        )}
        <DndContext
          sensors={[mouseSensor]}
          modifiers={[restrictToHorizontalAxis]}
          onDragStart={handleItemDragStart}
          onDragMove={handleItemDragMove}
          onDragEnd={onDragEnd}
        >
          <GanttFeatureItemCard id={feature.id} statusColor={feature.status?.color} onSelectItem={onSelectItem}>
            {children ?? (
              <p className="flex-1 truncate text-xs">{feature.name}</p>
            )}
          </GanttFeatureItemCard>
        </DndContext>
        {onMove && (
          <DndContext
            sensors={[mouseSensor]}
            modifiers={[restrictToHorizontalAxis]}
            onDragMove={handleRightDragMove}
            onDragEnd={onDragEnd}
          >
            <GanttFeatureDragHelper
              direction="right"
              featureId={feature.id}
              date={endAt ?? addRange(startAt, 2)}
            />
          </DndContext>
        )}
      </div>
    </div>
  );
};

export type GanttFeatureListGroupProps = {
  children: ReactNode;
  className?: string;
};

export const GanttFeatureListGroup: FC<GanttFeatureListGroupProps> = ({
  children,
  className,
}) => (
  <div className={className} style={{ paddingTop: "var(--gantt-row-height)" }}>
    {children}
  </div>
);

/** Column count for timeline body (used by grid lines and hover layer). */
const getTimelineColumnCount = (gantt: GanttContextProps): number =>
  gantt.range === "daily"
    ? gantt.timelineData.reduce(
        (acc, year) =>
          acc +
          year.quarters.flatMap((q) => q.months).reduce((macc, m) => macc + m.days, 0),
        0
      )
    : gantt.timelineData.reduce(
        (acc, year) => acc + year.quarters.flatMap((q) => q.months).length,
        0
      );

/** Full-height column grid lines extending from top to bottom of timeline body (below header). */
const GanttColumnGrid: FC = () => {
  const gantt = useContext(GanttContext);
  const columns = getTimelineColumnCount(gantt);
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 grid divide-x divide-border/50"
      style={{
        gridTemplateColumns: `repeat(${columns}, var(--gantt-column-width))`,
      }}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="min-h-full" />
      ))}
    </div>
  );
};

/** Hoverable column cells in timeline body – show add-on-hover like the reference. */
const GanttColumnBodyHover: FC = () => {
  const gantt = useContext(GanttContext);
  const id = useId();
  const columns = getTimelineColumnCount(gantt);
  if (!gantt.onAddItem) return null;
  return (
    <div
      aria-hidden
      className="absolute inset-0 z-[1] grid"
      style={{
        gridTemplateColumns: `repeat(${columns}, var(--gantt-column-width))`,
      }}
    >
      {Array.from({ length: columns }).map((_, index) => (
        <GanttColumn key={`${id}-body-${index}`} index={index} />
      ))}
    </div>
  );
};

export type GanttFeatureListProps = {
  className?: string;
  children: ReactNode;
};

export const GanttFeatureList: FC<GanttFeatureListProps> = ({
  className,
  children,
}) => (
  <div
    className={cn(
      "relative z-10 min-w-full shrink-0 space-y-4",
      className
    )}
  >
    {children}
  </div>
);

export const GanttMarker: FC<
  GanttMarkerProps & {
    onRemove?: (id: string) => void;
    className?: string;
  }
> = ({ label, date, id, onRemove, className }) => {
  const gantt = useContext(GanttContext);
  const differenceIn = getDifferenceIn(gantt.range);
  const timelineStartDate = getTimelineStartDate(gantt.timelineData);
  const offset = differenceIn(date, timelineStartDate);
  const innerOffset = calculateInnerOffset(
    date,
    gantt.range,
    (gantt.columnWidth * gantt.zoom) / 100
  );
  const handleRemove = () => onRemove?.(id);

  return (
    <div
      className="pointer-events-none absolute top-0 left-0 z-20 flex h-full select-none flex-col items-center justify-center overflow-visible"
      style={{
        width: 0,
        transform: `translateX(calc(var(--gantt-column-width) * ${offset} + ${innerOffset}px))`,
      }}
    >
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "group pointer-events-auto sticky top-0 flex select-auto flex-col flex-nowrap items-center justify-center whitespace-nowrap rounded-b-md bg-card px-2 py-1 text-foreground text-xs",
              className
            )}
          >
            {label}
            <span className="max-h-[0] overflow-hidden opacity-80 transition-all group-hover:max-h-[2rem]">
              {format(date, "MMM dd, yyyy")}
            </span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {onRemove ? (
            <ContextMenuItem
              className="flex items-center gap-2 text-destructive"
              onClick={handleRemove}
            >
              <TrashIcon size={16} />
              Remove marker
            </ContextMenuItem>
          ) : null}
        </ContextMenuContent>
      </ContextMenu>
      <div className={cn("h-full w-px bg-card", className)} />
    </div>
  );
};

const GanttGoToTodayButton: FC = () => {
  const gantt = useContext(GanttContext);
  if (!gantt.scrollToToday) return null;
  return (
    <button
      type="button"
      onClick={gantt.scrollToToday}
      className="absolute bottom-3 right-3 z-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/95 shadow-lg backdrop-blur-sm transition-colors hover:bg-accent hover:text-accent-foreground"
      title={gantt.goToTodayTitle ?? "Go to today and zoom in"}
    >
      <CalendarIcon className="h-5 w-5" />
    </button>
  );
};

const ZOOM_MIN = 50;
const ZOOM_MAX = 250;
const ZOOM_STEP = 2;

export type GanttProviderProps = {
  range?: Range;
  zoom?: number;
  rowHeight?: number;
  /** Enable trackpad pinch-to-zoom inside the timeline (default: true when zoom is used) */
  enablePinchZoom?: boolean;
  /** Initial window in months (e.g. 2 = ~60 days). Omit for full 3-year timeline. */
  initialMonths?: number;
  /** When set (e.g. 2030), timeline runs from today through December of this year. */
  endYear?: number;
  onAddItem?: (date: Date) => void;
  /** Tooltip for the "go to today" button. */
  goToTodayTitle?: string;
  children: ReactNode;
  className?: string;
};

export const GanttProvider: FC<GanttProviderProps> = ({
  zoom: zoomProp = 100,
  range = "monthly",
  rowHeight: rowHeightProp,
  enablePinchZoom = true,
  initialMonths,
  endYear,
  onAddItem,
  goToTodayTitle = "Go to today and zoom in",
  children,
  className,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(() =>
    Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomProp))
  );
  const [timelineData, setTimelineData] = useState<TimelineData>(
    () => createInitialTimelineData(new Date(), initialMonths, endYear)
  );
  const [, setScrollX] = useGanttScrollX();

  /** When zoomed in enough on monthly view, show days inside months */
  const effectiveRange: Range =
    range === "monthly" && zoom >= 150 ? "daily" : range;
  const headerHeight = 60;
  const contentHeaderHeight = 60;
  const sidebarWidth = 300;
  const rowHeight = rowHeightProp ?? 36;
  let columnWidth = 50;
  if (effectiveRange === "monthly") {
    columnWidth = 150;
  } else if (effectiveRange === "quarterly") {
    columnWidth = 100;
  }

  const zoomAtCursorRef = useRef<{ cursorX: number; scrollLeft: number; oldZoom: number } | null>(null);
  const scrollToTodayPendingRef = useRef(false);
  const skipScrollResetRef = useRef(false);

  const handleWheelZoom = useCallback(
    (e: WheelEvent) => {
      if (!enablePinchZoom) return;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const el = scrollRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cursorX = e.clientX - rect.left - sidebarWidth;
        if (cursorX < 0) return;
        const scrollLeft = el.scrollLeft;

        setZoom((prev) => {
          const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
          const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev + delta));
          const contentX = scrollLeft + cursorX;
          const newScrollLeft = contentX * (newZoom / prev) - cursorX;
          zoomAtCursorRef.current = { cursorX, scrollLeft: newScrollLeft, oldZoom: prev };
          return newZoom;
        });
      }
    },
    [enablePinchZoom, sidebarWidth]
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !enablePinchZoom) return;
    el.addEventListener("wheel", handleWheelZoom, { passive: false });
    return () => el.removeEventListener("wheel", handleWheelZoom);
  }, [handleWheelZoom, enablePinchZoom]);

  useEffect(() => {
    const scrollToTodayPending = scrollToTodayPendingRef.current;
    scrollToTodayPendingRef.current = false;
    if (scrollToTodayPending && scrollRef.current) {
      skipScrollResetRef.current = true;
      const el = scrollRef.current;
      const today = new Date();
      const timelineStartDate = getTimelineStartDate(timelineData);
      const parsedColumnWidth = (columnWidth * zoom) / 100;
      const diff =
        effectiveRange === "monthly" || effectiveRange === "quarterly"
          ? differenceInMonths(today, timelineStartDate)
          : differenceInDays(today, timelineStartDate);
      const inner =
        effectiveRange === "monthly" || effectiveRange === "quarterly"
          ? calculateInnerOffset(today, effectiveRange, parsedColumnWidth)
          : 0;
      const todayOffset = diff * parsedColumnWidth + inner;
      const visibleWidth = el.clientWidth - sidebarWidth;
      const targetScroll = Math.max(0, todayOffset - visibleWidth / 2);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            const { scrollWidth, clientWidth } = scrollRef.current;
            scrollRef.current.scrollLeft = Math.max(
              0,
              Math.min(targetScroll, Math.max(0, scrollWidth - clientWidth))
            );
            setScrollX(scrollRef.current.scrollLeft);
          }
        });
      });
      return;
    }
    const pending = zoomAtCursorRef.current;
    zoomAtCursorRef.current = null;
    if (pending && scrollRef.current) {
      skipScrollResetRef.current = true;
      const el = scrollRef.current;
      const targetScroll = pending.scrollLeft;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            const { scrollWidth, clientWidth } = scrollRef.current;
            scrollRef.current.scrollLeft = Math.max(
              0,
              Math.min(targetScroll, Math.max(0, scrollWidth - clientWidth))
            );
            setScrollX(scrollRef.current.scrollLeft);
          }
        });
      });
    }
  }, [zoom, setScrollX, timelineData, columnWidth, effectiveRange, sidebarWidth]);

  const cssVariables = {
    "--gantt-zoom": `${zoom}`,
    "--gantt-column-width": `${(zoom / 100) * columnWidth}px`,
    "--gantt-header-height": `${headerHeight}px`,
    "--gantt-content-header-height": `${contentHeaderHeight}px`,
    "--gantt-row-height": `${rowHeight}px`,
    "--gantt-sidebar-width": `${sidebarWidth}px`,
  } as CSSProperties;

  const hasBoundedRange = initialMonths != null && initialMonths > 0 || endYear != null;

  const isInitialMount = useRef(true);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (skipScrollResetRef.current) {
      skipScrollResetRef.current = false;
      return;
    }
    if (zoomAtCursorRef.current) return;
    if (hasBoundedRange) {
      el.scrollLeft = 0;
    } else if (isInitialMount.current) {
      el.scrollLeft = el.scrollWidth / 2 - el.clientWidth / 2;
      isInitialMount.current = false;
    }
    setScrollX(el.scrollLeft);
  }, [effectiveRange, hasBoundedRange, setScrollX]);

  const handleScroll = useCallback(
    throttle(() => {
      if (!scrollRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setScrollX(scrollLeft);

      if (hasBoundedRange) return;

      if (scrollLeft === 0) {
        const firstYear = timelineData[0]?.year;
        if (!firstYear) return;
        const prevYear = firstYear - 1;
        const newTimelineData: TimelineData = [...timelineData];
        newTimelineData.unshift({
          year: prevYear,
          quarters: new Array(4).fill(null).map((_, quarterIndex) => ({
            months: new Array(3).fill(null).map((_, monthIndex) => {
              const month = quarterIndex * 3 + monthIndex;
              return {
                days: getDaysInMonth(new Date(prevYear, month, 1)),
              };
            }),
          })),
        });
        setTimelineData(newTimelineData);
        scrollRef.current.scrollLeft = scrollRef.current.clientWidth;
        setScrollX(scrollRef.current.scrollLeft);
      } else if (scrollLeft + clientWidth >= scrollWidth) {
        const lastYear = timelineData.at(-1)?.year;
        if (!lastYear) return;
        const nextYear = lastYear + 1;
        const newTimelineData: TimelineData = [...timelineData];
        newTimelineData.push({
          year: nextYear,
          quarters: new Array(4).fill(null).map((_, quarterIndex) => ({
            months: new Array(3).fill(null).map((_, monthIndex) => {
              const month = quarterIndex * 3 + monthIndex;
              return {
                days: getDaysInMonth(new Date(nextYear, month, 1)),
              };
            }),
          })),
        });
        setTimelineData(newTimelineData);
        scrollRef.current.scrollLeft =
          scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
        setScrollX(scrollRef.current.scrollLeft);
      }
    }, 100),
    [timelineData, setScrollX, hasBoundedRange]
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", handleScroll);
    return () => {
      if (el) el.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  const scrollToToday = useCallback(() => {
    scrollToTodayPendingRef.current = true;
    setZoom((prev) => Math.max(150, Math.min(prev + 30, ZOOM_MAX)));
  }, []);

  return (
    <GanttContext.Provider
      value={{
        zoom,
        range: effectiveRange,
        headerHeight,
        columnWidth,
        sidebarWidth,
        rowHeight,
        onAddItem,
        timelineData,
        placeholderLength: 2,
        ref: scrollRef,
        scrollToToday,
        goToTodayTitle,
      }}
    >
      <div
        className={cn(
          "relative flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden select-none rounded-sm",
          className
        )}
      >
      <div
        ref={scrollRef}
        className={cn(
          "gantt overscroll-contain rounded-sm bg-background",
          "w-full max-w-full shrink-0",
          "min-h-0 flex-1 overflow-auto",
          effectiveRange,
          enablePinchZoom && "touch-pan-x touch-pan-y"
        )}
        style={cssVariables}
      >
          <div
            className="grid h-max min-h-full min-w-0 w-max items-start"
            style={{
              gridTemplateColumns: "var(--gantt-sidebar-width) minmax(0, max-content)",
            }}
          >
            {children}
          </div>
        </div>
        <GanttGoToTodayButton />
      </div>
    </GanttContext.Provider>
  );
};

export type GanttTimelineProps = {
  children: ReactNode;
  className?: string;
};

export const GanttTimeline: FC<GanttTimelineProps> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      "relative flex h-full min-h-0 min-w-0 flex-col overflow-clip bg-background",
      className
    )}
  >
    {children}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 z-0"
      style={{ top: "var(--gantt-header-height)" }}
    >
      <GanttColumnGrid />
    </div>
    <div
      aria-hidden
      className="absolute inset-x-0 bottom-0 z-[1]"
      style={{ top: "var(--gantt-header-height)" }}
    >
      <GanttColumnBodyHover />
    </div>
  </div>
);

export type GanttTodayProps = { className?: string };

export const GanttToday: FC<GanttTodayProps> = ({ className }) => {
  const label = "Today";
  const date = new Date();
  const gantt = useContext(GanttContext);
  const differenceIn = getDifferenceIn(gantt.range);
  const timelineStartDate = getTimelineStartDate(gantt.timelineData);
  const offset = differenceIn(date, timelineStartDate);
  const innerOffset = calculateInnerOffset(
    date,
    gantt.range,
    (gantt.columnWidth * gantt.zoom) / 100
  );

  return (
    <div
      className="pointer-events-none absolute top-0 left-0 z-20 flex h-full select-none flex-col items-center justify-center overflow-visible"
      style={{
        width: 0,
        transform: `translateX(calc(var(--gantt-column-width) * ${offset} + ${innerOffset}px))`,
      }}
    >
      <div
        className={cn(
          "group pointer-events-auto sticky top-0 flex select-auto flex-col flex-nowrap items-center justify-center whitespace-nowrap rounded-b-md bg-card px-2 py-1 text-foreground text-xs",
          className
        )}
      >
        {label}
        <span className="max-h-[0] overflow-hidden opacity-80 transition-all group-hover:max-h-[2rem]">
          {format(date, "MMM dd, yyyy")}
        </span>
      </div>
      <div className={cn("h-full w-px bg-card", className)} />
    </div>
  );
};
