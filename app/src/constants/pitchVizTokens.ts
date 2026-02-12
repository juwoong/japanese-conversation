/**
 * Pitch curve visualization design tokens.
 * Spec by Graphic Designer agent.
 *
 * Sections:
 *   canvas, background, borderColor, curve  — base pitch canvas
 *   referenceCurve                          — native-speaker reference overlay
 *   divergence                              — user-vs-reference shading
 *   moraSegment                             — per-mora dividers & labels
 *   score                                   — accuracy badge above canvas
 *   overlayStates                           — opacity per interactive phase
 *   time, pitch, grid, recording, animation — unchanged originals
 */

export const PITCH_VIZ = {
  // ─── Base Canvas ────────────────────────────────────────────────
  canvas: {
    height: 180,
    borderRadius: 16,
    padding: { left: 12, right: 16, top: 8, bottom: 24 },
    margin: { horizontal: 16, top: 12, bottom: 8 },
  },

  background: {
    light: "#F1F5F9",
    dark: "#1E293B",
  },
  borderColor: {
    light: "#E2E8F0",
    dark: "#334155",
  },

  // ─── User Pitch Curve (primary, solid, on top) ──────────────────
  curve: {
    strokeWidth: 2.5,
    light: {
      strokeColor: "#4F46E5",
      gradientTop: "#4F46E54D",
      gradientBottom: "#4F46E500",
    },
    dark: {
      strokeColor: "#818CF8",
      gradientTop: "#818CF84D",
      gradientBottom: "#818CF800",
    },
  },

  // ─── Reference Pitch Curve (dashed, behind user curve) ──────────
  referenceCurve: {
    strokeWidth: 2.0,
    dashArray: [8, 4] as readonly [number, number],
    light: {
      strokeColor: "#10B981",       // emerald-500
      gradientTop: "#10B9811A",     // 10% opacity fill
      gradientBottom: "#10B98100",
    },
    dark: {
      strokeColor: "#34D399",       // emerald-400
      gradientTop: "#34D3991A",
      gradientBottom: "#34D39900",
    },
  },

  // ─── Divergence Bands (between curves where pitch differs) ──────
  divergence: {
    /** Semitone threshold to begin shading divergence */
    mildThresholdSemitones: 2,
    /** Semitone threshold for severe divergence color */
    severeThresholdSemitones: 4,
    mild: {
      light: "#F59E0B1F",   // amber-500 @ 12%
      dark: "#F59E0B26",    // amber-500 @ 15%
    },
    severe: {
      light: "#EF44441F",   // red-500 @ 12%
      dark: "#EF444426",    // red-500 @ 15%
    },
  },

  // ─── Mora Segment Dividers & Labels ─────────────────────────────
  moraSegment: {
    divider: {
      strokeWidth: 0.5,
      dashArray: [3, 3] as readonly [number, number],
      opacity: 0.25,
      // Uses grid.color for stroke color (light/dark)
    },
    label: {
      fontSize: 13,
      fontWeight: "500" as const,
      /** Y-offset below canvas bottom edge */
      marginTop: 4,
      color: {
        light: "#64748B",   // slate-500
        dark: "#94A3B8",    // slate-400
      },
      error: {
        textColor: {
          light: "#EF4444",
          dark: "#F87171",
        },
        bgColor: {
          light: "#EF444420",  // red-500 @ 12.5%
          dark: "#F8717126",   // red-400 @ 15%
        },
        borderRadius: 4,
        paddingHorizontal: 4,
        paddingVertical: 1,
      },
    },
  },

  // ─── Score Badge ────────────────────────────────────────────────
  score: {
    /** Positioned above canvas, horizontally centered */
    position: "above-canvas" as const,
    pill: {
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 6,
      marginBottom: 8,
      background: {
        light: "#FFFFFF",
        dark: "#1E293B",
      },
      borderWidth: 1,
      borderColor: {
        light: "#E2E8F0",
        dark: "#334155",
      },
    },
    value: {
      fontSize: 28,
      fontWeight: "700" as const,
    },
    suffix: {
      fontSize: 14,
      fontWeight: "400" as const,
    },
    /** Color by accuracy range */
    ranges: {
      excellent: {
        min: 0.8,
        color: { light: "#16A34A", dark: "#22C55E" },  // green-600 / green-500
      },
      moderate: {
        min: 0.5,
        color: { light: "#F59E0B", dark: "#FBBF24" },  // amber-500 / amber-400
      },
      poor: {
        min: 0,
        color: { light: "#EF4444", dark: "#F87171" },  // red-500 / red-400
      },
    },
    animation: {
      countUpDurationMs: 600,
      fadeInDurationMs: 300,
    },
  },

  // ─── Interactive Phase Opacities ────────────────────────────────
  overlayStates: {
    /** Before recording: reference curve only (ghost preview) */
    preview: {
      referenceOpacity: 0.6,
      userOpacity: 0,
      divergenceOpacity: 0,
      scoreVisible: false,
    },
    /** During recording: user curve live, reference fades back */
    recording: {
      referenceOpacity: 0.3,
      userOpacity: 1.0,
      divergenceOpacity: 0,
      scoreVisible: false,
    },
    /** After recording: full overlay comparison with score */
    result: {
      referenceOpacity: 0.4,
      userOpacity: 1.0,
      divergenceOpacity: 1.0,
      scoreVisible: true,
    },
  },

  // ─── Unchanged originals ────────────────────────────────────────
  time: {
    visibleWindowSeconds: 4,
  },

  pitch: {
    semitoneMin: -12,
    semitoneMax: 12,
    smoothingWindowSize: 3,
  },

  grid: {
    centerLine: { width: 1, opacity: 0.6 },
    majorLine: {
      width: 0.5,
      opacity: 0.3,
      dashArray: [6, 4],
      semitones: [6, -6],
    },
    color: { light: "#E2E8F0", dark: "#334155" },
  },

  recording: {
    dot: {
      diameter: 8,
      color: "#EF4444",
      inset: 8,
    },
  },

  animation: {
    mountFadeInMs: 300,
  },
} as const;
