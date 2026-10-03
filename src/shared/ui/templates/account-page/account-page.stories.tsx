import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/shared/ui/atoms/button";
import { Text } from "@/shared/ui/atoms/text";
import { AccountNav } from "@/shared/ui/molecules/account-nav";
import { AccountPage } from "./account-page";

const NAV = (
  <AccountNav
    items={[
      { href: "/cuenta", label: "Resumen" },
      { href: "/cuenta/pedidos", label: "Mis pedidos" },
      { href: "/cuenta/favoritos", label: "Favoritos" },
      { href: "/cuenta/direcciones", label: "Direcciones" },
      { href: "/cuenta/perfil", label: "Mis datos" },
    ]}
    currentHref="/cuenta/perfil"
    footer={
      <Button type="button" variant="secondary" size="sm">
        Cerrar sesión
      </Button>
    }
  />
);

const meta = {
  title: "Templates/AccountPage",
  component: AccountPage,
  tags: ["autodocs"],
  args: {
    title: "Mis datos",
    description: "Tu nombre y tu celular para los envíos.",
    nav: NAV,
    children: <Text>El formulario de la página va aquí.</Text>,
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A signed-in account page: h1, optional description and notice (polite status after a change), the account navigation (top on phones, left column from `lg`) and the content.",
      },
    },
  },
} satisfies Meta<typeof AccountPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithNotice: Story = {
  name: "With notice",
  args: { notice: "Guardamos tus datos." },
};
