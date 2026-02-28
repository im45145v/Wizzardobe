import { daysBetween, addDays, formatDate, clamp, normalize } from "@/utils/date";

describe("date utilities", () => {
  describe("daysBetween", () => {
    it("returns 0 for the same date", () => {
      const d = new Date("2025-01-01");
      expect(daysBetween(d, d)).toBe(0);
    });

    it("calculates days between two dates", () => {
      const d1 = new Date("2025-01-01");
      const d2 = new Date("2025-01-10");
      expect(daysBetween(d1, d2)).toBe(9);
    });

    it("is symmetric", () => {
      const d1 = new Date("2025-01-01");
      const d2 = new Date("2025-01-10");
      expect(daysBetween(d1, d2)).toBe(daysBetween(d2, d1));
    });
  });

  describe("addDays", () => {
    it("adds days to a date", () => {
      const d = new Date("2025-01-01");
      const result = addDays(d, 5);
      expect(result.getDate()).toBe(6);
    });

    it("does not mutate the original date", () => {
      const d = new Date("2025-01-01");
      addDays(d, 5);
      expect(d.getDate()).toBe(1);
    });
  });

  describe("formatDate", () => {
    it("formats as YYYY-MM-DD", () => {
      const d = new Date("2025-06-15T12:00:00Z");
      expect(formatDate(d)).toBe("2025-06-15");
    });
  });

  describe("clamp", () => {
    it("clamps below min", () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it("clamps above max", () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it("returns value within range", () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });
  });

  describe("normalize", () => {
    it("normalizes to 0–1 range", () => {
      expect(normalize(5, 0, 10)).toBe(0.5);
      expect(normalize(0, 0, 10)).toBe(0);
      expect(normalize(10, 0, 10)).toBe(1);
    });

    it("returns 0.5 when min equals max", () => {
      expect(normalize(5, 5, 5)).toBe(0.5);
    });

    it("clamps values outside range", () => {
      expect(normalize(-5, 0, 10)).toBe(0);
      expect(normalize(15, 0, 10)).toBe(1);
    });
  });
});
