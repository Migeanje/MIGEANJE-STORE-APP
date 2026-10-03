// Shared checks of every trust and legal page (test helper, not a route).
import { render, screen, within } from "@testing-library/react";
import type { Metadata } from "next";
import type { ComponentType } from "react";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "@/test/a11y";
import { LEGAL_UPDATED_AT } from "./legal";

export type TrustPage = {
  path: string;
  Page: ComponentType;
  metadata: () => Promise<Metadata>;
  title: string;
  /** Legal pages carry the draft banner and the Libro de Reclamaciones. */
  legal: boolean;
};

/**
 * Its own title and description, h1, "Última actualización", a table of
 * contents whose links reach their sections, the draft banner and Libro de
 * Reclamaciones on legal pages, and no axe violations.
 */
export function describeTrustPage({
  path,
  Page,
  metadata,
  title,
  legal,
}: TrustPage) {
  describe(path, () => {
    it("has its own title and description", async () => {
      const meta = await metadata();
      expect(meta.title).toBe(title);
      expect(meta.description).toEqual(expect.any(String));
    });

    it("renders the h1, the last update and a table of contents with in-page links", () => {
      render(<Page />);

      expect(
        screen.getByRole("heading", { level: 1, name: title }),
      ).toBeInTheDocument();
      expect(screen.getByText(LEGAL_UPDATED_AT.label)).toHaveAttribute(
        "dateTime",
        LEGAL_UPDATED_AT.dateTime,
      );
      const toc = screen.getByRole("navigation", { name: "En esta página" });
      for (const link of within(toc).getAllByRole("link")) {
        const id = link.getAttribute("href")?.slice(1) ?? "";
        expect(document.getElementById(id)).toHaveAttribute(
          "aria-labelledby",
          `${id}-titulo`,
        );
      }
    });

    it(
      legal
        ? "is marked as a draft and links to the Libro de Reclamaciones"
        : "is not a legal draft",
      () => {
        render(<Page />);
        const banner = screen.queryByText(
          "Borrador pendiente de revisión legal.",
        );
        if (!legal) {
          expect(banner).toBeNull();
          return;
        }
        expect(banner).toBeInTheDocument();
        expect(
          screen
            .getAllByRole("link", { name: /Libro de Reclamaciones/ })
            .every(
              (link) => link.getAttribute("href") === "/libro-de-reclamaciones",
            ),
        ).toBe(true);
      },
    );

    it("has no axe violations", async () => {
      const { container } = render(<Page />);
      await expectNoAxeViolations(container);
    });
  });
}
