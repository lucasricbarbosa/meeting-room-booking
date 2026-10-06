"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STEP_MINUTES = 15;

// 00:00 to 23:45: there is no business-hours rule yet, so every slot of the day is offered.
const TIME_OPTIONS = Array.from(
  { length: (24 * 60) / STEP_MINUTES },
  (_, index) => {
    const minutes = index * STEP_MINUTES;
    const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
    return `${hours}:${String(minutes % 60).padStart(2, "0")}`;
  },
);

const PLACEHOLDER = "Selecione";

type TimeSelectProps = {
  id: string;
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  invalid: boolean;
};

export function TimeSelect({
  id,
  name,
  value,
  onValueChange,
  invalid,
}: TimeSelectProps) {
  return (
    <>
      {/* Own hidden input instead of Radix's name prop: the form sends exactly this state, "" included. */}
      <input type="hidden" name={name} value={value} />
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} aria-invalid={invalid} className="w-full">
          {/* Explicit label: Radix only fills it after hydration, so the server HTML would show it empty. */}
          <SelectValue placeholder={PLACEHOLDER}>
            {value || PLACEHOLDER}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {TIME_OPTIONS.map((time) => (
            <SelectItem key={time} value={time} className="tabular-nums">
              {time}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
