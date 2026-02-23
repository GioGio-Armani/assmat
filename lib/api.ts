import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiOk(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return apiError("Validation error", 400, error.flatten());
  }
  if (error instanceof Error) {
    return apiError(error.message, 400);
  }
  return apiError("Erreur inconnue", 500);
}
