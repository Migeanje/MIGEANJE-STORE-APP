import Link from "next/link";
import { redirect } from "next/navigation";
import { useId } from "react";
import { getDemoAccountHint } from "@/modules/account/infrastructure";
import { initialFormState } from "@/modules/checkout/ui/checkout-forms";
import { Text } from "@/shared/ui/atoms/text";
import { AuthPage } from "@/shared/ui/templates/auth-page";
import {
  AUTH_NOTICES,
  LOG_IN_COPY,
  RECOVER_COPY,
  RECOVER_NOTICES,
  REGISTER_COPY,
} from "./account-copy";
import {
  ACCOUNT_PATHS,
  logInHref,
  noticeFrom,
  RETURN_PARAM,
  registerHref,
  safeReturnPath,
} from "./account-paths";
import { loadSignedInAccount } from "./account-session";
import { logInAction, recoverAction, registerAction } from "./actions";
import { LogInForm } from "./log-in-form";
import { RecoverForm } from "./recover-form";
import { RegisterForm } from "./register-form";

type SearchParams = Record<string, string | string[] | undefined>;

export type AuthPageContainerProps = { searchParams: SearchParams };

const linkClassName =
  "font-medium text-foreground underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** The `?volver=` path (safe), or null when it is just the account. */
function returnPathOf(searchParams: SearchParams): string {
  return safeReturnPath(searchParams[RETURN_PARAM]);
}

/** A signed-in customer has nothing to do here: on to `returnTo`. */
async function redirectIfSignedIn(returnTo: string) {
  if (await loadSignedInAccount()) redirect(returnTo);
}

function DemoAccountHint({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-2 rounded-lg border border-dashed p-4"
    >
      <h2 id={headingId} className="text-body-sm font-medium text-foreground">
        {LOG_IN_COPY.demoTitle}
      </h2>
      <Text size="body-sm" tone="muted" className="text-pretty">
        Correo <span className="font-mono text-foreground">{email}</span> y
        contraseña <span className="font-mono text-foreground">{password}</span>
        : tiene pedidos, direcciones y favoritos de ejemplo.
      </Text>
    </section>
  );
}

/** Server Component: /cuenta/ingresar. */
export async function LogInPageContainer({
  searchParams,
}: AuthPageContainerProps) {
  const returnTo = returnPathOf(searchParams);
  await redirectIfSignedIn(returnTo);
  const demo = getDemoAccountHint();
  const keepReturn = returnTo === ACCOUNT_PATHS.home ? null : returnTo;

  return (
    <AuthPage
      title={LOG_IN_COPY.title}
      description={LOG_IN_COPY.description}
      notice={noticeFrom(searchParams, AUTH_NOTICES)}
      footer={
        <>
          <p>
            <Link href={ACCOUNT_PATHS.recover} className={linkClassName}>
              {LOG_IN_COPY.forgot}
            </Link>
          </p>
          <p className="text-muted-foreground">
            {LOG_IN_COPY.noAccount}{" "}
            <Link href={registerHref(keepReturn)} className={linkClassName}>
              {LOG_IN_COPY.createAccount}
            </Link>
          </p>
          {demo ? <DemoAccountHint {...demo} /> : null}
        </>
      }
    >
      <LogInForm
        action={logInAction}
        initialState={initialFormState()}
        returnTo={keepReturn}
      />
    </AuthPage>
  );
}

/** Server Component: /cuenta/registro. */
export async function RegisterPageContainer({
  searchParams,
}: AuthPageContainerProps) {
  const returnTo = returnPathOf(searchParams);
  await redirectIfSignedIn(returnTo);
  const keepReturn = returnTo === ACCOUNT_PATHS.home ? null : returnTo;

  return (
    <AuthPage
      title={REGISTER_COPY.title}
      description={REGISTER_COPY.description}
      footer={
        <p className="text-muted-foreground">
          {REGISTER_COPY.hasAccount}{" "}
          <Link href={logInHref(keepReturn)} className={linkClassName}>
            {REGISTER_COPY.logIn}
          </Link>
        </p>
      }
    >
      <RegisterForm
        action={registerAction}
        initialState={initialFormState()}
        returnTo={keepReturn}
        termsHref="/terminos"
        privacyHref="/privacidad"
      />
    </AuthPage>
  );
}

/** Server Component: /cuenta/recuperar (mock: no email is sent). */
export async function RecoverPageContainer({
  searchParams,
}: AuthPageContainerProps) {
  await redirectIfSignedIn(ACCOUNT_PATHS.home);
  const sent = noticeFrom(searchParams, RECOVER_NOTICES);

  return (
    <AuthPage
      title={RECOVER_COPY.title}
      description={RECOVER_COPY.description}
      notice={
        sent ? (
          <div className="flex flex-col gap-2">
            <p>{sent}</p>
            {getDemoAccountHint() ? (
              <p className="text-muted-foreground">{RECOVER_COPY.demoNote}</p>
            ) : null}
          </div>
        ) : null
      }
      footer={
        <p>
          <Link href={ACCOUNT_PATHS.logIn} className={linkClassName}>
            {RECOVER_COPY.backToLogIn}
          </Link>
        </p>
      }
    >
      <RecoverForm action={recoverAction} initialState={initialFormState()} />
    </AuthPage>
  );
}
