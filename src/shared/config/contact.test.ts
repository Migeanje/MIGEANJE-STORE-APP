// @vitest-environment node
import { describe, expect, it } from "vitest";
import { contact } from "./contact";

describe("contact", () => {
  it("keeps the customer email pending until it exists (DRAFT)", () => {
    // Fill it in one reviewed commit before launch: the privacy policy
    // (ARCO rights), returns and warranties point to it.
    expect(contact.email).toBeNull();
  });
});
