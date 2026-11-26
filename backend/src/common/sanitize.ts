const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "b",
  "i",
  "u",
  "s",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "a",
  "code",
  "pre",
  "blockquote",
  "h1",
  "h2",
  "h3",
  "span"
]);

const DROP_WITH_CONTENT = /<(script|style|iframe|object|embed|noscript|template)\b[\s\S]*?<\/\1\s*>/gi;
const COMMENTS = /<!--[\s\S]*?-->/g;
const TAG = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
const HREF = /\bhref\s*=\s*("([^"]*)"|'([^']*)')/i;
const SAFE_URL = /^(https?:|mailto:)/i;

function escapeText(value: string): string {
  return value.replace(/<(?![a-zA-Z/])/g, "&lt;");
}

export function sanitizeRichText(input: string): string {
  const withoutBlocks = input.replace(COMMENTS, "").replace(DROP_WITH_CONTENT, "");
  const cleaned = withoutBlocks.replace(TAG, (match: string, rawName: string, attrs: string) => {
    const name = rawName.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) {
      return "";
    }
    if (match.startsWith("</")) {
      return `</${name}>`;
    }
    if (name === "a") {
      const href = HREF.exec(attrs);
      const value = href ? (href[2] ?? href[3] ?? "").trim() : "";
      return SAFE_URL.test(value) ? `<a href="${value.replace(/"/g, "&quot;")}" rel="noopener noreferrer">` : "<a>";
    }
    return `<${name}>`;
  });
  return escapeText(cleaned);
}
