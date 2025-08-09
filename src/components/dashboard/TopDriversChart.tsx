
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
  const colors = driverKeys.map((_, idx) => {
    const hue = 200 + idx * 30;
    return `hsl(${hue} 80% 45%)`;
  });
  const config = driverKeys.reduce((acc, key) => {
    acc[key] = { label: key };
    return acc;
  }, {} as Record<string, { label: string }>)

  return (
    <ChartContainer config={config} className="w-full h-72">
      <BarChart data={data}>
        <CartesianGrid vertical={false} strokeDasharray="4 4" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis hide />
        {driverKeys.map((k, idx) => (
          <Bar key={k} dataKey={k} stackId="drivers" fill={colors[idx]} />
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
