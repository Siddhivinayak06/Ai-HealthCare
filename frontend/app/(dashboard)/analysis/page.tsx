import { getSession } from "@/lib/auth"
import { AnalysisClient } from "@/components/analysis-client"
import { Scan, Brain, Sparkles, Zap } from "lucide-react"

export default async function AnalysisPage() {
    const { user } = await getSession()

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-20" />
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl" />

            <div className="relative p-4 lg:p-8 pt-16 lg:pt-8 space-y-8">
                {/* Enhanced Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                                <Scan className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                                    AI Image Analysis
                                </h1>
                                <p className="text-muted-foreground">
                                    Advanced medical imaging diagnostics powered by deep learning
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400">
                            <Brain className="h-4 w-4" />
                            <span className="text-sm font-medium">DenseNet121 Model</span>
                        </div>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bento-card p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                            <Scan className="h-6 w-6 text-violet-500" />
                        </div>
                        <div>
                            <p className="font-semibold">X-Ray Analysis</p>
                            <p className="text-sm text-muted-foreground">Chest & bone imaging</p>
                        </div>
                    </div>
                    <div className="bento-card p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-fuchsia-500/10 flex items-center justify-center">
                            <Brain className="h-6 w-6 text-fuchsia-500" />
                        </div>
                        <div>
                            <p className="font-semibold">CT Scan Analysis</p>
                            <p className="text-sm text-muted-foreground">Cross-sectional imaging</p>
                        </div>
                    </div>
                    <div className="bento-card p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-cyan-500" />
                        </div>
                        <div>
                            <p className="font-semibold">AI Confidence</p>
                            <p className="text-sm text-muted-foreground">Real-time scoring</p>
                        </div>
                    </div>
                </div>

                {/* Analysis Client */}
                <AnalysisClient userRole={user?.role || "patient"} />
            </div>
        </div>
    )
}
