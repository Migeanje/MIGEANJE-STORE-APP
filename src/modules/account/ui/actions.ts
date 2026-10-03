"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { logIn } from "@/modules/account/application/log-in";
import {
  deleteAddress,
  makeDefaultAddress,
  saveAddress,
  setFavorite,
  updateCustomerProfile,
} from "@/modules/account/application/manage-account";
import type { IssuedSession } from "@/modules/account/application/ports";
import { registerCustomer } from "@/modules/account/application/register-customer";
import { logOut } from "@/modules/account/application/sessions";
import {
  getCustomerAccounts,
  getLoginAttempts,
  getPasswordHasher,
  getSessionStore,
} from "@/modules/account/infrastructure";
import {
  clearSessionToken,
  readSessionToken,
  writeSessionToken,
} from "@/modules/account/infrastructure/session-cookie";
import { resolveUbigeo } from "@/modules/checkout/domain/ubigeo";
import { getUbigeoDirectory } from "@/modules/checkout/infrastructure";
import {
  fieldErrorsOf,
  readFormValues,
} from "@/modules/checkout/ui/checkout-forms";
import { identifyClient } from "@/shared/lib/client-key";
import {
  ACCOUNT_MESSAGES,
  ADDRESSES_COPY,
  FAVORITE_TOGGLE_COPY,
  LOG_IN_COPY,
  REGISTER_COPY,
} from "./account-copy";
import {
  ADDRESS_FIELDS,
  type AddressFormState,
  addressFormSchema,
  LOG_IN_FIELDS,
  type LogInFormState,
  logInFormSchema,
  PROFILE_FIELDS,
  type ProfileFormState,
  profileFormSchema,
  RECOVER_FIELDS,
  REGISTER_FIELDS,
  type RecoverFormState,
  type RegisterFormState,
  recoverFormSchema,
  refreshedUbigeoValues,
  registerFormSchema,
} from "./account-forms";
import {
  ACCOUNT_PATHS,
  logInHref,
  RETURN_PARAM,
  safeReturnPath,
  withNotice,
} from "./account-paths";
import { loadSignedInAccount } from "./account-session";
import {
  FAVORITE_FIELDS,
  type FavoriteToggleState,
} from "./favorite-toggle-state";

/*
 * Account server actions. Every form posts here, also without JavaScript.
 * Passwords never go back in a form state and are never logged; failures
 * log their message only. Actions that change an account read the account
 * from the session cookie (never from the form) and send a guest to sign in.
 */

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function logFailure(what: string, error: unknown) {
  console.error(
    `${what} failed:`,
    error instanceof Error ? error.message : "unknown error",
  );
}

async function startSession({ token, session }: IssuedSession) {
  await writeSessionToken(token, new Date(session.expiresAt));
}

/** The signed-in account, or a redirect to sign in (back to `returnTo`). */
async function accountOrSignIn(returnTo: string) {
  const account = await loadSignedInAccount();
  if (!account) redirect(logInHref(returnTo));
  return account;
}

/**
 * The first name of the signed-in account (the header's account link), or
 * null. The root layout does not read the session, so the browser asks.
 */
export async function readAccountNameAction(): Promise<string | null> {
  return (await loadSignedInAccount())?.firstName ?? null;
}

/** Signs in with email and password, then goes to `volver` (a safe path). */
export async function logInAction(
  previous: LogInFormState,
  formData: FormData,
): Promise<LogInFormState> {
  const values = readFormValues(formData, LOG_IN_FIELDS);
  // Only the email goes back to the page.
  const echo = { email: values.email };
  const attempt = previous.attempt + 1;
  const parsed = logInFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      values: echo,
      errors: fieldErrorsOf(parsed.error),
      formError: null,
      attempt,
    };
  }

  let result: Awaited<ReturnType<typeof logIn>>;
  try {
    result = await logIn(
      {
        accounts: getCustomerAccounts(),
        hasher: getPasswordHasher(),
        sessions: getSessionStore(),
        attempts: getLoginAttempts(),
      },
      {
        clientKeys: await identifyClient(),
        ...parsed.data,
        now: new Date(),
        previousToken: await readSessionToken(),
      },
    );
  } catch (error) {
    logFailure("Signing in", error);
    return {
      values: echo,
      errors: {},
      formError: LOG_IN_COPY.failure,
      attempt,
    };
  }

  if (!result.ok) {
    const formError =
      result.reason === "too_many_attempts"
        ? LOG_IN_COPY.tooManyAttempts
        : LOG_IN_COPY.invalid;
    return { values: echo, errors: {}, formError, attempt };
  }
  await startSession(result.issued);
  redirect(safeReturnPath(formData.get(RETURN_PARAM)));
}

