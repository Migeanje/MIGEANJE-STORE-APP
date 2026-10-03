import type { PasswordRule } from "@/modules/account/domain/password-policy";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/modules/account/domain/password-policy";
import { ACCOUNT_PATHS } from "./account-paths";

/*
 * Customer copy of the account pages (neutral Peruvian Spanish, "tú").
 * DRAFT: the registration consent and the recovery wording wait for the
 * privacy policy review.
 */

export const ACCOUNT_NAV_ITEMS = [
  { href: ACCOUNT_PATHS.home, label: "Resumen" },
  { href: ACCOUNT_PATHS.orders, label: "Mis pedidos" },
  { href: ACCOUNT_PATHS.favorites, label: "Favoritos" },
  { href: ACCOUNT_PATHS.addresses, label: "Direcciones" },
  { href: ACCOUNT_PATHS.profile, label: "Mis datos" },
] as const;

export const LOG_OUT_LABEL = "Cerrar sesión";

export const PASSWORD_RULE_LABELS: Record<PasswordRule, string> = {
  length: `entre ${PASSWORD_MIN_LENGTH} y ${PASSWORD_MAX_LENGTH} caracteres`,
  letter: "al menos una letra",
  digit: "al menos un número",
};

/** "a, b y c". */
function listText(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items.at(-1)}`;
}

/** "Tu contraseña necesita: entre 8 y 128 caracteres y al menos un número." */
export function passwordRulesMessage(rules: readonly PasswordRule[]): string {
  return `Tu contraseña necesita: ${listText(rules.map((rule) => PASSWORD_RULE_LABELS[rule]))}.`;
}

export const ACCOUNT_MESSAGES = {
  passwordRequired: "Escribe tu contraseña.",
  newPasswordRequired: "Crea una contraseña.",
  termsRequired:
    "Acepta los términos y la política de privacidad para crear tu cuenta.",
  labelTooLong: "Usa 40 caracteres como máximo.",
  addressUnknown: "No encontramos ese distrito. Elige tu ubicación de nuevo.",
} as const;

type FormError = { title: string; message: string };

export const LOG_IN_COPY = {
  title: "Ingresa a tu cuenta",
  description:
    "Revisa tus pedidos y guarda tus direcciones y productos favoritos.",
  emailLabel: "Correo electrónico",
  passwordLabel: "Contraseña",
  submit: "Ingresar",
  forgot: "¿Olvidaste tu contraseña?",
  noAccount: "¿No tienes cuenta?",
  createAccount: "Crea una cuenta",
  demoTitle: "Datos de demostración",
  /** The same answer for an unknown email and a wrong password. */
  invalid: {
    title: "No pudimos ingresar",
    message: "Correo o contraseña incorrectos.",
  } satisfies FormError,
  tooManyAttempts: {
    title: "Demasiados intentos",
    message:
      "Por tu seguridad pausamos los ingresos desde tu conexión. Espera unos minutos y vuelve a intentarlo.",
  } satisfies FormError,
  failure: {
    title: "No pudimos ingresar",
    message: "Tuvimos un problema. Inténtalo de nuevo en unos minutos.",
  } satisfies FormError,
} as const;

export const REGISTER_COPY = {
  title: "Crea tu cuenta",
  description:
    "Con tu cuenta ves tus pedidos, guardas tus direcciones y tus favoritos.",
  firstNameLabel: "Nombres",
  lastNameLabel: "Apellidos",
  emailLabel: "Correo electrónico",
  emailHint: "Con este correo ingresarás a tu cuenta.",
  phoneLabel: "Celular (opcional)",
  phoneHint: "9 dígitos, por ejemplo 987 654 321.",
  passwordLabel: "Contraseña",
  passwordRulesTitle: "Tu contraseña necesita:",
  submit: "Crear cuenta",
  hasAccount: "¿Ya tienes una cuenta?",
  logIn: "Ingresa",
  /**
   * DRAFT: the email has an account. Saying so is the price of registering
   * without email verification; the attempt counts like a failed sign-in.
   */
  emailTaken: {
    title: "No pudimos crear tu cuenta",
    message:
      "Ya hay una cuenta con ese correo. Ingresa con tu contraseña o recupérala.",
  } satisfies FormError,
  tooManyAttempts: LOG_IN_COPY.tooManyAttempts,
  failure: {
    title: "No pudimos crear tu cuenta",
    message: "Tuvimos un problema. Inténtalo de nuevo en unos minutos.",
  } satisfies FormError,
} as const;

export const RECOVER_COPY = {
  title: "Recupera tu contraseña",
  description:
    "Escribe el correo de tu cuenta y te enviaremos los pasos para crear una nueva contraseña.",
  emailLabel: "Correo electrónico",
  submit: "Enviar instrucciones",
  /** DRAFT. The same answer for every email: nobody learns who has an account. */
  sent: "Si existe una cuenta con ese correo, te enviamos un correo con los pasos para crear una nueva contraseña.",
  demoNote:
    "Modo demostración: no enviamos correos. Si olvidaste la contraseña de la cuenta de demostración, está en la página de ingreso.",
  backToLogIn: "Volver a ingresar",
} as const;

export const PROFILE_COPY = {
  title: "Mis datos",
  description: "Tu nombre y tu celular para coordinar tus envíos.",
  emailLabel: "Correo electrónico",
  emailNote: "Por ahora no puedes cambiar el correo de tu cuenta.",
  submit: "Guardar cambios",
} as const;

export const ADDRESSES_COPY = {
  title: "Direcciones",
  description: "Guarda las direcciones donde recibes tus pedidos.",
  listHeading: "Tus direcciones",
  newHeading: "Agregar una dirección",
  editHeading: "Editar dirección",
  empty: "Todavía no guardas direcciones.",
  defaultBadge: "Principal",
  labelLabel: "Nombre de la dirección (opcional)",
  labelHint: "Por ejemplo: Casa, Oficina.",
  lineLabel: "Dirección",
  lineHint: "Calle, número, interior o departamento.",
  referenceLabel: "Referencia (opcional)",
  referenceHint: "Por ejemplo: frente al parque, portón negro.",
  makeDefault: "Usar como dirección principal",
  submitNew: "Guardar dirección",
  submitEdit: "Guardar cambios",
  cancelEdit: "Cancelar",
  refreshUbigeo: "Actualizar provincias y distritos",
  noScriptUbigeo:
    "Sin JavaScript, las listas no se filtran solas: elige tu departamento (y luego tu provincia) y pulsa «Actualizar provincias y distritos».",
  edit: "Editar",
  remove: "Eliminar",
  setDefault: "Usar como principal",
  limit: {
    title: "No pudimos guardar la dirección",
    message:
      "Puedes guardar hasta 10 direcciones. Elimina una para agregar otra.",
  } satisfies FormError,
  gone: {
    title: "No pudimos guardar la dirección",
    message: "Esa dirección ya no existe. Agrégala de nuevo.",
  } satisfies FormError,
} as const;

export const ORDERS_COPY = {
  title: "Mis pedidos",
  description: "Los pedidos que hiciste con el correo de tu cuenta.",
  empty: "Todavía no tienes pedidos con este correo.",
  emptyAction: "Ver productos",
  placedOn: "Fecha",
  status: "Estado",
  total: "Total",
  items: "Productos",
  track: "Seguir pedido",
  detail: "Ver detalle",
  /**
   * DRAFT: an account whose email is not verified lists no orders
   * (registering does not prove the email is yours). Verification by email
   * arrives with Resend (F3/F5); in the mock only the demo account is
   * verified.
   */
  unverified: {
    title: "Para ver tus pedidos, primero verifica tu correo.",
    description:
      "Mientras tanto, puedes seguir tu pedido con su número y tu correo.",
    trackAction: "Seguir un pedido",
  },
} as const;

export const FAVORITES_COPY = {
  title: "Favoritos",
  description: "Los productos que guardaste para después.",
  empty: "Todavía no guardas productos.",
  emptyHint:
    "En la página de un producto, usa «Guardar en favoritos» para encontrarlo aquí.",
  emptyAction: "Ver productos",
  remove: "Quitar de favoritos",
  unavailable: "Algunos productos que guardaste ya no están en el catálogo.",
} as const;

export const DASHBOARD_COPY = {
  greeting: (firstName: string) => `Hola, ${firstName}`,
  description: "Desde aquí ves tus pedidos y administras tu cuenta.",
  recentOrders: "Pedidos recientes",
  allOrders: "Ver todos mis pedidos",
  noOrders: "Todavía no tienes pedidos con este correo.",
  quickLinks: "Accesos rápidos",
  links: [
    {
      href: ACCOUNT_PATHS.favorites,
      label: "Favoritos",
      description: "Los productos que guardaste.",
    },
    {
      href: ACCOUNT_PATHS.addresses,
      label: "Direcciones",
      description: "Dónde recibes tus pedidos.",
    },
    {
      href: ACCOUNT_PATHS.profile,
      label: "Mis datos",
      description: "Tu nombre y tu celular.",
    },
  ],
} as const;

export const FAVORITE_TOGGLE_COPY = {
  save: "Guardar en favoritos",
  saved: "Guardado en tus favoritos",
  added: "Guardamos el producto en tus favoritos.",
  removed: "Quitamos el producto de tus favoritos.",
  guestHint: "Ingresa a tu cuenta para guardar tus favoritos.",
  limit: "Tu lista de favoritos está llena: quita uno para guardar otro.",
  failure: "No pudimos actualizar tus favoritos. Inténtalo de nuevo.",
} as const;

/** Confirmations after a change, by `?aviso=` key. */
export const ACCOUNT_NOTICES = {
  "cuenta-creada":
    "Creamos tu cuenta. Te damos la bienvenida a Migeanje Store.",
  "perfil-guardado": "Guardamos tus datos.",
  "direccion-guardada": "Guardamos tu dirección.",
  "direccion-eliminada": "Eliminamos la dirección.",
  "direccion-principal": "Cambiamos tu dirección principal.",
  "favorito-quitado": "Quitamos el producto de tus favoritos.",
} as const;

export const AUTH_NOTICES = {
  "sesion-cerrada": "Cerraste tu sesión.",
  "sesion-requerida": "Ingresa a tu cuenta para continuar.",
} as const;

export type AccountNotice = keyof typeof ACCOUNT_NOTICES;

export const RECOVER_NOTICES = {
  "correo-enviado": RECOVER_COPY.sent,
} as const;
