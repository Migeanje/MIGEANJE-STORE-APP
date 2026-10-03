"use client";

import {
  type FormEvent,
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type DefaultValues,
  type FieldErrors,
  type Resolver,
  useForm,
} from "react-hook-form";
import type { ErrorSummaryItem } from "@/shared/ui/molecules/error-summary";
import type { FormState } from "./checkout-forms";

type Values<F extends string> = Record<F, string>;

export type CheckoutFormOptions<F extends string, Output> = {
  /** A server action (posts without JavaScript too). */
  action: (state: FormState<F>, formData: FormData) => Promise<FormState<F>>;
  initialState: FormState<F>;
  /** The same Zod schema as the server, through `zodResolver`. */
  resolver: Resolver<Values<F>, unknown, Output>;
  /** Field order (for the error summary). */
  fields: readonly F[];
  /** Control id of each field, so summary links point at it. */
  fieldIds: Record<F, string>;
};

function toFieldErrors<F extends string>(
  errors: Partial<Record<F, string>>,
): FieldErrors<Values<F>> {
  return Object.fromEntries(
    Object.entries(errors).map(([field, message]) => [
      field,
      { type: "server", message },
    ]),
  ) as FieldErrors<Values<F>>;
}

/**
 * A checkout step form: React Hook Form validates on the client (inline
 * errors once a field is left, all of them on submit), then the form posts
 * its FormData to the server action through `useActionState`. Without
 * JavaScript the same form posts natively and the server answers the same
 * state. After a failed submit (client or server) focus moves to the error
 * summary (`summaryRef`).
 */
export function useCheckoutForm<F extends string, Output>({
  action,
  initialState,
  resolver,
  fields,
  fieldIds,
}: CheckoutFormOptions<F, Output>) {
  const [state, formAction, pending] = useActionState(action, initialState);
  // A stable object: React Hook Form re-applies `errors` whenever it changes.
  const serverErrors = useMemo(() => toFieldErrors(state.errors), [state]);
  const form = useForm<Values<F>, unknown, Output>({
    resolver,
    defaultValues: state.values as DefaultValues<Values<F>>,
    errors: serverErrors,
    mode: "onTouched",
    // Focus goes to the error summary instead of the first field.
    shouldFocusError: false,
  });
  const formRef = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const [clientAttempt, setClientAttempt] = useState(0);
  // Set after a failed submit; cleared once the summary has focus (server
  // errors reach React Hook Form one render later than the new state).
  const focusRequested = useRef(false);

  useEffect(() => {
    const failed =
      state.formError !== null || Object.keys(state.errors).length > 0;
    if (state.attempt > 0 && failed) focusRequested.current = true;
  }, [state]);

  useEffect(() => {
    if (clientAttempt > 0) focusRequested.current = true;
  }, [clientAttempt]);

  useEffect(() => {
    if (focusRequested.current && summaryRef.current) {
      focusRequested.current = false;
      summaryRef.current.focus();
    }
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    void form.handleSubmit(
      () => {
        const element = formRef.current;
        if (!element) return;
        // The typed values as they are: the server parses them itself.
        const data = new FormData(element);
        startTransition(() => formAction(data));
      },
      () => setClientAttempt((attempt) => attempt + 1),
    )(event);
  }

  const { errors: rhfErrors } = form.formState;
  const errors: Partial<Record<F, string>> = {};
  for (const field of fields) {
    const message = (rhfErrors as Record<string, { message?: unknown }>)[field]
      ?.message;
    if (typeof message === "string" && message !== "") errors[field] = message;
  }
  const summaryItems: ErrorSummaryItem[] = fields.flatMap((field) => {
    const message = errors[field];
    return message ? [{ fieldId: fieldIds[field], message }] : [];
  });

  return {
    form,
    state,
    pending,
    formAction,
    formRef,
    summaryRef,
    onSubmit,
    /** The current message of each field (client or server). */
    errors,
    summaryItems,
  };
}