/** Creates an account, signs it in and goes to `volver` (or the account). */
export async function registerAction(
  previous: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const { password: _password, ...echo } = readFormValues(
    formData,
    REGISTER_FIELDS,
  );
  const attempt = previous.attempt + 1;
  const parsed = registerFormSchema.safeParse(
    readFormValues(formData, REGISTER_FIELDS),
  );
  if (!parsed.success) {
    return {
      values: echo,
      errors: fieldErrorsOf(parsed.error),
      formError: null,
      attempt,
    };
  }

  let result: Awaited<ReturnType<typeof registerCustomer>>;
  try {
    result = await registerCustomer(
      {
        accounts: getCustomerAccounts(),
        hasher: getPasswordHasher(),
        sessions: getSessionStore(),
        attempts: getLoginAttempts(),
      },
      {
        clientKeys: await identifyClient(),
        ...parsed.data,
        now: new Date(),
        previousToken: await readSessionToken(),
      },
    );
  } catch (error) {
    logFailure("Registering", error);
    return {
      values: echo,
      errors: {},
      formError: REGISTER_COPY.failure,
      attempt,
    };
  }

  if (!result.ok) {
    const formError =
      result.reason === "too_many_attempts"
        ? REGISTER_COPY.tooManyAttempts
        : REGISTER_COPY.emailTaken;
    return { values: echo, errors: {}, formError, attempt };
  }
  await startSession(result.issued);
  const returnTo = safeReturnPath(formData.get(RETURN_PARAM));
  redirect(
    returnTo === ACCOUNT_PATHS.home
      ? withNotice(ACCOUNT_PATHS.home, "cuenta-creada")
      : returnTo,
  );
}

/**
 * "Olvidé mi contraseña" (mock): checks the email and always answers the
 * same, whether or not it has an account. Nothing is sent and nothing is
 * logged (F3 sends the reset email through Medusa).
 */
export async function recoverAction(
  previous: RecoverFormState,
  formData: FormData,
): Promise<RecoverFormState> {
  const values = readFormValues(formData, RECOVER_FIELDS);
  const parsed = recoverFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      values,
      errors: fieldErrorsOf(parsed.error),
      formError: null,
      attempt: previous.attempt + 1,
    };
  }
  redirect(withNotice(ACCOUNT_PATHS.recover, "correo-enviado"));
}

/** Ends this browser's session. */
export async function logOutAction(): Promise<void> {
  await logOut(getSessionStore(), await readSessionToken());
  await clearSessionToken();
  redirect(withNotice(ACCOUNT_PATHS.logIn, "sesion-cerrada"));
}

/** Saves the names and the mobile of the signed-in account. */
export async function updateProfileAction(
  previous: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const account = await accountOrSignIn(ACCOUNT_PATHS.profile);
  const values = readFormValues(formData, PROFILE_FIELDS);
  const parsed = profileFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      values,
      errors: fieldErrorsOf(parsed.error),
      formError: null,
      attempt: previous.attempt + 1,
    };
  }
  const result = await updateCustomerProfile(
    getCustomerAccounts(),
    account.id,
    parsed.data,
  );
  if (!result.ok) redirect(logInHref(ACCOUNT_PATHS.profile));
  redirect(withNotice(ACCOUNT_PATHS.profile, "perfil-guardado"));
}

/**
 * Adds (no `addressId`) or edits an address of the signed-in account. With
 * `intent=ubigeo` (the no-JavaScript "update" button) it only answers the
 * values back so the page re-renders with the right provincias and
 * distritos.
 */
