"use client";

import * as React from "react";
import { format } from "date-fns";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type TimePickerProps = {
  value?: string;
  onChange?: (value: string) => void;
};

function toDateInputValue(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function parseDateTime(value?: string): { date?: Date; time: string } {
  if (!value) {
    return { date: undefined, time: "10:30:00" };
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return {
      date: parsed,
      time: format(parsed, "HH:mm:ss"),
    };
  }

  const [datePart, timePart] = value.split("T");
  if (datePart) {
    const dateOnly = new Date(`${datePart}T00:00:00`);
    if (!Number.isNaN(dateOnly.getTime())) {
      return {
        date: dateOnly,
        time: timePart
          ? timePart.length === 5
            ? `${timePart}:00`
            : timePart
          : "10:30:00",
      };
    }
  }

  return { date: undefined, time: "10:30:00" };
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const initial = React.useMemo(() => parseDateTime(value), [value]);
  const [date, setDate] = React.useState<Date | undefined>(initial.date);
  const [time, setTime] = React.useState<string>(initial.time);

  React.useEffect(() => {
    const parsed = parseDateTime(value);
    setDate(parsed.date);
    setTime(parsed.time);
  }, [value]);

  const emitChange = React.useCallback(
    (nextDate?: Date, nextTime?: string) => {
      if (!onChange) return;
      if (!nextDate) {
        onChange("");
        return;
      }

      const safeTime = nextTime || "10:30:00";
      const datePart = toDateInputValue(nextDate);
      onChange(`${datePart}T${safeTime}`);
    },
    [onChange],
  );

  return (
    <FieldGroup className="w-full flex-row">
      <Field>
        <FieldLabel htmlFor="date-picker-optional">Date</FieldLabel>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker-optional"
              className="w-40 justify-between font-normal"
            >
              {date ? format(date, "PPP") : "Select date"}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="start"
            style={{
              background: "var(--bg-light)",
              border: "1px solid var(--border-muted)",
            }}
          >
            <Calendar
              className="bg-[var(--bg-light)] text-[color:var(--text)] [&_button[data-selected-single=true]]:bg-[var(--primary)] [&_button[data-selected-single=true]]:text-[var(--bg-dark)] [&_button[data-selected-single=true]]:font-semibold [&_button[data-range-start=true]]:bg-[var(--primary)] [&_button[data-range-start=true]]:text-[var(--bg-dark)] [&_button[data-range-end=true]]:bg-[var(--primary)] [&_button[data-range-end=true]]:text-[var(--bg-dark)]"
              classNames={{
                today:
                  "rounded-md bg-[var(--primary-20)] text-[color:var(--text)] font-semibold data-[selected=true]:rounded-none",
              }}
              mode="single"
              selected={date}
              captionLayout="dropdown"
              defaultMonth={date}
              onSelect={(nextDate) => {
                setDate(nextDate);
                emitChange(nextDate, time);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </Field>
      <Field className="w-40">
        <FieldLabel htmlFor="time-picker-optional">Time</FieldLabel>
        <Input
          type="time"
          id="time-picker-optional"
          step="1"
          value={time}
          onChange={(event) => {
            const nextTime = event.target.value;
            setTime(nextTime);
            emitChange(date, nextTime);
          }}
          className="appearance-none bg-text-muted text-accent-foreground [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </Field>
    </FieldGroup>
  );
}
