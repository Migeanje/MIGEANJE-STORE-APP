import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/shared/ui/atoms/button";
import { AccountNav } from "./account-nav";

const meta = {
  title: "Molecules/AccountNav",
  component: AccountNav,
  tags: ["autodocs"],
  args: {
    items: [
      { href: "/cuenta", label: "Resumen" },
      { href: "/cuenta/pedidos", label: "Mis pedidos" },
      { href: "/cuenta/favoritos", label: "Favoritos" },
      { href: "/cuenta/direcciones", label: "Direcciones" },
      { href: "/cuenta/perfil", label: "Mis datos" },
    ],
    currentHref: "/cuenta/pedidos",
  },
  parameters: {
    docs: {
      description: {
        component:
          'Navigation between the account sections: wrapping pills on phones, a vertical list from `lg`. The current section has `aria-current="page"`; `footer` holds extra controls such as "Cerrar sesión".',
      },
    },
  },
} satisfies Meta<typeof AccountNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithSignOut: Story = {
  name: "With sign out",
  args: {
    footer: (
      <Button type="button" variant="secondary" size="sm">
        Cerrar sesión
      </Button>
    ),
  },
};
