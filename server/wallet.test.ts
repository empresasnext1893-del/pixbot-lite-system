import { describe, expect, it } from "vitest";

// Fee calculation logic
const FEE_PERCENT = 0.20;
const FEE_FIXED = 3.00;

function calcWithdrawalFee(amount: number) {
  const fee = FEE_FIXED;
  const netAmount = Math.round((amount - fee) * 100) / 100;
  return { fee, netAmount };
}

describe("wallet withdrawal fees", () => {
  it("calculates fee correctly: R$3,00 fixo", () => {
    const { fee, netAmount } = calcWithdrawalFee(100);
    // 100 - 3 = 97
    expect(fee).toBe(3);
    expect(netAmount).toBe(97);
  });

  it("handles minimum withdrawal", () => {
    const { fee, netAmount } = calcWithdrawalFee(10);
    // 10 - 3 = 7
    expect(fee).toBe(3);
    expect(netAmount).toBe(7);
  });

  it("handles large amounts", () => {
    const { fee, netAmount } = calcWithdrawalFee(1000);
    // 1000 - 3 = 997
    expect(fee).toBe(3);
    expect(netAmount).toBe(997);
  });

  it("rounds correctly for decimal amounts", () => {
    const { fee, netAmount } = calcWithdrawalFee(50.50);
    // 50.50 - 3 = 47.50
    expect(fee).toBe(3);
    expect(netAmount).toBe(47.5);
  });

  it("handles edge case: very small amount", () => {
    const { fee, netAmount } = calcWithdrawalFee(5);
    // 5 - 3 = 2
    expect(fee).toBe(3);
    expect(netAmount).toBe(2);
  });

  it("ensures net amount is positive for valid withdrawals", () => {
    const amounts = [20, 50, 100, 500, 1000];
    amounts.forEach((amount) => {
      const { netAmount } = calcWithdrawalFee(amount);
      expect(netAmount).toBeGreaterThan(0);
    });
  });
});
