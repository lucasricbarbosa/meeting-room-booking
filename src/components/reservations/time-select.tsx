"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CLOSING_TIME, OPENING_TIME } from "@/domain/reservation-rules";

const STEP_MINUTES = 15;

// "HH:mm" strings compare correctly as text, so the business window is a plain filter.
const BUSINESS_TIMES = Array.from(
  { length: (24 * 60) / STEP_MINUTES },
  (_, index) => {
    const minutes = index * STEP_MINUTES;
    const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
    return `${hours}:${String(minutes % 60).padStart(2, "0")}`;
  },
).filter((time) => time >= OPENING_TIME && time <= CLOSING_TIME);

export const START_TIME_OPTIONS = BUSINESS_TIMES.filter(
  (time) => time < CLOSING_TIME,
);
export const END_TIME_OPTIONS = BUSINESS_TIMES.filter(
  (time) => time > OPENING_TIME,
);

const PLACEHOLDER = "Selecione";

type TimeSelectProps = {
  id: string;
  name: string;
  value: string;
  options: string[];
  onValueChange: (value: string) => void;
  invalid: boolean;
};

export function TimeSelect({
  id,
  name,
  value,
  options,
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
          {options.map((time) => (
            <SelectItem key={time} value={time} className="tabular-nums">
              {time}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
