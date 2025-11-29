"use client";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

type Props = {
  data: Array<{
    monthKey: string;
    revenue: number;
    netProfit: number;
  }>;
};

export function RevenueTrendChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="monthKey" stroke="#475569" />
        <YAxis stroke="#475569" />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="revenue" stroke="#0891b2" strokeWidth={2} />
        <Line type="monotone" dataKey="netProfit" stroke="#10b981" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}











