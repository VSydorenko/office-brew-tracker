
import React from "react";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";

/**
 * Donut-графік розподілу статусів покупок.
 */
export interface StatusItem {
  status: string;
  cnt: number;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "hsl(var(--muted-foreground))",
  active: "hsl(25 95% 53%)",
  locked: "hsl(142 70% 45%)",
  amount_changed: "hsl(280 70% 50%)",
};

export const StatusDonut: React.FC<{ data: StatusItem[] }> = ({ data }) => {
  const total = data.reduce((s, d) => s + Number(d.cnt), 0);

  return (
    <ChartContainer
      config={{
        status: {
          label: "Статус",
          theme: { light: "hsl(var(--primary))", dark: "hsl(var(--primary))" },
        },
      }}
      className="w-full h-72"
    >
      <PieChart>
        <Pie
          data={data}
          dataKey="cnt"
          nameKey="status"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          stroke="transparent"
          paddingAngle={2}
        >
          {data.map((entry, index) => {
            const color =
              STATUS_COLORS[entry.status] || "hsl(var(--primary))";
            return <Cell key={`cell-${index}`} fill={color} />;
          })}
        </Pie>
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <span>
                  {name}: {Number(value).toLocaleString("uk-UA")} (
                  {total ? Math.round((Number(value) / total) * 100) : 0}%)
                </span>
              )}
              nameKey="status"
            />
          }
        />
        <ChartLegend
          content={<ChartLegendContent nameKey="status" />}
          verticalAlign="bottom"
        />
      </PieChart>
    </ChartContainer>
  );
};
