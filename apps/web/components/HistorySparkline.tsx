'use client'

import React from 'react'
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts'
import type { TimeSeriesPoint } from '../../../packages/shared/types'

interface SparklineProps {
  data: TimeSeriesPoint[]
  color?: string
  height?: number
}

export function HistorySparkline({ data, color = '#FF6B00', height = 40 }: SparklineProps) {
  // If no data, render empty
  if (!data || data.length === 0) {
    return <div style={{ height }} className="w-full bg-slate-50 rounded-sm animate-pulse" />
  }

  // Find max for scaling
  const maxDown = Math.max(...data.map(d => d.down_count), 1)

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={[0, maxDown * 1.2]} hide />
          <Area
            type="monotone"
            dataKey="down_count"
            stroke={color}
            strokeWidth={1.5}
            fillOpacity={1}
            fill={`url(#spark-${color})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
