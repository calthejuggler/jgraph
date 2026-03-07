export const parseSiteswap = (input: string) =>
  [...input].map((c) => {
    const value = parseInt(c, 36);
    if (isNaN(value)) throw new Error(`Invalid siteswap character: '${c}'`);
    return value;
  });

export const numBalls = (values: number[]) => {
  if (values.length === 0) throw new Error("Empty siteswap");
  const sum = values.reduce((a, b) => a + b, 0);
  if (sum % values.length !== 0) throw new Error("Invalid siteswap: average is not an integer");
  return sum / values.length;
};

export const computeInitialState = (siteswap: number[]) => {
  const maxThrow = Math.max(...siteswap);
  if (maxThrow === 0) return [];
  const state = new Array(maxThrow).fill(false);
  const L = siteswap.length;
  const periodsBack = Math.ceil(maxThrow / L);

  for (let p = 1; p <= periodsBack; p++) {
    for (let i = 0; i < L; i++) {
      const beat = i - p * L;
      const throwVal = siteswap[i];
      const landingBeat = beat + throwVal;
      if (landingBeat >= 0 && landingBeat < maxThrow) {
        state[landingBeat] = true;
      }
    }
  }
  return state;
};
