import { getSession } from "@/lib/auth"
import { AnalysisClient } from "@/components/analysis-client"

export default async function AnalysisPage() {
    const { user } = await getSession()

    return <AnalysisClient userRole={user?.role || "patient"} />
}
