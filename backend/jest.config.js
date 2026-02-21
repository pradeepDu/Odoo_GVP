/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/__tests__"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  modulePathIgnorePatterns: ["dist", "generated"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts"],
};
