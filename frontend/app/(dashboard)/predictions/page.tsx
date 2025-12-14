import { DashboardHeader } from "@/components/dashboard-header"
import { StatCard } from "@/components/stat-card"
import { PredictionTimeline } from "@/components/prediction-timeline"
import { ModelAccuracy } from "@/components/model-accuracy"
import { PatientPredictionsList } from "@/components/patient-predictions-list"
import { RiskDistribution } from "@/components/risk-distribution"
import { RiskSimulator } from "@/components/risk-simulator"
import { ImageDiagnostics } from "@/components/image-diagnostics"
import { BrainIcon, CheckCircleIcon, AlertCircleIcon, ActivityIcon } from "@/components/icons"
import { getPredictionStats, getRiskDistribution, getModelAccuracy, getPatientPredictions } from "@/app/actions/dashboard"

export const dynamic = 'force-dynamic'

export default async function PredictionsPage() {
  // Fetch all data in parallel for better performance
  const [stats, riskDistributionData, modelAccuracyData, patientPredictionsData] = await Promise.all([
    getPredictionStats(),
    getRiskDistribution(),
    getModelAccuracy(),
    getPatientPredictions(5)
  ])

  return (
    <div className="p-4 lg:p-8 pt-16 lg:pt-8 space-y-8">
      <DashboardHeader
        title="Health Predictions"
        subtitle="AI-powered disease risk predictions and health condition forecasting"
        showActions={false}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Active Predictions"
          value={stats.activePredictions.toLocaleString()}
          change={stats.predictionsThisWeek > 0 ? `+${stats.predictionsThisWeek} this week` : "No predictions yet"}
          changeType={stats.predictionsThisWeek > 0 ? "positive" : "neutral"}
          icon={BrainIcon}
        />
        <StatCard
          title="High Accuracy Rate"
          value={`${stats.accuracyRate || 0}%`}
          change={stats.accuracyRate > 90 ? "Excellent performance" : stats.accuracyRate > 0 ? "AI confidence" : "No data yet"}
          changeType={stats.accuracyRate > 85 ? "positive" : "neutral"}
          icon={CheckCircleIcon}
        />
        <StatCard
          title="High Risk Patients"
          value={stats.highRiskPatients.toString()}
          change={stats.highRiskPatients > 0 ? "Requires attention" : "All clear"}
          changeType={stats.highRiskPatients > 0 ? "negative" : "positive"}
          icon={AlertCircleIcon}
        />
        <StatCard
          title="Predictions Today"
          value={stats.predictionsToday.toString()}
          change={stats.predictionsToday > 0 ? "Active processing" : "None today"}
          changeType={stats.predictionsToday > 0 ? "positive" : "neutral"}
          icon={ActivityIcon}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskSimulator />
        <ImageDiagnostics />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <RiskDistribution data={riskDistributionData} />
        </div>
        <div className="lg:col-span-5">
          <ModelAccuracy data={modelAccuracyData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <PatientPredictionsList data={patientPredictionsData} />
        </div>
        <div className="lg:col-span-5">
          <PredictionTimeline />
        </div>
      </div>
    </div>
  )
}

