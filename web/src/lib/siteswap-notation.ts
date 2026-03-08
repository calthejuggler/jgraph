/** 0-9, a-z for 10-35, {n} for 36+. */
export function toSiteswapChar(height: number): string {
  if (height <= 35) return height.toString(36);
  return `{${height}}`;
}
