import * as echarts from "echarts";

export const analyticsGradient = new echarts.graphic.LinearGradient(
  0,
  0,
  0,
  1,
  [
    {
      offset: 0,
      color: "rgba(59,130,246,0.30)",
    },
    {
      offset: 1,
      color: "rgba(59,130,246,0.02)",
    },
  ],
);

export const analyticsTheme = {
  color: ["#3b82f6"],

  textStyle: {
    fontFamily: "Inter, sans-serif",
  },

  animationDuration: 900,

  animationDurationUpdate: 500,

  animationEasing: "cubicOut",

  grid: {
    left: 24,
    right: 24,
    top: 70,
    bottom: 55,
    containLabel: true,
  },

  tooltip: {
    backgroundColor: "#111827",
    borderWidth: 0,
    textStyle: {
      color: "#ffffff",
    },
  },

  axisPointer: {
    lineStyle: {
      width: 1.5,
    },
  },
};