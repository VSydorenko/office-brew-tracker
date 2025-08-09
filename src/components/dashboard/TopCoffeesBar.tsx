
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
 * ТОП-5 кави за кількістю.
 */
export interface TopCoffeeItem {
  coffee_name: string;
  total_qty: number;
}

export const TopCoffeesBar: React.FC<{ data: TopCoffeeItem[] }> = ({ data }) => {
  return (
    <ChartContainer
      config={{
        qty: {
          label: "Кількість",
          theme: { light: "hsl(var(--primary))", dark: "hsl(var(--primary))" },
        },
      }}
      className="w-full h-72"
    >
      <BarChart data={data}>
        <CartesianGrid vertical={false} strokeDasharray="4 4" />
        <XAxis dataKey="coffee_name" tickLine={false} axisLine={false} />
        <YAxis width={50} />
        <Bar
          dataKey="total_qty"
          name="Кількість"
          fill="var(--color-qty)"
          radius={[4, 4, 0, 0]}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              nameKey="qty"
              formatter={(value, name, item) => (
                <span>
                  {item?.payload?.coffee_name}: {Number(value).toLocaleString("uk-UA")}
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
