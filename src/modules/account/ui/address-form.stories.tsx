import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  type UbigeoTree,
  ubigeoTreeSchema,
} from "@/modules/checkout/domain/ubigeo";
import { initialFormState } from "@/modules/checkout/ui/checkout-forms";
import { AddressForm, type SaveAddressAction } from "./address-form";

// A few places of the mock ubigeo (the page gets the whole tree).
const UBIGEO: UbigeoTree = ubigeoTreeSchema.parse([
  {
    code: "04",
    name: "Arequipa",
    provincias: [
      {
        code: "0401",
        name: "Arequipa",
        distritos: [
          { code: "040101", name: "Arequipa" },
          { code: "040103", name: "Cayma" },
        ],
      },
    ],
  },
  {
    code: "15",
    name: "Lima",
    provincias: [
      {
        code: "1501",
        name: "Lima",
        distritos: [
          { code: "150101", name: "Lima" },
          { code: "150122", name: "Miraflores" },
        ],
      },
    ],
  },
]);

// Stands in for `saveAddressAction`: answers the values back.
const echo: SaveAddressAction = async (state, formData) => ({
  values: Object.fromEntries(
    [...formData].map(([name, value]) => [name, String(value)]),
  ),
  errors: {},
  formError: null,
  attempt: state.attempt,
});

const meta = {
  title: "Account/AddressForm",
  component: AddressForm,
  tags: ["autodocs"],
  args: {
    action: echo,
    initialState: initialFormState(),
    ubigeo: UBIGEO,
    cancelHref: "/cuenta/direcciones",
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl rounded-lg border bg-card p-6">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'An address of the address book (/cuenta/direcciones): name, street, reference, cascading ubigeo selects (with the no-JavaScript "Actualizar provincias y distritos" submit, like the checkout) and "Usar como dirección principal". Posts to `saveAddressAction`; editing adds "Cancelar".',
      },
    },
  },
} satisfies Meta<typeof AddressForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const New: Story = {};

export const Editing: Story = {
  args: {
    initialState: initialFormState({
      addressId: "5a0c9e4e-1d2b-4c3a-9f8e-7d6c5b4a3f21",
      label: "Casa",
      addressLine: "Av. José Pardo 500, dpto. 302",
      addressReference: "Cerca al óvalo Gutiérrez",
      departamento: "15",
      provincia: "1501",
      distrito: "150122",
      makeDefault: "si",
    }),
  },
};
