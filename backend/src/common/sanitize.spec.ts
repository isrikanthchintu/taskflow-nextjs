import { sanitizeRichText } from "@/common/sanitize";

describe("sanitizeRichText", () => {
  it("keeps allowed formatting", () => {
    expect(sanitizeRichText("<p>Hello <strong>world</strong></p>")).toBe("<p>Hello <strong>world</strong></p>");
  });

  it("removes script blocks with their content", () => {
    expect(sanitizeRichText("<p>a</p><script>alert(1)</script>")).toBe("<p>a</p>");
  });

  it("removes event handler attributes", () => {
    expect(sanitizeRichText('<p onclick="x()">hi</p>')).toBe("<p>hi</p>");
  });

  it("drops javascript links but keeps safe ones", () => {
    expect(sanitizeRichText('<a href="javascript:alert(1)">x</a>')).toBe("<a>x</a>");
    expect(sanitizeRichText('<a href="https://example.com">x</a>')).toBe(
      '<a href="https://example.com" rel="noopener noreferrer">x</a>'
    );
  });

  it("strips disallowed tags but keeps their text", () => {
    expect(sanitizeRichText('<img src=x onerror="a()">text<iframe src="y"></iframe>')).toBe("text");
  });

  it("removes comments", () => {
    expect(sanitizeRichText("a<!-- hidden -->b")).toBe("ab");
  });
});
