import { DashboardHeader } from "@/components/dashboard-header"
import { StatCard } from "@/components/stat-card"
import { PredictionTimeline } from "@/components/prediction-timeline"
import { ModelAccuracy } from "@/components/model-accuracy"
import { PatientPredictionsList } from "@/components/patient-predictions-list"
import { RiskDistribution } from "@/components/risk-distribution"
import { BrainIcon, CheckCircleIcon, AlertCircleIcon, ActivityIcon } from "@/components/icons"

export default function PredictionsPage() {
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
          value="1,847"
          change="+142 this week"
          changeType="positive"
          icon={BrainIcon}
        />
        <StatCard
          title="High Accuracy Rate"
          value="91.2%"
          change="+2.1% improvement"
          changeType="positive"
          icon={CheckCircleIcon}
        />
        <StatCard
          title="High Risk Patients"
          value="127"
          change="Requires attention"
          changeType="negative"
          icon={AlertCircleIcon}
        />
        <StatCard
          title="Predictions Today"
          value="284"
          change="Processing 12 more"
          changeType="neutral"
          icon={ActivityIcon}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <RiskDistribution />
        </div>
        <div className="lg:col-span-5">
          <ModelAccuracy />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <PatientPredictionsList />
        </div>
        <div className="lg:col-span-5">
          <PredictionTimeline />
        </div>
      </div>
    </div>
  )
}
