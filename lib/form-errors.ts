import type { ZodError } from "zod";

export type FieldError = { path: string; message: string };

/** First issue for a given field path, for rendering per-field errors. */
export function fieldError(issues: FieldError[] | undefined, path: string): string | undefined {
  return issues?.find((issue) => issue.path === path)?.message;
}

/** Convert a Zod error into per-field messages keyed by dotted path (D-15). */
export function issuesFromZod(error: ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    path: issue.path.join(".") || "form",
    message: issue.message,
  }));
}
