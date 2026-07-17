import ReactECharts from "echarts-for-react";
import { analyticsTheme } from "./analyticsTheme";

export interface AnalyticsStackedProgressItem {
  label: string;
  applied: number;
  remaining: number;
}

interface AnalyticsStackedProgressChartProps {
  title?: string;
  subtitle?: string;
  data: AnalyticsStackedProgressItem[];
  height?: number;
}

export default function AnalyticsStackedProgressChart({
  title,
  subtitle,
  data,
  height = 420,
}: AnalyticsStackedProgressChartProps) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-dashed bg-muted/20"
        style={{ height }}
      >
        <div className="text-center">
          <div className="text-lg font-semibold">No participation data available</div>

          <div className="mt-2 text-sm text-muted-foreground">
            This chart will appear once eligible students are evaluated.
          </div>
        </div>
      </div>
    );
  }

  const sorted = [...data].sort(
    (a, b) =>
      b.applied / (b.applied + b.remaining || 1) - a.applied / (a.applied + a.remaining || 1),
  );

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

    legend: {
      bottom: 0,
    },

    grid: {
      left: 220,
      right: 40,
      top: 80,
      bottom: 60,
      containLabel: true,
    },

    xAxis: {
      type: "value",
      minInterval: 1,
    },

    yAxis: {
      type: "category",
      data: sorted.map((x) => x.label),
    },

    series: [
      {
        name: "Applied",
        type: "bar",
        stack: "students",
        barWidth: 34,

        itemStyle: {
          color: "#2563eb",
          borderRadius: [12, 0, 0, 12],
        },

        label: {
          show: true,
          position: "inside",
          formatter: ({ value }: any) => value || "",
        },

        emphasis: {
          focus: "series",
        },

        data: sorted.map((x) => x.applied),
      },

      {
        name: "Remaining",
        type: "bar",
        stack: "students",
        barWidth: 34,

        itemStyle: {
          color: "#dbeafe",
          borderRadius: [0, 12, 12, 0],
        },

        label: {
          show: true,
          position: "insideRight",
          formatter: ({ value }: any) => value || "",
        },

        emphasis: {
          focus: "series",
        },

        data: sorted.map((x) => x.remaining),
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
