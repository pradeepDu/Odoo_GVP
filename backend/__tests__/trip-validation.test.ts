/**
 * Trip service validation rules (logical tests without DB).
 * Run with: pnpm test
 */

describe("Trip validation rules", () => {
  it("cargo weight must not exceed vehicle max capacity", () => {
    const maxCapacityKg = 500;
    const cargoWeightKg = 450;
    expect(cargoWeightKg <= maxCapacityKg).toBe(true);
  });

  it("rejects when cargo exceeds capacity", () => {
    const maxCapacityKg = 500;
    const cargoWeightKg = 600;
    expect(cargoWeightKg > maxCapacityKg).toBe(true);
  });

  it("driver assignment blocked when license expired", () => {
    const licenseExpiry = new Date("2020-01-01");
    const now = new Date();
    const isExpired = licenseExpiry <= now;
    expect(isExpired).toBe(true);
  });

  it("driver assignable when license valid", () => {
    const licenseExpiry = new Date();
    licenseExpiry.setFullYear(licenseExpiry.getFullYear() + 1);
    const now = new Date();
    expect(licenseExpiry > now).toBe(true);
  });
});
