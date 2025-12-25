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
        <Card className="bg-white/5 border-white/10 overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-300">
                        <Activity className="h-4 w-4 text-primary" />
                        {title}
                    </CardTitle>
                    <div className={`flex items-center gap-1 text-xs font-medium ${improvement ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {improvement ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                        {Math.abs(latest.value - previous.value).toFixed(1)}% change
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
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
                                            <div className="bg-slate-900 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-xl">
                                                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">
                                                    {new Date(d.date).toLocaleDateString()} • {d.category}
                                                </p>
                                                <p className="text-sm font-bold text-white mb-0.5">{d.label}</p>
                                                <p className="text-xs text-slate-400">{d.sub}</p>
                                                <div className="mt-2 text-xs font-mono text-primary">
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
                                strokeWidth={3}
                                dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4, stroke: "#ffffff" }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
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
                <p className="text-[10px] text-slate-500 mt-4 text-center">
                    Longitudinal tracking of AI risk scores and diagnostic confidence markers.
                </p>
            </CardContent>
        </Card>
    )
}
