/**
 * Single source of truth for consent versioning (Master §9.7). The string on
 * the privacy notice must match what is written into `consents.notice_version`
 * by every form. Bump this when the notice text changes.
 */
export const NOTICE_VERSION = "v1 — 2026-08-04";