export async function saveAddressAction(
  previous: AddressFormState,
  formData: FormData,
): Promise<AddressFormState> {
  const account = await accountOrSignIn(ACCOUNT_PATHS.addresses);
  const values = readFormValues(formData, ADDRESS_FIELDS);
  if (formData.get("intent") === "ubigeo") {
    return {
      values: refreshedUbigeoValues(values),
      errors: {},
      formError: null,
      attempt: previous.attempt,
    };
  }

  const attempt = previous.attempt + 1;
  const parsed = addressFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      values,
      errors: fieldErrorsOf(parsed.error),
      formError: null,
      attempt,
    };
  }
  const { codes, ...address } = parsed.data;
  const ubigeo = resolveUbigeo(await getUbigeoDirectory().tree(), codes);
  if (!ubigeo) {
    return {
      values,
      errors: { distrito: ACCOUNT_MESSAGES.addressUnknown },
      formError: null,
      attempt,
    };
  }

  const result = await saveAddress(getCustomerAccounts(), account.id, {
    ...address,
    ubigeo,
  });
  if (!result.ok) {
    if (result.reason === "address_limit") {
      return { values, errors: {}, formError: ADDRESSES_COPY.limit, attempt };
    }
    return { values, errors: {}, formError: ADDRESSES_COPY.gone, attempt };
  }
  redirect(withNotice(ACCOUNT_PATHS.addresses, "direccion-guardada"));
}

/** Deletes an address (field `addressId`) of the signed-in account. */
export async function deleteAddressAction(formData: FormData): Promise<void> {
  const account = await accountOrSignIn(ACCOUNT_PATHS.addresses);
  await deleteAddress(
    getCustomerAccounts(),
    account.id,
    text(formData, "addressId"),
  );
  redirect(withNotice(ACCOUNT_PATHS.addresses, "direccion-eliminada"));
}

/** Makes an address (field `addressId`) the default one. */
export async function setDefaultAddressAction(
  formData: FormData,
): Promise<void> {
  const account = await accountOrSignIn(ACCOUNT_PATHS.addresses);
  const result = await makeDefaultAddress(
    getCustomerAccounts(),
    account.id,
    text(formData, "addressId"),
  );
  redirect(
    result.ok
      ? withNotice(ACCOUNT_PATHS.addresses, "direccion-principal")
      : ACCOUNT_PATHS.addresses,
  );
}

/**
 * "Guardar en favoritos" on the product page (fields `slug`, `favorito`
 * si|no and `volver`). A guest goes to sign in and comes back to the
 * product; a signed-in customer gets the new state, and `refresh()`
 * re-renders the page (e.g. the favorites count elsewhere).
 */
export async function toggleFavoriteAction(
  previous: FavoriteToggleState,
  formData: FormData,
): Promise<FavoriteToggleState> {
  const returnTo = safeReturnPath(
    formData.get(FAVORITE_FIELDS.returnTo),
    ACCOUNT_PATHS.favorites,
  );
  const account = await accountOrSignIn(returnTo);
  const favorite = text(formData, FAVORITE_FIELDS.favorite) === "si";
  const attempt = previous.attempt + 1;

  let result: Awaited<ReturnType<typeof setFavorite>>;
  try {
    result = await setFavorite(
      getCustomerAccounts(),
      account.id,
      text(formData, FAVORITE_FIELDS.slug),
      favorite,
    );
  } catch (error) {
    logFailure("Changing a favorite", error);
    return {
      ...previous,
      message: FAVORITE_TOGGLE_COPY.failure,
      tone: "error",
      attempt,
    };
  }

  if (!result.ok) {
    return {
      favorite: previous.favorite,
      message:
        result.reason === "favorites_limit"
          ? FAVORITE_TOGGLE_COPY.limit
          : FAVORITE_TOGGLE_COPY.failure,
      tone: "error",
      attempt,
    };
  }
  refresh();
  return {
    favorite,
    message: favorite
      ? FAVORITE_TOGGLE_COPY.added
      : FAVORITE_TOGGLE_COPY.removed,
    tone: "default",
    attempt,
  };
}

/** "Quitar de favoritos" on the favorites page (field `slug`). */
export async function removeFavoriteAction(formData: FormData): Promise<void> {
  const account = await accountOrSignIn(ACCOUNT_PATHS.favorites);
  await setFavorite(
    getCustomerAccounts(),
    account.id,
    text(formData, FAVORITE_FIELDS.slug),
    false,
  );
  redirect(withNotice(ACCOUNT_PATHS.favorites, "favorito-quitado"));
}
