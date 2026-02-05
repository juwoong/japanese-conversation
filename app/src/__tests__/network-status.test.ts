/**
 * C3: useNetworkStatus must be integrated into key screens
 *
 * Tests verify that:
 * 1. OfflineBanner component module exists
 * 2. HomeScreen source imports useNetworkStatus
 * 3. HomeScreen source renders OfflineBanner
 *
 * NOTE: jest.resetModules() in beforeAll is required for expo runtime init.
 */

describe("C3: Network status integration", () => {
  beforeAll(() => {
    jest.resetModules();
  });

  test("OfflineBanner component module should exist", () => {
    expect(() => require("../components/OfflineBanner")).not.toThrow();
  });

  test("OfflineBanner should export a default component", () => {
    const mod = require("../components/OfflineBanner");
    expect(typeof mod.default).toBe("function");
  });

  test("HomeScreen source should import useNetworkStatus", () => {
    const fs = require("fs");
    const path = require("path");
    const homeSource = fs.readFileSync(
      path.join(__dirname, "../screens/HomeScreen.tsx"),
      "utf8"
    );
    expect(homeSource).toContain("useNetworkStatus");
  });

  test("HomeScreen source should render OfflineBanner", () => {
    const fs = require("fs");
    const path = require("path");
    const homeSource = fs.readFileSync(
      path.join(__dirname, "../screens/HomeScreen.tsx"),
      "utf8"
    );
    expect(homeSource).toContain("OfflineBanner");
  });
});
