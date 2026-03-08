import { describe, expect, test } from "bun:test";

import { toAbbreviatedLabel, toBinaryLabel } from "../binary-label";

describe("toBinaryLabel", () => {
  test("pads to maxHeight width with leading zeros", () => {
    // n=1 (binary "1") with maxHeight=4 → "0001"
    expect(toBinaryLabel(1, 4, false)).toBe("0001");
  });

  test("represents all set bits", () => {
    // n=0b1010 = 10 with maxHeight=4 → "1010"
    expect(toBinaryLabel(0b1010, 4, false)).toBe("1010");
  });

  test("all bits set", () => {
    // n=0b111 = 7 with maxHeight=3 → "111"
    expect(toBinaryLabel(7, 3, false)).toBe("111");
  });

  test("zero produces all zeros", () => {
    expect(toBinaryLabel(0, 5, false)).toBe("00000");
  });

  test("reversed flips the bit string", () => {
    // n=0b1000 = 8, maxHeight=4 → normal "1000", reversed "0001"
    expect(toBinaryLabel(8, 4, true)).toBe("0001");
  });

  test("reversed with asymmetric pattern", () => {
    // n=0b10110 = 22, maxHeight=5 → normal "10110", reversed "01101"
    expect(toBinaryLabel(22, 5, false)).toBe("10110");
    expect(toBinaryLabel(22, 5, true)).toBe("01101");
  });

  test("maxHeight larger than needed still pads correctly", () => {
    // n=3 (binary "11"), maxHeight=8 → "00000011"
    expect(toBinaryLabel(3, 8, false)).toBe("00000011");
  });
});

describe("toAbbreviatedLabel", () => {
  test("single bit set at MSB produces one digit showing gap from start", () => {
    // n=0b1000 = 8, maxHeight=4: bit at position 3 → gap=0 → "0"
    expect(toAbbreviatedLabel(8, 4)).toBe("0");
  });

  test("single bit set at LSB shows gap equal to preceding zeros", () => {
    // n=0b0001 = 1, maxHeight=4: 3 zeros then a 1 → gap=3 → "3"
    expect(toAbbreviatedLabel(1, 4)).toBe("3");
  });

  test("adjacent set bits produce consecutive zeros", () => {
    // n=0b1100 = 12, maxHeight=4: bit at pos 3 (gap=0), bit at pos 2 (gap=0) → "00"
    expect(toAbbreviatedLabel(12, 4)).toBe("00");
  });

  test("gap between set bits is counted correctly", () => {
    // n=0b10001 = 17, maxHeight=5: bit at pos 4 (gap=0), then 3 zeros, bit at pos 0 (gap=3) → "03"
    expect(toAbbreviatedLabel(17, 5)).toBe("03");
  });

  test("all bits set produces all zeros", () => {
    // n=0b1111 = 15, maxHeight=4 → "0000"
    expect(toAbbreviatedLabel(15, 4)).toBe("0000");
  });

  test("no bits set returns empty string", () => {
    expect(toAbbreviatedLabel(0, 4)).toBe("");
  });

  test("gaps >= 10 use lowercase letters (a=10, b=11, ...)", () => {
    // n with a single bit at the end, maxHeight=12: gap = 11 → 'b' (charCode 87+11=98='b')
    // Actually gap of 11 needs one bit set after 11 zeros: n=1, maxHeight=12
    expect(toAbbreviatedLabel(1, 12)).toBe("b");
    // gap of 10: n=1, maxHeight=11
    expect(toAbbreviatedLabel(1, 11)).toBe("a");
  });

  test("mixed single-digit and letter gaps", () => {
    // n=0b100000000001 = 2049, maxHeight=12: bit at pos 11 (gap=0), 10 zeros, bit at pos 0 (gap=10→'a')
    expect(toAbbreviatedLabel(2049, 12)).toBe("0a");
  });
});
