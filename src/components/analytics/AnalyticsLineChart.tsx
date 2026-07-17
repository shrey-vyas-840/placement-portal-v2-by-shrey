import ReactECharts from "echarts-for-react";

export interface AnalyticsLineChartDataPoint {
  label: string;
  value: number;
}

interface AnalyticsLineChartProps {
  title?: string;
  subtitle?: string;
  data: AnalyticsLineChartDataPoint[];
  height?: number;
}

export default function AnalyticsLineChart({
  title,
  subtitle,
  data,
  height = 340,
}: AnalyticsLineChartProps) {
const option = {
  backgroundColor: "transparent",

  animation: true,

  animationDuration: 900,

  animationEasing: "cubicOut",

  tooltip: {
    trigger: "axis",

    backgroundColor: "#111827",

    borderWidth: 0,

    textStyle: {
      color: "#ffffff",
    },

    axisPointer: {
      type: "cross",
    },
  },

  toolbox: {
    right: 10,

    feature: {
      saveAsImage: {
        title: "Export PNG",
      },

      restore: {
        title: "Reset",
      },

      dataZoom: {},
    },
  },

  dataZoom: [
    {
      type: "inside",
    },

    {
      type: "slider",
      height: 18,
    },
  ],

  grid: {
    left: 25,
    right: 25,
    top: 80,
    bottom: 80,
    containLabel: true,
  },

  title: {
    text: title,

    subtext: subtitle,

    left: 0,

    textStyle: {
      fontSize: 18,
      fontWeight: 700,
    },

    subtextStyle: {
      fontSize: 12,
    },
  },

  xAxis: {
    type: "category",

    boundaryGap: false,

    data: data.map((item) => item.label),

    axisLine: {
      show: false,
    },

    axisTick: {
      show: false,
    },

    splitLine: {
      show: false,
    },
  },

  yAxis: {
    type: "value",

    splitLine: {
      lineStyle: {
        type: "dashed",
      },
    },
  },

  series: [
    {
      type: "line",

      smooth: 0.4,

      symbol: "circle",

      symbolSize: 8,

      showSymbol: true,

      sampling: "lttb",

      lineStyle: {
        width: 4,
      },

      areaStyle: {},

      emphasis: {
        focus: "series",
      },

      data: data.map((item) => item.value),
    },
  ],
};

if (!data.length) {
  return (
    <div
      className="flex items-center justify-center rounded-2xl border border-dashed bg-muted/20"
      style={{
        height,
      }}
    >
      <div className="text-center">

        <div className="text-lg font-semibold">
          No trend data available
        </div>

        <div className="mt-2 text-sm text-muted-foreground">
          The chart will automatically appear once applications are received.
        </div>

      </div>
    </div>
  );
}

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