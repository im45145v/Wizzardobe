import { classifyEventFormality } from "@/services/calendar.service";

describe("calendar service", () => {
  describe("classifyEventFormality", () => {
    it("classifies formal events as high formality", async () => {
      const result = await classifyEventFormality(
        "Business Meeting",
        "Important corporate presentation"
      );
      expect(result).toBe(8);
    });

    it("classifies casual events as low formality", async () => {
      const result = await classifyEventFormality(
        "Coffee with friends",
        "Casual hangout"
      );
      expect(result).toBe(3);
    });

    it("classifies semi-formal events as medium formality", async () => {
      const result = await classifyEventFormality("Dinner date");
      expect(result).toBe(6);
    });

    it("returns default for unknown event types", async () => {
      const result = await classifyEventFormality("Something random");
      expect(result).toBe(5);
    });
  });
});
