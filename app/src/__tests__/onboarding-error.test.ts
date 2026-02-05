/**
 * C8: OnboardingScreen must handle errors gracefully
 *
 * Tests verify that:
 * 1. OnboardingScreen source has error state handling (not silent empty list)
 * 2. OnboardingScreen source has user-facing error feedback on save
 * 3. OnboardingScreen source has a sign-out option
 *
 * Approach: Source-code pattern assertions via fs.readFileSync.
 * NOTE: jest.resetModules() in beforeAll is required for expo runtime init.
 */

describe("C8: Onboarding error handling", () => {
  let source: string;

  beforeAll(() => {
    jest.resetModules();
    const fs = require("fs");
    const path = require("path");
    source = fs.readFileSync(
      path.join(__dirname, "../screens/OnboardingScreen.tsx"),
      "utf8"
    );
  });

  test("should have error state for persona loading failures", () => {
    // After C8 fix: OnboardingScreen should track error state
    expect(source).toMatch(/\berror\b.*useState/i);
  });

  test("should display retry button when loading fails", () => {
    // After C8 fix: should render a "다시 시도" (retry) button
    expect(source).toContain("다시 시도");
  });

  test("should show error feedback when persona save fails", () => {
    // After C8 fix: catch block should set visible error, not just console.error
    expect(source).toMatch(/catch[\s\S]*?(Alert\.alert|setError)/);
  });

  test("should have a sign-out option visible", () => {
    // After C8 fix: should have sign-out or back-to-auth option
    expect(source).toMatch(/로그아웃|다른 계정|signOut/);
  });
});
