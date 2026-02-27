export function toBinaryLabel(n: number, maxHeight: number, reversed: boolean): string {
  const binary = n.toString(2).padStart(maxHeight, "0");
  return reversed ? binary.split("").reverse().join("") : binary;
}

export function toAbbreviatedLabel(n: number, maxHeight: number): string {
  const digits: string[] = [];
  let gap = 0;
  for (let pos = maxHeight - 1; pos >= 0; pos--) {
    if ((n >> pos) & 1) {
      digits.push(gap < 10 ? String(gap) : String.fromCharCode(87 + gap));
      gap = 0;
    } else {
      gap++;
    }
  }
  return digits.join("");
}
