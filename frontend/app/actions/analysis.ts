"use server";

import { db } from "@/lib/db";
import { scans, diagnoses, riskPredictions, auditLogs } from "@/lib/schema";
import { getSession } from "@/lib/auth";
import { triageCase } from "@/services/triage";
import { logActivity } from "./activity";
import { revalidatePath } from "next/cache";

export async function saveImageAnalysis(data: {
    patientId?: string;
    scanType: string;
    imageUrl?: string;
    diagnosis: string;
    confidence: number;
    severity: string;
    findings: any;
    recommendations?: string;
    processingTime: number;
    modelVersion: string;
}) {
    const { user } = await getSession();
    if (!user) throw new Error("Not authorized");

    try {
        // 1. Create Scan record
        const scanResult = await db.insert(scans).values({
            uploadedBy: user.id,
            patientId: data.patientId || "",
            scanType: data.scanType,
            imageUrl: data.imageUrl || "",
        }).returning();

        const newScan = scanResult[0];

        // 2. Create AI Diagnosis record
        const diagnosisResult = await db.insert(diagnoses).values({
            scanId: newScan.id,
            predictedCondition: data.diagnosis,
            confidenceScore: data.confidence.toString(),
            riskLevel: data.severity,
            explanation: data.findings,
            modelVersion: data.modelVersion,
        }).returning();

        const newDiagnosis = diagnosisResult[0];

        // AI Triage
        const triageResult = triageCase({
            severity: data.severity,
            confidence_metrics: {
                confidence: data.confidence,
                uncertainty_level: data.findings?.uncertainty_level || 'LOW'
            }
        });

        // Record Audit
        await db.insert(auditLogs).values({
            userId: user.id,
            action: 'PREDICTION',
            entityType: 'IMAGE_ANALYSIS',
            entityId: newScan.id,
            findings: data.findings,
            confidence: data.confidence.toString(),
        });

        await logActivity("Image analysis completed", "analysis", {
            scanType: data.scanType,
            severity: data.severity,
            analysisId: newScan.id,
            priority: triageResult.priority
        });

        revalidatePath("/analysis");
        return { success: true, data: { ...newScan, ...newDiagnosis, triage: triageResult } };
    } catch (error) {
        console.error("Save image analysis error:", error);
        return { success: false, error: "Failed to save analysis" };
    }
}

export async function saveRiskPrediction(data: {
    patientId: string;
    healthRecordId?: string;
    condition: string;
    riskScore: number;
    severity: string;
    contributingFactors: string;
    recommendations: string;
}) {
    const { user } = await getSession();
    if (!user) throw new Error("Not authorized");

    try {
        const result = await db.insert(riskPredictions).values({
            userId: user.id,
            patientId: data.patientId,
            healthRecordId: data.healthRecordId || null,
            condition: data.condition,
            riskScore: data.riskScore.toString(),
            severity: data.severity,
            contributingFactors: data.contributingFactors,
            recommendations: data.recommendations,
            modelVersion: 'HealthPredict v2.1',
        }).returning();

        const newPrediction = result[0];

        await logActivity("Risk prediction generated", "prediction", {
            patientId: data.patientId,
            condition: data.condition,
            riskScore: data.riskScore
        });

        revalidatePath("/risk");
        return { success: true, data: newPrediction };
    } catch (error) {
        console.error("Save risk prediction error:", error);
        return { success: false, error: "Failed to save risk prediction" };
    }
}
