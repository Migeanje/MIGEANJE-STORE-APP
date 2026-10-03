import {
  getDefaultNormalizer,
  render,
  screen,
  within,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { describeTrustPage } from "../_legal/trust-page-checks";
import TermsPage, { generateMetadata } from "./page";

const exact = {
  normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
};

describeTrustPage({
  path: "/terminos",
  Page: TermsPage,
  metadata: generateMetadata,
  title: "Términos y condiciones",
  legal: true,
});

describe("/terminos", () => {
  it("identifies the store, still pending its legal data", () => {
    render(<TermsPage />);
    const who = screen.getByRole("region", { name: "Quiénes somos" });
    expect(who).toHaveTextContent("Migeanje Store");
    expect(within(who).getAllByText("Por definir", exact)).toHaveLength(4);
    expect(
      screen.getByRole("region", { name: "Precios y pagos" }),
    ).toHaveTextContent("incluyen los impuestos");
  });
});
