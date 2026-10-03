"use client";

import { useActionState } from "react";
import { Button } from "@/shared/ui/atoms/button";
import { Heading } from "@/shared/ui/atoms/heading";
import { Input } from "@/shared/ui/atoms/input";
import { Text } from "@/shared/ui/atoms/text";
import { FormField } from "@/shared/ui/molecules/form-field";
import type { UnlockOrderState } from "./actions";
import { ORDER_ACCESS_COPY } from "./order-copy";

export type OrderAccessFormProps = {
  number: string;
  /** `unlockOrderAction` (fields `number` and `email`). */
  action: (
    state: UnlockOrderState,
    formData: FormData,
  ) => Promise<UnlockOrderState>;
};

/**
 * The confirmation page without access (another browser, or later): asks
 * for the buyer's email to open the order. Works without JavaScript.
 */
export function OrderAccessForm({ number, action }: OrderAccessFormProps) {
  const [state, formAction, pending] = useActionState(action, {
    message: null,
  });

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-10 sm:px-8 lg:py-16">
      <div className="flex flex-col gap-3">
        <Heading level={1} size="display-l">
          {ORDER_ACCESS_COPY.title}
        </Heading>
        <Text>
          Pedido{" "}
          <span className="font-mono font-medium whitespace-nowrap">
            {number}
          </span>
        </Text>
        <Text tone="muted" className="text-pretty">
          {ORDER_ACCESS_COPY.description}
        </Text>
      </div>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="number" value={number} />
        <FormField
          label={ORDER_ACCESS_COPY.emailLabel}
          required
          error={state.message}
        >
          {(control) => (
            <Input
              {...control}
              name="email"
              type="email"
              autoComplete="email"
              spellCheck={false}
            />
          )}
        </FormField>
        <div>
          <Button type="submit" size="lg" loading={pending}>
            {ORDER_ACCESS_COPY.submit}
          </Button>
        </div>
      </form>
    </div>
  );
}
