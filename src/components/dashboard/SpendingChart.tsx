
import React from "react";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Графік витрат по місяцях.
 * Приймає масив точок, де є month (мітка) та total_spent (сума).
 */
export interface SpendingPoint {
  month: string;
  total_spent: number;
}

export const SpendingChart: React.FC<{ data: SpendingPoint[] }> = ({ data }) => {
  return (
    <ChartContainer
      config={{
        spent: {
          label: "Витрати",
          theme: { light: "hsl(var(--primary))", dark: "hsl(var(--primary))" },
        },
      }}
      className="w-full h-72"
    >
      <AreaChart data={data}>
        <CartesianGrid vertical={false} strokeDasharray="4 4" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis
          width={60}
          tickFormatter={(v) => `₴${Number(v).toLocaleString("uk-UA")}`}
        />
        <Area
          type="monotone"
          dataKey="total_spent"
          name="Витрати"
          stroke="var(--color-spent)"
          fill="var(--color-spent)"
          fillOpacity={0.15}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              nameKey="spent"
              formatter={(value) => (
                <span>₴{Number(value).toLocaleString("uk-UA")}</span>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  );
};
