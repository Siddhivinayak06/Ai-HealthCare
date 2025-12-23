/**
 * Structured logger for healthcare application observability.
 * Outputs JSON for easy parsing by log aggregators (CloudWatch, Datadog, etc.)
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
    userId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    duration?: number;
    [key: string]: unknown;
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: LogContext;
    error?: {
        message: string;
        stack?: string;
        code?: string;
    };
}

function formatError(error: unknown): LogEntry["error"] | undefined {
    if (!error) return undefined;

    if (error instanceof Error) {
        return {
            message: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
            code: (error as Error & { code?: string }).code,
        };
    }

    return { message: String(error) };
}

function log(level: LogLevel, message: string, context?: LogContext, error?: unknown) {
    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
    };
    if (context) entry.context = context;
    if (error) entry.error = formatError(error);

    // In production, output as JSON for log aggregation
    if (process.env.NODE_ENV === "production") {
        console[level === "debug" ? "log" : level](JSON.stringify(entry));
    } else {
        // In development, output human-readable format
        const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
        console[level === "debug" ? "log" : level](prefix, message, context || "", error || "");
    }
}

export const logger = {
    info: (message: string, context?: LogContext) =>
        log("info", message, context),

    warn: (message: string, context?: LogContext) =>
        log("warn", message, context),

    error: (message: string, error?: unknown, context?: LogContext) =>
        log("error", message, context, error),

    debug: (message: string, context?: LogContext) => {
        if (process.env.NODE_ENV === "development") {
            log("debug", message, context);
        }
    },

    // Healthcare-specific audit logging
    audit: (action: string, userId: string, context?: Omit<LogContext, "userId" | "action">) => {
        log("info", `AUDIT: ${action}`, { action, userId, ...context });
    },
};
