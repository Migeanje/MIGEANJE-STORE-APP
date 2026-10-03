// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSignedInAccount } from "@/modules/account/application/sessions";
import {
  getCustomerAccounts,
  getSessionStore,
} from "@/modules/account/infrastructure";
import { DEMO_ACCOUNT } from "@/modules/account/infrastructure/fixtures/demo-account";
import { SESSION_COOKIE } from "@/modules/account/infrastructure/session-cookie";
import { initialFormState } from "@/modules/checkout/ui/checkout-forms";
import {
  deleteAddressAction,
  logInAction,
  logOutAction,
  readAccountNameAction,
  recoverAction,
  registerAction,
  removeFavoriteAction,
  saveAddressAction,
  setDefaultAddressAction,
  toggleFavoriteAction,
  updateProfileAction,
} from "./actions";
import { initialFavoriteState } from "./favorite-toggle-state";

vi.mock("server-only", () => ({}));

// A cheap scrypt cost keeps the tests fast; the demo account's stored hash
// still verifies with its own (production) parameters.
vi.mock("@/modules/account/infrastructure", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/modules/account/infrastructure")>();
  const { createScryptPasswordHasher } = await import(
    "@/modules/account/infrastructure/scrypt-password-hasher"
  );
  return {
    ...original,
    getPasswordHasher: () => createScryptPasswordHasher({ cost: 1024 }),
  };
});

const jar = new Map<string, string>();
const setCookie = vi.fn((name: string, value: string) => jar.set(name, value));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name) } : undefined,
    set: setCookie,
  }),
  headers: async () => new Headers(),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

const refresh = vi.fn();
vi.mock("next/cache", () => ({ refresh: () => refresh() }));

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

const DEMO_LOG_IN = { email: "demo@migeanje.pe", password: "Demo-2026!" };

async function signedInAccount() {
  return getSignedInAccount(
    { accounts: getCustomerAccounts(), sessions: getSessionStore() },
    jar.get(SESSION_COOKIE) ?? null,
    new Date(),
  );
}

/** Signs a fresh account in (each test gets its own, the store is shared). */
async function signUp(): Promise<string> {
  const email = `cliente-${crypto.randomUUID()}@correo.pe`;
  await expect(
    registerAction(
      initialFormState(),
      form({
        firstName: "Luis",
        lastName: "Rojas",
        email,
        phone: "",
        password: "Otra-clave-2",
        acceptTerms: "si",
      }),
    ),
  ).rejects.toThrow("NEXT_REDIRECT:/cuenta?aviso=cuenta-creada");
  return email;
}

beforeEach(() => {
  vi.stubEnv("DATA_SOURCE", "mock");
  // A new browser for every test: no session, its own anonymous id.
  jar.clear();
  setCookie.mockClear();
  refresh.mockClear();
});

