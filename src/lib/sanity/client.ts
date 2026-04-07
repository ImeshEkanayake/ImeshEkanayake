import { createClient } from "next-sanity";
import { apiVersion, canWriteToSanity, dataset, isSanityConfigured, projectId, writeToken } from "./env";

export function getReadClient() {
  if (!isSanityConfigured()) {
    return null;
  }

  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: process.env.NODE_ENV === "production",
    perspective: "published",
    stega: false,
  });
}

export function getWriteClient() {
  if (!canWriteToSanity()) {
    return null;
  }

  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: writeToken,
    perspective: "published",
    stega: false,
  });
}
