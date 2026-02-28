import {
  findColorGroup,
  scoreColorHarmony,
  calculateCombinationColorHarmony,
} from "@/utils/color";

describe("color utilities", () => {
  describe("findColorGroup", () => {
    it("finds neutral colors in group 0", () => {
      expect(findColorGroup("black")).toBe(0);
      expect(findColorGroup("white")).toBe(0);
      expect(findColorGroup("gray")).toBe(0);
    });

    it("finds blue family", () => {
      expect(findColorGroup("navy")).toBe(1);
      expect(findColorGroup("blue")).toBe(1);
    });

    it("returns -1 for unknown colors", () => {
      expect(findColorGroup("xyzcolor")).toBe(-1);
    });

    it("is case insensitive", () => {
      expect(findColorGroup("BLACK")).toBe(0);
      expect(findColorGroup("Navy")).toBe(1);
    });
  });

  describe("scoreColorHarmony", () => {
    it("scores same group as 1.0", () => {
      expect(scoreColorHarmony("black", "white")).toBe(1.0);
    });

    it("scores neutrals with anything as 0.9", () => {
      expect(scoreColorHarmony("black", "blue")).toBe(0.9);
    });

    it("scores unknown colors as 0.5", () => {
      expect(scoreColorHarmony("xyzcolor", "abccolor")).toBe(0.5);
    });

    it("returns between 0 and 1", () => {
      const score = scoreColorHarmony("red", "blue");
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe("calculateCombinationColorHarmony", () => {
    it("returns 1.0 for single color", () => {
      expect(calculateCombinationColorHarmony(["blue"])).toBe(1.0);
    });

    it("returns high score for harmonious colors", () => {
      const score = calculateCombinationColorHarmony([
        "black",
        "white",
        "gray",
      ]);
      expect(score).toBe(1.0);
    });

    it("returns moderate score for mixed colors", () => {
      const score = calculateCombinationColorHarmony([
        "red",
        "blue",
        "green",
      ]);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });
  });
});
