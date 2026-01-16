"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"

interface TrendData {
    date: string
    category: string
    value: number
    label: string
    sub: string
}

interface PatientTrendChartProps {
    data: TrendData[]
    title?: string
}

export function PatientTrendChart({ data, title = "Health Progress Trend" }: PatientTrendChartProps) {
    if (!data || data.length < 2) return null

    const latest = data[data.length - 1]
    const previous = data[data.length - 2]
    const improvement = previous.value > latest.value

    return (
        <Card className="bg-white/5 dark:bg-white/5 bg-slate-50 border-slate-200/50 dark:border-white/10 overflow-hidden w-full">
            <CardHeader className="p-3 pb-1">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-slate-500 dark:text-slate-300">
                        <Activity className="h-3 w-3 text-primary" />
                        {title}
                    </CardTitle>
                    <div className={`flex items-center gap-1 text-[10px] font-medium ${improvement ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {improvement ? <TrendingDown className="h-2.5 w-2.5" /> : <TrendingUp className="h-2.5 w-2.5" />}
                        {Math.abs(latest.value - previous.value).toFixed(1)}% change
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <div className="h-[100px] w-full overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis
                                dataKey="date"
                                hide
                            />
                            <YAxis
                                hide
                                domain={[0, 100]}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const d = payload[0].payload as TrendData
                                        return (
                                            <div className="bg-slate-900 border border-white/10 p-2 rounded-lg shadow-xl backdrop-blur-xl text-xs">
                                                <p className="text-[9px] text-slate-500 font-bold uppercase mb-0.5">
                                                    {new Date(d.date).toLocaleDateString()} • {d.category}
                                                </p>
                                                <p className="text-xs font-bold text-white">{d.label}</p>
                                                <div className="text-[10px] font-mono text-primary">
                                                    Score: {d.value.toFixed(1)}%
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="url(#lineGradient)"
                                strokeWidth={2}
                                isAnimationActive={true}
                                animationDuration={1500}
                                animationEasing="ease-in-out"
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 0 }}
                            />
                            <defs>
                                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#8b5cf6" />
                                    <stop offset="100%" stopColor="#d946ef" />
                                </linearGradient>
                            </defs>
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
