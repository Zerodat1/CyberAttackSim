import { customAlphabet } from "nanoid";

const alphabet = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const generateSuffix = customAlphabet(alphabet, 10);

export function generateTransactionNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `TXN-${datePart}-${generateSuffix()}`;
}
