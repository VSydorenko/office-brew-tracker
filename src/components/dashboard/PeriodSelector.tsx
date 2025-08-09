
import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

/**
 * Швидкий вибір періоду: 3/6/12 місяців, "Весь час" та "Довільний" з вибором дат.
 * Використовуйте режим "Довільний" для точного діапазону дат.
 */
export type PeriodMode = "months" | "all" | "custom";
export interface PeriodSelectorValue {
  mode: PeriodMode;
  months?: number;
  from?: Date | null;
  to?: Date | null;
}

export interface PeriodSelectorProps {
  value: PeriodSelectorValue;
  onChange: (value: PeriodSelectorValue) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({ value, onChange }) => {
  const options = [3, 6, 12];

  const range: DateRange = {
    from: value.from ?? undefined,
    to: value.to ?? undefined,
  };

  const labelForRange = () => {
    if (value.mode !== "custom" || !value.from || !value.to) return "Вибрати період";
    const fmt = (d: Date) => d.toLocaleDateString("uk-UA");
    return `${fmt(value.from)} — ${fmt(value.to)}`;
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground hidden sm:inline">Період:</span>
      <div className="flex flex-wrap gap-2">
        {options.map((m) => (
          <Button
            key={m}
            size="sm"
            variant={value.mode === "months" && value.months === m ? "default" : "outline"}
            className={value.mode === "months" && value.months === m ? "bg-primary text-primary-foreground" : ""}
            onClick={() => onChange({ mode: "months", months: m })}
          >
            {m} міс.
          </Button>
        ))}
        <Button
          size="sm"
          variant={value.mode === "all" ? "default" : "outline"}
          className={value.mode === "all" ? "bg-primary text-primary-foreground" : ""}
          onClick={() => onChange({ mode: "all" })}
        >
          Весь час
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant={value.mode === "custom" ? "default" : "outline"}
              className={value.mode === "custom" ? "bg-primary text-primary-foreground" : ""}
            >
              <CalendarIcon className="h-4 w-4 mr-1" /> {labelForRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-2" align="end">
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={range}
              onSelect={(r) => onChange({ mode: "custom", from: r?.from ?? null, to: r?.to ?? null })}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
