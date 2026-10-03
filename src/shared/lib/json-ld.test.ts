// @vitest-environment node
import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "./json-ld";

// Line and paragraph separators (U+2028, U+2029).
const SEPARATORS = String.fromCodePoint(0x2028, 0x2029);
const BACKSLASH = String.fromCodePoint(0x5c);

describe("serializeJsonLd", () => {
  it("serializes plain data as JSON", () => {
    const data = { "@type": "Product", name: "Cargador", price: "189.90" };

    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });

  it("escapes characters that could close the script tag or break the HTML", () => {
    const data = {
      name: '</script><script>alert("x")</script>',
      note: `a & b > c${SEPARATORS}`,
    };
    const html = serializeJsonLd(data);

    for (const unsafe of ["<", ">", "&", ...SEPARATORS]) {
      expect(html).not.toContain(unsafe);
    }
    expect(html).toContain(`${BACKSLASH}u003c/script${BACKSLASH}u003e`);
    // Still the same data once parsed.
    expect(JSON.parse(html)).toEqual(data);
  });

  it("throws for values JSON cannot represent", () => {
    expect(() => serializeJsonLd(undefined)).toThrow(TypeError);
  });
});
