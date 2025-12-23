import { NextResponse } from "next/server";

/**
 * Standardized API response helpers for consistent error handling
 */

interface SuccessResponse<T> {
    success: true;
    data: T;
}

interface ErrorResponse {
    success: false;
    error: {
        message: string;
        code?: string;
        details?: unknown;
    };
}

/**
 * Create a success response
 */
export function successResponse<T>(data: T, status = 200): NextResponse<SuccessResponse<T>> {
    return NextResponse.json({ success: true, data }, { status });
}

/**
 * Create an error response
 */
export function errorResponse(
    message: string,
    status = 500,
    options?: { code?: string; details?: unknown }
): NextResponse<ErrorResponse> {
    const errorObj: ErrorResponse["error"] = { message };
    if (options?.code) errorObj.code = options.code;
    if (options?.details) errorObj.details = options.details;

    return NextResponse.json(
        { success: false as const, error: errorObj },
        { status }
    );
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
    errors: Record<string, string[]>
): NextResponse<ErrorResponse> {
    return NextResponse.json(
        {
            success: false,
            error: {
                message: "Validation failed",
                code: "VALIDATION_ERROR",
                details: errors,
            },
        },
        { status: 400 }
    );
}

/**
 * Create an unauthorized error response
 */
export function unauthorizedResponse(message = "Unauthorized"): NextResponse<ErrorResponse> {
    return errorResponse(message, 401, { code: "AUTH_REQUIRED" });
}

/**
 * Create a forbidden error response
 */
export function forbiddenResponse(message = "Forbidden"): NextResponse<ErrorResponse> {
    return errorResponse(message, 403, { code: "INSUFFICIENT_ROLE" });
}

/**
 * Create a not found error response
 */
export function notFoundResponse(entity = "Resource"): NextResponse<ErrorResponse> {
    return errorResponse(`${entity} not found`, 404, { code: "NOT_FOUND" });
}
