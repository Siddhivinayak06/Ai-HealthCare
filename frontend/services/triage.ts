/**
 * Triage logic to prioritize patient cases based on AI findings.
 * Logic:
 * 🔴 High Risk/Severity + High Confidence -> Immediate
 * 🟠 High Risk/Severity + Low Confidence -> Urgent Review
 * 🟡 Medium Risk -> Routine Review
 */
export const triageCase = (analysis: {
    severity?: string;
    confidence_metrics?: {
        confidence: number;
        uncertainty_level: string;
    };
    diagnosis?: string;
}) => {
    const { severity, confidence_metrics } = analysis;

    let priority = 'low';
    let triageNote = 'Routine monitoring';

    const isHighSeverity = severity === 'High' || severity === 'Critical';
    const uncertainty = confidence_metrics?.uncertainty_level || 'LOW';

    if (isHighSeverity) {
        if (uncertainty === 'LOW') {
            priority = 'high';
            triageNote = 'Immediate Specialist Intervention Required';
        } else {
            priority = 'medium';
            triageNote = 'Urgent Doctor Review Needed (Low AI Certainty)';
        }
    } else if (severity === 'Medium') {
        priority = 'medium';
        triageNote = 'Follow-up within 24-48 hours';
    }

    return { priority, triageNote };
};
