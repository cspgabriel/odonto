"use client";

import * as React from "react";
import { format, startOfDay } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DatePickerProps {
  date?: Date;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Disable all dates before this (e.g. pass new Date() for "today and future only"). */
  fromDate?: Date;
  /** Optional class for the popover content (e.g. z-[80] when inside a modal). */
  popoverClassName?: string;
  /** Placeholder for month select (defaults to i18n "Month" when next-intl is available). */
  placeholderMonth?: string;
  /** Placeholder for year select (defaults to i18n "Year" when next-intl is available). */
  placeholderYear?: string;
}

export function DatePicker({
  date,
  onSelect,
  className,
  placeholder = "Pick a date",
  disabled,
  fromDate,
  popoverClassName,
  placeholderMonth: placeholderMonthProp,
  placeholderYear: placeholderYearProp,
}: DatePickerProps) {
  const tCommon = useTranslations("common");
  const placeholderMonth = placeholderMonthProp ?? tCommon("monthPlaceholder");
  const placeholderYear = placeholderYearProp ?? tCommon("yearPlaceholder");
  const [month, setMonth] = React.useState<Date>(date || new Date());

  // Update internal month state when date prop changes
  React.useEffect(() => {
    if (date) {
      setMonth(date);
    }
  }, [date]);

  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 100; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  }, []);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handleMonthChange = (monthStr: string) => {
    const newMonthIndex = months.indexOf(monthStr);
    const newDate = new Date(month);
    newDate.setMonth(newMonthIndex);
    setMonth(newDate);
  };

  const handleYearChange = (yearStr: string) => {
    const newYear = parseInt(yearStr);
    const newDate = new Date(month);
    newDate.setFullYear(newYear);
    setMonth(newDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-auto p-0 bg-white dark:bg-slate-950 shadow-lg", popoverClassName)} align="start">
        <div className="flex items-center justify-between p-3 border-b gap-2">
          <Select
            value={months[month.getMonth()]}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="h-8 w-[120px]">
              <SelectValue placeholder={placeholderMonth} />
            </SelectTrigger>
            <SelectContent className={popoverClassName}>
              {months.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={month.getFullYear().toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="h-8 w-[100px]">
              <SelectValue placeholder={placeholderYear} />
            </SelectTrigger>
            <SelectContent className={cn("max-h-[200px]", popoverClassName)}>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          month={month}
          onMonthChange={setMonth}
          initialFocus
          showOutsideDays={false}
          className="p-3 pointer-events-auto"
          disabled={fromDate ? { before: startOfDay(fromDate) } : undefined}
        />
      </PopoverContent>
    </Popover>
  );
}
