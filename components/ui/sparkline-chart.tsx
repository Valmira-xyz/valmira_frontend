"use client"

import { LineChart, Line, ResponsiveContainer } from "recharts"

interface SparklineChartProps {
  data: number[]
  color: string
}

export function SparklineChart({ data, color }: SparklineChartProps) {
  const chartData = data.map((value, index) => ({ value, index }))

  return (
    <ResponsiveContainer width="100%" height={50}>
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

