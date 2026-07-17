import ReactECharts from "echarts-for-react";
import { analyticsTheme } from "./analyticsTheme";

export interface AnalyticsHorizontalBarItem {
  label: string;
  value: number;
}

interface AnalyticsHorizontalBarChartProps {
  title?: string;
  subtitle?: string;
  data: AnalyticsHorizontalBarItem[];
  height?: number;
}

export default function AnalyticsHorizontalBarChart({
  title,
  subtitle,
  data,
  height = 360,
}: AnalyticsHorizontalBarChartProps) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-dashed bg-muted/20"
        style={{ height }}
      >
        <div className="text-center">
          <div className="text-lg font-semibold">No eligibility barriers</div>

          <div className="mt-2 text-sm text-muted-foreground">
            Every evaluated student is currently eligible.
          </div>
        </div>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.value - a.value);

  const option = {
    ...analyticsTheme,

    title: {
      text: title,
      subtext: subtitle,
      left: 0,
    },

    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },

    grid: {
      left: 160,
      right: 40,
      top: 70,
      bottom: 30,
      containLabel: true,
    },

    xAxis: {
      type: "value",
      minInterval: 1,
    },

    yAxis: {
      type: "category",
      inverse: true,
      data: sorted.map((x) => x.label),
    },

    series: [
      {
        type: "bar",

        data: sorted.map((x) => x.value),

        barWidth: 24,

        label: {
          show: true,
          position: "right",
        },

        itemStyle: {
          color: "#2563eb",
          borderRadius: [0, 12, 12, 0],
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{
        width: "100%",
        height,
      }}
    />
  );
}
