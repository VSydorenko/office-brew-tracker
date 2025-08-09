
import React from "react";
import { Button } from "@/components/ui/button";

/**
 * Швидкий вибір періоду в місяцях.
 * Дозволяє перемикатися між 3/6/12 місяцями.
 */
export interface PeriodSelectorProps {
  value: number;
  onChange: (months: number) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  value,
  onChange,
}) => {
  const options = [3, 6, 12];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground hidden sm:inline">
        Період:
      </span>
      <div className="flex gap-2">
        {options.map((m) => (
          <Button
            key={m}
            size="sm"
            variant={value === m ? "default" : "outline"}
            className={value === m ? "bg-primary text-primary-foreground" : ""}
            onClick={() => onChange(m)}
          >
            {m} міс.
          </Button>
        ))}
      </div>
    </div>
  );
};
