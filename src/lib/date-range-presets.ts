const ONE_DAY_MS = 86_400_000;

export function getDateRangeFromPreset(preset: string): { from: number; to: number } {
  const now = Date.now();

  switch (preset) {
    case "last-7-days":
      return { from: now - 7 * ONE_DAY_MS, to: now };
    case "last-30-days":
      return { from: now - 30 * ONE_DAY_MS, to: now };
    case "last-90-days":
      return { from: now - 90 * ONE_DAY_MS, to: now };
    default:
      return { from: 0, to: now };
  }
}
