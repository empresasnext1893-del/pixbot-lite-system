import { describe, expect, it } from "vitest";

// Fee calculation logic
const FEE_PERCENT = 0.20;
const FEE_FIXED = 3.00;

function calcWithdrawalFee(amount: number) {
  const fee = Math.round((amount * FEE_PERCENT + FEE_FIXED) * 100) / 100;
  const netAmount = Math.round((amount - fee) * 100) / 100;
  return { fee, netAmount };
}

describe("wallet withdrawal fees", () => {
  it("calculates fee correctly: 20% + R$3,00", () => {
    const { fee, netAmount } = calcWithdrawalFee(100);
    // 100 * 0.20 + 3 = 23
    expect(fee).toBe(23);
    expect(netAmount).toBe(77);
  });

  it("handles minimum withdrawal", () => {
    const { fee, netAmount } = calcWithdrawalFee(20);
    // 20 * 0.20 + 3 = 7
    expect(fee).toBe(7);
    expect(netAmount).toBe(13);
  });

  it("handles large amounts", () => {
    const { fee, netAmount } = calcWithdrawalFee(1000);
    // 1000 * 0.20 + 3 = 203
    expect(fee).toBe(203);
    expect(netAmount).toBe(797);
  });

  it("rounds correctly for decimal amounts", () => {
    const { fee, netAmount } = calcWithdrawalFee(50.50);
    // 50.50 * 0.20 + 3 = 13.10
    expect(fee).toBe(13.1);
    expect(netAmount).toBe(37.4);
  });

  it("handles edge case: very small amount", () => {
    const { fee, netAmount } = calcWithdrawalFee(15);
    // 15 * 0.20 + 3 = 6
    expect(fee).toBe(6);
    expect(netAmount).toBe(9);
  });

  it("ensures net amount is positive for valid withdrawals", () => {
    const amounts = [20, 50, 100, 500, 1000];
    amounts.forEach((amount) => {
      const { netAmount } = calcWithdrawalFee(amount);
      expect(netAmount).toBeGreaterThan(0);
    });
  });
});
