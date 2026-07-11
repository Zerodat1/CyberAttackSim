import { generateTransactionNumber } from "./transaction-number";

describe("generateTransactionNumber", () => {
  it("produces a unique, prefixed, date-stamped transaction number", () => {
    const a = generateTransactionNumber();
    const b = generateTransactionNumber();

    expect(a).toMatch(/^TXN-\d{8}-[0-9A-Z]{10}$/);
    expect(b).toMatch(/^TXN-\d{8}-[0-9A-Z]{10}$/);
    expect(a).not.toEqual(b);
  });
});
