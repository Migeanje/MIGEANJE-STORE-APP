"use client";

import { Bell } from "lucide-react";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import * as z from "zod";
import { Button } from "@/shared/ui/atoms/button";
import { Input } from "@/shared/ui/atoms/input";
import { FormField } from "@/shared/ui/molecules/form-field";

// DRAFT: copy pending owner review.
const INVALID_EMAIL = "Escribe un correo válido, por ejemplo nombre@correo.com";

const emailSchema = z.email();

export type NotifyMeFormProps = {
  /** Named in the confirmation, e.g. "MacBook Air de 13 pulgadas (M5)". */
  productName: string;
};

/**
 * "Avísame cuando llegue" for products we do not sell yet: a button that
 * opens a small email form. A client-only mock (F1): the email is validated
 * with Zod and confirmed on screen, nothing is sent or stored. Without
 * JavaScript the button is replaced by a short note.
 */
export function NotifyMeForm({ productName }: NotifyMeFormProps) {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmationRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    // The form (and the focused button) is gone: keep focus on the answer.
    if (confirmedEmail !== null) confirmationRef.current?.focus();
  }, [confirmedEmail]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("email");
    const result = emailSchema.safeParse(
      typeof value === "string" ? value.trim() : value,
    );
    if (!result.success) {
      setError(INVALID_EMAIL);
      inputRef.current?.focus();
      return;
    }
    setError(null);
    setConfirmedEmail(result.data);
  }

  return (
    <div className="flex flex-col gap-4">
      {confirmedEmail === null ? (
        <>
          <Button
            size="lg"
            variant={open ? "secondary" : "primary"}
            leadingIcon={<Bell />}
            aria-expanded={open}
            aria-controls={open ? formId : undefined}
            onClick={() => setOpen((current) => !current)}
            className="noscript:hidden"
          >
            Avísame cuando llegue
          </Button>
          <p className="hidden text-body-sm text-muted-foreground noscript:block">
            Todavía no vendemos este producto. Activa JavaScript para pedir que
            te avisemos cuando llegue.
          </p>
        </>
      ) : null}

      {open && confirmedEmail === null ? (
        <form
          id={formId}
          noValidate
          onSubmit={handleSubmit}
          className="flex flex-col gap-3"
        >
          <FormField
            label="Tu correo"
            hint="Solo te escribiremos para avisarte de este producto."
            error={error}
            required
          >
            {(control) => (
              <Input
                {...control}
                ref={inputRef}
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
              />
            )}
          </FormField>
          <Button type="submit" variant="primary">
            Avísame
          </Button>
        </form>
      ) : null}

      <p
        ref={confirmationRef}
        role="status"
        tabIndex={-1}
        className="text-body-sm text-foreground focus-visible:outline-none"
      >
        {confirmedEmail === null
          ? null
          : `Listo. Te escribiremos a ${confirmedEmail} cuando ${productName} llegue a la tienda.`}
      </p>
    </div>
  );
}
