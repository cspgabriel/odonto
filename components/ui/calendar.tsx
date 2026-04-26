"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const defaultModifiersClassNames = {
  outside: "day-outside text-muted-foreground opacity-50",
  selected:
    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
  today: "bg-accent text-accent-foreground",
  disabled: "text-muted-foreground opacity-50",
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  modifiersClassNames,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: "relative flex",
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        caption: "relative flex justify-center items-center h-7",
        caption_label: "truncate text-sm font-medium",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "relative p-0 text-center text-sm focus-within:relative [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
        day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 rounded-md",
        ...classNames,
      }}
      modifiersClassNames={{
        ...defaultModifiersClassNames,
        ...modifiersClassNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
