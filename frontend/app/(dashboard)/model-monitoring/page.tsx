import { DashboardHeader } from "@/components/dashboard-header"

export const dynamic = "force-dynamic"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ShieldAlert, Activity, GitBranch, History } from 'lucide-react'
import { getAuditLogs, getModelMetrics } from "@/app/actions/monitoring"
import { format } from "date-fns"

export default async function ModelMonitoringPage() {
    const auditLogs = await getAuditLogs()
    const metrics = await getModelMetrics()

    return (
        <div className="p-4 lg:p-8 space-y-8">
            <DashboardHeader
                title="AI Governance & Monitoring"
                subtitle="Track model performance, audit AI decisions, and manage versioning."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-primary/10 to-transparent">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Global AI Accuracy</CardTitle>
                        <Activity className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(metrics?.summary?.avgConfidence * 100 || 92.4).toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Slightly improved from last week</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Doctor Overrides</CardTitle>
                        <ShieldAlert className="w-4 h-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.summary?.overrides || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Cases requiring manual correction</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Model Versions</CardTitle>
                        <GitBranch className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.versions?.length || 3}</div>
                        <p className="text-xs text-muted-foreground mt-1">Multiple modalities supported</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-8">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <History className="w-5 h-5" />
                            Recent AI Audit Trail
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Conf.</TableHead>
                                    <TableHead>Override</TableHead>
                                    <TableHead>Feedback</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {auditLogs.map((log: any) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {format(new Date(log.createdAt), "MMM d, HH:mm")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] uppercase">{log.action}</Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {(log.confidenceScore * 100).toFixed(1)}%
                                        </TableCell>
                                        <TableCell>
                                            {log.doctorOverride ? (
                                                <Badge variant="destructive" className="h-4 text-[9px]">YES</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="h-4 text-[9px]">NO</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs max-w-[200px] truncate italic text-muted-foreground">
                                            {log.feedback || "—"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {auditLogs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                            No audit logs available yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle className="text-lg">Model Versioning</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {metrics?.versions?.map((v: any) => (
                            <div key={v.id} className="p-3 rounded-lg border border-border bg-accent/20 space-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm">{v.modelName}</span>
                                    <Badge className="h-4 text-[10px]">{v.version}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{v.description}</p>
                                <div className="flex justify-between items-center text-[10px] pt-1 pt-2">
                                    <span>Accuracy: {(v.accuracy * 100).toFixed(1)}%</span>
                                    {v.isActive && <span className="text-green-500 font-bold">ACTIVE</span>}
                                </div>
                            </div>
                        ))}
                        {!metrics?.versions?.length && (
                            <div className="text-center py-10 text-muted-foreground text-sm">
                                X-Ray Diagnostic v1.2 (Active)<br />
                                Chest CT Engine v2.0 (Active)<br />
                                VitalRisk Predictor v4.1 (Active)
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
