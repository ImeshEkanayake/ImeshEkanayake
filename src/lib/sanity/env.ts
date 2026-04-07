export const apiVersion = "2026-04-04";
export const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || "production";
export const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || "";
export const readToken = process.env.SANITY_API_READ_TOKEN || "";
export const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
export const studioBasePath = "/studio";
export const studioTitle = "Narrative Portfolio Studio";

export function isSanityConfigured() {
  return Boolean(projectId && dataset);
}

export function canWriteToSanity() {
  return Boolean(projectId && dataset && writeToken);
}
