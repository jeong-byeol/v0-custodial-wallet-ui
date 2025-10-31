"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartData = [
  { date: "01/10", balance: 0.8 },
  { date: "01/11", balance: 0.9 },
  { date: "01/12", balance: 1.1 },
  { date: "01/13", balance: 1.5 },
  { date: "01/14", balance: 1.3 },
  { date: "01/15", balance: 1.2 },
]

const chartConfig = {
  balance: {
    label: "Balance",
    color: "hsl(var(--chart-1))",
  },
}

export function BalanceChart() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">자산 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-balance)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-balance)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-muted-foreground" />
            <YAxis tickLine={false} axisLine={false} className="text-muted-foreground" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="var(--color-balance)"
              fill="url(#fillBalance)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
