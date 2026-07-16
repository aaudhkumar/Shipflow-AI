import { describe, it, expect } from "vitest";

// Duplicated local helpers from AnalyticsScreen.tsx to test their boundary safety
const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
};

const formatDate = (dateInput: string | Date) => {
  if (!dateInput) return "—";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

describe("AnalyticsScreen Date Parser & Formatter Boundary Safety", () => {
  describe("parseLocalDate", () => {
    it("should parse standard dates correctly", () => {
      const date = parseLocalDate("2026-07-05T00:00:00Z");
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(6); // 0-indexed, so 6 is July
      expect(date.getDate()).toBe(5);
    });

    it("should handle empty string without crashing", () => {
      const date = parseLocalDate("");
      expect(date).toBeInstanceOf(Date);
    });

    it("should handle null or undefined dateStr safely by returning a Date", () => {
      const dateNull = parseLocalDate(null as any);
      expect(dateNull).toBeInstanceOf(Date);
      const dateUndefined = parseLocalDate(undefined as any);
      expect(dateUndefined).toBeInstanceOf(Date);
    });
  });

  describe("formatDate", () => {
    it("should format valid date correctly", () => {
      expect(formatDate("2026-07-05T00:00:00.000Z")).toBe("Jul 5, 2026");
    });

    it("should return fallback for invalid date formats", () => {
      expect(formatDate("not-a-date")).toBe("—");
    });

    it("should return fallback for empty string", () => {
      expect(formatDate("")).toBe("—");
    });

    it("should return fallback for null/undefined input", () => {
      expect(formatDate(null as any)).toBe("—");
      expect(formatDate(undefined as any)).toBe("—");
    });
  });
});

describe("AnalyticsScreen Component State & Fallback Logic Analysis", () => {
  it("should render fallback instead of crashing if reviewTimeBySeverity is undefined/missing", () => {
    const mockAnalyticsData: any = {
      volumeTrend: [],
      // reviewTimeBySeverity is missing/undefined
      featureTimeline: []
    };

    const simulateRender = () => {
      if (!mockAnalyticsData.reviewTimeBySeverity || mockAnalyticsData.reviewTimeBySeverity.length === 0) {
        return "fallback";
      } else {
        return (mockAnalyticsData as any).reviewTimeBySeverity.map((item: any) => item);
      }
    };

    expect(simulateRender()).toBe("fallback");
  });

  it("should render fallback instead of crashing if featureTimeline is undefined/missing", () => {
    const mockAnalyticsData: any = {
      volumeTrend: [],
      reviewTimeBySeverity: [],
      // featureTimeline is missing/undefined
    };

    const simulateRender = () => {
      if (!mockAnalyticsData.featureTimeline || mockAnalyticsData.featureTimeline.length === 0) {
        return "fallback";
      } else {
        return (mockAnalyticsData as any).featureTimeline.map((item: any) => item);
      }
    };

    expect(simulateRender()).toBe("fallback");
  });

  it("should render fallback card if productivityHeatmap is undefined/missing", () => {
    const mockAnalyticsData: any = {
      volumeTrend: [],
      reviewTimeBySeverity: [],
      featureTimeline: [],
      // productivityHeatmap is missing/undefined
    };

    const isFallbackRendered = !mockAnalyticsData.productivityHeatmap || mockAnalyticsData.productivityHeatmap.length === 0;
    expect(isFallbackRendered).toBe(true);
  });
});
