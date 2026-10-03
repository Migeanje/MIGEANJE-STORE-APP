import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/shared/ui/atoms/button";
import { Input } from "@/shared/ui/atoms/input";
import { FormField } from "@/shared/ui/molecules/form-field";
import { AuthPage } from "./auth-page";

const meta = {
  title: "Templates/AuthPage",
  component: AuthPage,
  tags: ["autodocs"],
  args: {
    title: "Ingresa a tu cuenta",
    description: "Revisa tus pedidos, tus direcciones y tus favoritos.",
    children: (
      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => e.preventDefault()}
      >
        <FormField label="Correo electrónico" controlId="historia-correo">
          {(control) => <Input {...control} type="email" />}
        </FormField>
        <Button type="submit">Ingresar</Button>
      </form>
    ),
    footer: (
      <p>
        ¿No tienes cuenta? <a href="/cuenta/registro">Crea una cuenta</a>
      </p>
    ),
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Sign-in, registration and password recovery: one narrow column with the h1, a description, an optional notice (polite status), the form on a card and the links below.",
      },
    },
  },
} satisfies Meta<typeof AuthPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithNotice: Story = {
  name: "With notice",
  args: {
    title: "Recupera tu contraseña",
    notice:
      "Si existe una cuenta con ese correo, te enviamos un correo con los pasos para crear una nueva contraseña.",
  },
};
