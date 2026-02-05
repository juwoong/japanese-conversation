/**
 * C6: textLight color must meet WCAG AA contrast ratio
 *
 * Tests verify that:
 * 1. textLight on background meets 4.5:1 ratio
 * 2. textLight on surface meets 4.5:1 ratio
 * 3. textLight on borderLight meets 3:1 ratio (large text minimum)
 */

// Relative luminance calculation per WCAG 2.0
function hexToRgb(hex: string): [number, number, number] {
  // Support both #fff and #ffffff formats
  let h = hex.replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
  if (!result) throw new Error(`Invalid hex: ${hex}`);
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("C6: Theme color contrast compliance", () => {
  // Import colors from theme — this reflects the actual theme values
  let colors: any;

  beforeAll(() => {
    // Re-require to get fresh module
    jest.resetModules();
    colors = require("../constants/theme").colors;
  });

  test("textLight on background should meet WCAG AA (4.5:1)", () => {
    const ratio = contrastRatio(colors.textLight, colors.background);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test("textLight on surface (#fff) should meet WCAG AA (4.5:1)", () => {
    const ratio = contrastRatio(colors.textLight, colors.surface);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test("textLight on borderLight should meet WCAG AA-large (3:1)", () => {
    const ratio = contrastRatio(colors.textLight, colors.borderLight);
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });

  test("textMuted on background should meet WCAG AA (4.5:1)", () => {
    const ratio = contrastRatio(colors.textMuted, colors.background);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test("primary on surface should meet WCAG AA (4.5:1)", () => {
    const ratio = contrastRatio(colors.primary, colors.surface);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
