// Characters that must not appear raw inside an inline <script>: "<" and ">"
// could close the tag or open a comment, "&" could start an entity in XHTML,
// and U+2028/U+2029 end lines in older JavaScript parsers.
const UNSAFE = /[<>&\u2028\u2029]/g;

function toUnicodeEscape(character: string): string {
  return `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`;
}

/**
 * Serializes structured data for `<script type="application/ld+json">`
 * (rendered with `dangerouslySetInnerHTML`): JSON with the characters that
 * could break out of the script tag escaped as \uXXXX, which JSON parsers read
 * back as the same text. Throws a TypeError for values JSON cannot represent.
 */
export function serializeJsonLd(data: unknown): string {
  const json = JSON.stringify(data);
  if (json === undefined) {
    throw new TypeError("serializeJsonLd needs a JSON-serializable value");
  }
  return json.replace(UNSAFE, toUnicodeEscape);
}
