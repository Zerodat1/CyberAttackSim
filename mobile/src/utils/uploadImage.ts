import { apiClient } from "@/api/client";

export type UploadPurpose = "avatars" | "id-documents" | "room-covers" | "withdrawal-proofs";

/**
 * Uploads a base64 image data URI to the backend, which forwards it to
 * object storage (R2/S3, or local disk in dev) and returns a public URL.
 * The data URI itself is never persisted anywhere — only this URL is.
 */
export async function uploadImageDataUri(dataUri: string, purpose: UploadPurpose): Promise<string> {
  const { data } = await apiClient.post<{ url: string }>("/uploads/image", { dataUri, purpose });
  return data.url;
}
