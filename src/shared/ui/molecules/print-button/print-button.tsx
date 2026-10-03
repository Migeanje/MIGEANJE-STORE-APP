"use client";

import { Printer } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Button, type ButtonProps } from "@/shared/ui/atoms/button";
import { Text } from "@/shared/ui/atoms/text";

export type PrintButtonProps = {
  /** The visible label, e.g. "Imprimir o guardar como PDF". */
  children: ReactNode;
  /** Shown instead of the button when JavaScript is off. */
  noScriptHint?: ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
};

/**
 * Opens the browser's print dialog (where "Save as PDF" also lives). The
 * button needs JavaScript, so without it the hint takes its place; neither
 * shows on paper.
 */
export function PrintButton({
  children,
  noScriptHint,
  variant = "secondary",
  size = "lg",
  className,
}: PrintButtonProps) {
  return (
    <>
      <Button
        variant={variant}
        size={size}
        leadingIcon={<Printer />}
        onClick={() => window.print()}
        className={cn("print:hidden noscript:hidden", className)}
      >
        {children}
      </Button>
      {noScriptHint ? (
        <Text
          size="body-sm"
          tone="muted"
          className="hidden text-pretty noscript:block print:hidden"
        >
          {noScriptHint}
        </Text>
      ) : null}
    </>
  );
}
