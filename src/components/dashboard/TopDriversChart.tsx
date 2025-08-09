
import React from "react";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

/**
 * Стековий стовпчиковий графік поїздок ТОР-водіїв за місяцями.
 * Дані очікуються у вигляді об'єктів:
 * { month: 'Січ 2025', 'Ім'я водія 1': 3, 'Ім'я водія 2': 5, ... }
 */
export interface DriversStackPoint {
  month: string;
  [driverName: string]: string | number;
}

export const TopDriversChart: React.FC<{
  data: DriversStackPoint[];
  driverKeys: string[];
}> = ({ data, driverKeys }) => {
  const config = driverKeys.reduce((acc, key, idx) => {
    // Невеликі варіації кольорів через HSL
    const hue = 200 + idx * 30;
    acc[key] = {
      label: key,
      theme: {
        light: `hsl(${hue} 80% 45%)`,
        dark: `hsl(${hue} 80% 45%)`,
      },
    };
    return acc;
  }, {} as Record<string, { label: string; theme: Record<"light" | "dark", string> }>);

  return (
    <ChartContainer config={config} className="w-full h-72">
      <BarChart data={data} stackOffset="expand">
        <CartesianGrid vertical={false} strokeDasharray="4 4" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis hide />
        {driverKeys.map((k) => (
          <Bar key={k} dataKey={k} stackId="drivers" fill={`var(--color-${k})`} />
        ))}
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <span>
                  {name}: {Number(value).toLocaleString("uk-UA")}
                </span>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
      </BarChart>
    </ChartContainer>
  );
};
