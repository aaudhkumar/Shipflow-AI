import { findDiffPosition } from "../github/comments";

describe("findDiffPosition", () => {
  it("should return correct position for hunk headers", () => {
    const patch = `@@ -1,5 +1,6 @@\n console.log("hello");\n+console.log("world");`;
    expect(findDiffPosition(patch, 1)).toBe(2);
    expect(findDiffPosition(patch, 2)).toBe(3);
  });

  it("should handle deletions", () => {
    const patch = `@@ -5,5 +5,5 @@\n-console.log("hello");\n+console.log("world");`;
    expect(findDiffPosition(patch, 5)).toBe(3);
  });

  it("should handle out-of-range lines", () => {
    const patch = `@@ -1,3 +1,3 @@\n console.log("A");`;
    expect(findDiffPosition(patch, 99)).toBeNull();
  });
});
