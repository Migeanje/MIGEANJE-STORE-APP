import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/shared/ui/atoms/button";
import { UbigeoFields } from "./ubigeo-fields";

const DEPARTAMENTOS = [
  { code: "04", name: "Arequipa" },
  { code: "07", name: "Callao" },
  { code: "08", name: "Cusco" },
  { code: "15", name: "Lima" },
];
const PROVINCIAS = [
  { code: "1505", name: "Cañete" },
  { code: "1501", name: "Lima" },
];
const DISTRITOS = [
  { code: "150104", name: "Barranco" },
  { code: "150122", name: "Miraflores" },
  { code: "150131", name: "San Isidro" },
];

const meta = {
  title: "Molecules/UbigeoFields",
  component: UbigeoFields,
  tags: ["autodocs"],
  args: {
    idPrefix: "historia",
    departamentos: DEPARTAMENTOS,
    provincias: PROVINCIAS,
    distritos: DISTRITOS,
    defaultValues: {
      departamento: "15",
      provincia: "1501",
      distrito: "150122",
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Departamento, provincia and distrito of a Peruvian address: three native selects in a fieldset (they submit without JavaScript). The caller filters the options as the customer picks (INEI codes as values) and may add a refresh control for visits without JavaScript.",
      },
    },
  },
  render: (args) => (
    <form className="max-w-3xl">
      <UbigeoFields {...args} />
    </form>
  ),
} satisfies Meta<typeof UbigeoFields>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Selected: Story = {};

export const NothingPickedYet: Story = {
  name: "Nothing picked yet",
  args: { provincias: [], distritos: [], defaultValues: {} },
};

export const WithErrors: Story = {
  name: "With errors",
  args: {
    distritos: [],
    defaultValues: { departamento: "15", provincia: "" },
    errors: {
      provincia: "Elige tu provincia.",
      distrito: "Elige tu distrito.",
    },
  },
};

export const WithRefreshControl: Story = {
  name: "With a refresh control (no JavaScript)",
  args: {
    refreshControl: (
      <div>
        <Button type="submit" variant="secondary">
          Actualizar provincias y distritos
        </Button>
      </div>
    ),
  },
};