describe("logInAction", () => {
  it("signs the demo account in and goes back where the customer was", async () => {
    await expect(
      logInAction(
        initialFormState(),
        form({ ...DEMO_LOG_IN, volver: "/productos/soundcore-liberty-5" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/productos/soundcore-liberty-5");

    expect(jar.get(SESSION_COOKIE)).toMatch(/^[\w-]{43}$/);
    expect((await signedInAccount())?.email).toBe(DEMO_ACCOUNT.email);
  });

  it("never follows a return address to another site", async () => {
    await expect(
      logInAction(
        initialFormState(),
        form({ ...DEMO_LOG_IN, volver: "//evil.example/x" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/cuenta");
  });

  it("answers wrong passwords and unknown emails the same, keeping only the email", async () => {
    const wrong = await logInAction(
      initialFormState(),
      form({ email: "demo@migeanje.pe", password: "otra-clave-1" }),
    );
    const unknown = await logInAction(
      initialFormState(),
      form({ email: "nadie@migeanje.pe", password: "Demo-2026!" }),
    );

    expect(wrong.formError).toEqual({
      title: "No pudimos ingresar",
      message: "Correo o contraseña incorrectos.",
    });
    expect(unknown.formError).toEqual(wrong.formError);
    expect(wrong.values).toEqual({ email: "demo@migeanje.pe" });
    expect(jar.has(SESSION_COOKIE)).toBe(false);
  });

  it("checks the fields before trying", async () => {
    const state = await logInAction(
      initialFormState(),
      form({ email: "", password: "" }),
    );
    expect(state.errors).toEqual({
      email: "Escribe tu correo electrónico.",
      password: "Escribe tu contraseña.",
    });
    expect(state.attempt).toBe(1);
  });

  it("pauses a browser after 10 failures", async () => {
    let state = initialFormState<"email" | "password">();
    for (let n = 0; n < 10; n += 1) {
      state = await logInAction(
        state,
        form({ email: "nadie@migeanje.pe", password: `mal-${n}` }),
      );
    }
    state = await logInAction(state, form(DEMO_LOG_IN));
    expect(state.formError?.title).toBe("Demasiados intentos");
  });

  it("rotates the session: the cookie from before stops working", async () => {
    await expect(
      logInAction(initialFormState(), form(DEMO_LOG_IN)),
    ).rejects.toThrow("NEXT_REDIRECT");
    const first = jar.get(SESSION_COOKIE);

    await expect(
      logInAction(initialFormState(), form(DEMO_LOG_IN)),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(jar.get(SESSION_COOKIE)).not.toBe(first);
    expect(await getSessionStore().find(first ?? "", new Date())).toBeNull();
  });
});

describe("readAccountNameAction", () => {
  it("answers the first name of the signed-in account, or null", async () => {
    expect(await readAccountNameAction()).toBeNull();

    await signUp();

    expect(await readAccountNameAction()).toBe("Luis");
  });
});

describe("registerAction", () => {
  it("creates the account, signs it in and welcomes the customer", async () => {
    const email = await signUp();

    const account = await signedInAccount();
    expect(account?.email).toBe(email);
    expect(account?.firstName).toBe("Luis");
  });

  it("says when the email already has an account, never echoing the password", async () => {
    const state = await registerAction(
      initialFormState(),
      form({
        firstName: "Otra",
        lastName: "Persona",
        email: "DEMO@migeanje.pe",
        phone: "",
        password: "Otra-clave-2",
        acceptTerms: "si",
      }),
    );

    expect(state.formError?.title).toBe("No pudimos crear tu cuenta");
    expect(state.values).not.toHaveProperty("password");
    expect(state.values.email).toBe("DEMO@migeanje.pe");
  });

  it("goes back to a safe return address", async () => {
    await expect(
      registerAction(
        initialFormState(),
        form({
          firstName: "Luis",
          lastName: "Rojas",
          email: `cliente-${crypto.randomUUID()}@correo.pe`,
          phone: "987654321",
          password: "Otra-clave-2",
          acceptTerms: "si",
          volver: "/cuenta/favoritos",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/cuenta/favoritos");
  });

  it("refuses weak passwords and missing consent", async () => {
    const state = await registerAction(
      initialFormState(),
      form({
        firstName: "Luis",
        lastName: "Rojas",
        email: "luis@correo.pe",
        phone: "",
        password: "corta",
      }),
    );
    expect(Object.keys(state.errors)).toEqual(["password", "acceptTerms"]);
  });
});

describe("recoverAction", () => {
  it("answers the same for any valid email (no account enumeration)", async () => {
    for (const email of ["demo@migeanje.pe", "nadie@migeanje.pe"]) {
      await expect(
        recoverAction(initialFormState(), form({ email })),
      ).rejects.toThrow("NEXT_REDIRECT:/cuenta/recuperar?aviso=correo-enviado");
    }
  });

  it("checks the email", async () => {
    const state = await recoverAction(initialFormState(), form({ email: "x" }));
    expect(state.errors.email).toBe(
      "Revisa tu correo: debe ser como nombre@correo.com.",
    );
  });
});

describe("logOutAction", () => {
  it("ends the session and clears the cookie", async () => {
    await signUp();
    const token = jar.get(SESSION_COOKIE) ?? "";

    await expect(logOutAction()).rejects.toThrow(
      "NEXT_REDIRECT:/cuenta/ingresar?aviso=sesion-cerrada",
    );

    expect(jar.get(SESSION_COOKIE)).toBe("");
    expect(await getSessionStore().find(token, new Date())).toBeNull();
  });
});

describe("profile and addresses", () => {
  it("send a guest to sign in first", async () => {
    await expect(
      updateProfileAction(
        initialFormState(),
        form({ firstName: "A", lastName: "B", phone: "" }),
      ),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/cuenta/ingresar?volver=%2Fcuenta%2Fperfil",
    );
    await expect(
      deleteAddressAction(form({ addressId: crypto.randomUUID() })),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/cuenta/ingresar?volver=%2Fcuenta%2Fdirecciones",
    );
  });

  it("save the profile of the signed-in account", async () => {
    await signUp();

    await expect(
      updateProfileAction(
        initialFormState(),
        form({
          firstName: "Luis Alberto",
          lastName: "Rojas",
          phone: "987654321",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/cuenta/perfil?aviso=perfil-guardado");

    const account = await signedInAccount();
    expect(account?.firstName).toBe("Luis Alberto");
    expect(account?.phone).toBe("987654321");
  });

  it("add, make default and delete addresses with resolved places", async () => {
    await signUp();
    const fields = {
      addressId: "",
      label: "Casa",
      addressLine: "Av. Larco 1234",
      addressReference: "",
      departamento: "15",
      provincia: "1501",
      distrito: "150122",
    };

    await expect(
      saveAddressAction(initialFormState(), form(fields)),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/cuenta/direcciones?aviso=direccion-guardada",
    );
    await expect(
      saveAddressAction(
        initialFormState(),
        form({
          ...fields,
          label: "Oficina",
          departamento: "04",
          provincia: "0401",
          distrito: "040101",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    let account = await signedInAccount();
    const [home, office] = account?.addresses ?? [];
    expect(home?.ubigeo.distrito).toEqual({
      code: "150122",
      name: "Miraflores",
    });
    expect(account?.defaultAddressId).toBe(home?.id);

    await expect(
      setDefaultAddressAction(form({ addressId: office?.id ?? "" })),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/cuenta/direcciones?aviso=direccion-principal",
    );
    await expect(
      deleteAddressAction(form({ addressId: home?.id ?? "" })),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/cuenta/direcciones?aviso=direccion-eliminada",
    );

    account = await signedInAccount();
    expect(account?.addresses.map(({ label }) => label)).toEqual(["Oficina"]);
    expect(account?.defaultAddressId).toBe(office?.id);
  });

  it("refuse a place that does not exist", async () => {
    await signUp();
    const state = await saveAddressAction(
      initialFormState(),
      form({
        addressId: "",
        label: "",
        addressLine: "Av. Larco 1234",
        addressReference: "",
        departamento: "15",
        provincia: "1501",
        distrito: "150199",
      }),
    );
    expect(state.errors).toEqual({
      distrito: "No encontramos ese distrito. Elige tu ubicación de nuevo.",
    });
  });

  it("refresh the place options without JavaScript (intent=ubigeo)", async () => {
    await signUp();
    const data = form({
      addressId: "",
      label: "",
      addressLine: "",
      addressReference: "",
      departamento: "04",
      provincia: "1501",
      distrito: "150122",
      intent: "ubigeo",
    });

    const state = await saveAddressAction(initialFormState(), data);

    expect(state.values).toMatchObject({
      departamento: "04",
      provincia: "",
      distrito: "",
    });
    expect(state.errors).toEqual({});
    expect(state.attempt).toBe(0);
  });
});

describe("favorites", () => {
  it("send a guest to sign in, back to the product", async () => {
    await expect(
      toggleFavoriteAction(
        initialFavoriteState(false),
        form({
          slug: "soundcore-liberty-5",
          favorito: "si",
          volver: "/productos/soundcore-liberty-5",
        }),
      ),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/cuenta/ingresar?volver=%2Fproductos%2Fsoundcore-liberty-5",
    );
  });

  it("save and remove a favorite for the signed-in account", async () => {
    await signUp();

    const saved = await toggleFavoriteAction(
      initialFavoriteState(false),
      form({ slug: "soundcore-liberty-5", favorito: "si" }),
    );
    expect(saved).toMatchObject({
      favorite: true,
      message: "Guardamos el producto en tus favoritos.",
    });
    expect(refresh).toHaveBeenCalled();
    expect((await signedInAccount())?.favorites).toEqual([
      "soundcore-liberty-5",
    ]);

    const removed = await toggleFavoriteAction(
      saved,
      form({ slug: "soundcore-liberty-5", favorito: "no" }),
    );
    expect(removed.favorite).toBe(false);
    expect((await signedInAccount())?.favorites).toEqual([]);
  });

  it("remove a favorite from the favorites page", async () => {
    await signUp();
    await toggleFavoriteAction(
      initialFavoriteState(false),
      form({ slug: "soundcore-liberty-5", favorito: "si" }),
    );

    await expect(
      removeFavoriteAction(form({ slug: "soundcore-liberty-5" })),
    ).rejects.toThrow("NEXT_REDIRECT:/cuenta/favoritos?aviso=favorito-quitado");
    expect((await signedInAccount())?.favorites).toEqual([]);
  });

  it("answer an error for something that is not a product", async () => {
    await signUp();
    const state = await toggleFavoriteAction(
      initialFavoriteState(false),
      form({ slug: "<script>", favorito: "si" }),
    );
    expect(state).toMatchObject({ favorite: false, tone: "error" });
  });
});
