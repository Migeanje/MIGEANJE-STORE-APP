import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Heading } from "@/shared/ui/atoms/heading";
import { Text } from "@/shared/ui/atoms/text";
import { LegalPage } from "./legal-page";

const meta = {
  title: "Templates/LegalPage",
  component: LegalPage,
  tags: ["autodocs"],
  args: {
    title: "Envíos y devoluciones",
    intro:
      "Cuánto cuesta el envío, cuándo llega tu pedido y qué hacer si quieres devolver un producto.",
    updatedAt: { label: "3 de octubre de 2026", dateTime: "2026-10-03" },
    draftNote:
      "Este texto es una propuesta y puede cambiar antes de que la tienda abra.",
    sections: [
      {
        id: "costos-y-plazos",
        title: "Costos y plazos de envío",
        content: (
          <>
            <Text>
              El costo de envío depende de tu distrito y se suma al total antes
              de pagar.
            </Text>
            <table>
              <caption>Costo y tiempo del courier por zona</caption>
              <thead>
                <tr>
                  <th scope="col">Zona</th>
                  <th scope="col">Costo</th>
                  <th scope="col">Tiempo de entrega</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Lima Metropolitana</th>
                  <td>S/ 10.00</td>
                  <td>24–48 h (días hábiles)</td>
                </tr>
                <tr>
                  <th scope="row">Resto del Perú</th>
                  <td>S/ 20.00</td>
                  <td>3–5 días hábiles</td>
                </tr>
              </tbody>
            </table>
            <ul>
              <li>Pagas un solo envío por pedido.</li>
              <li>Los feriados pueden sumar un día.</li>
            </ul>
          </>
        ),
      },
      {
        id: "en-importacion",
        title: "Productos en importación",
        content: (
          <>
            <Text>
              Si tu pedido incluye un producto en importación, lo pedimos para
              ti apenas confirmamos tu pago.
            </Text>
            <Heading level={3} className="text-body font-medium">
              Cuándo llega
            </Heading>
            <Text>
              La importación suma de 15 a 20 días hábiles a la fecha estimada.
            </Text>
          </>
        ),
      },
      {
        id: "devoluciones",
        title: "Devoluciones",
        content: (
          <Text>
            Si algo no está bien, escríbenos o usa el{" "}
            <a href="/libro-de-reclamaciones">Libro de Reclamaciones</a>.
          </Text>
        ),
      },
    ],
    related: [
      { href: "/garantias", label: "Garantías" },
      { href: "/libro-de-reclamaciones", label: "Libro de Reclamaciones" },
    ],
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          'A readable legal or trust page: title, intro and "Última actualización", an optional "Borrador pendiente de revisión legal" banner, a table of contents with in-page anchors (from 3 sections, sticky beside the text on wide screens), sections as h2 regions at about 68 characters per line, and related links.',
      },
    },
  },
} satisfies Meta<typeof LegalPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Draft: Story = {};

export const Reviewed: Story = {
  args: { draftNote: undefined },
};

export const ShortWithoutContents: Story = {
  args: {
    title: "Cómo elegimos",
    draftNote: undefined,
    related: undefined,
    sections: [
      {
        id: "seleccion",
        title: "Cómo seleccionamos",
        content: (
          <Text>
            Solo vendemos productos de distribuidores e importadores oficiales.
          </Text>
        ),
      },
      {
        id: "lo-que-no-hacemos",
        title: "Lo que no hacemos",
        content: <Text>No cobramos por aparecer en la tienda.</Text>,
      },
    ],
  },
};
