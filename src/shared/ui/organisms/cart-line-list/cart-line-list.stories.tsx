import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { BACKORDER_LINE, IN_STOCK_LINE } from "./__fixtures__/cart-lines";
import { CartLineList, type CartLineListItem } from "./cart-line-list";

const meta = {
  title: "Organisms/CartLineList",
  component: CartLineList,
  tags: ["autodocs"],
  args: {
    lines: [IN_STOCK_LINE, BACKORDER_LINE],
    onQuantityChange: fn(),
    onRemove: fn(),
  },
  parameters: {
    docs: {
      description: {
        component:
          'The cart lines (`CartLine`) with a controlled quantity stepper ("Cantidad de {producto}", up to 5 in stock or 2 on backorder) and a "Quitar" button named after the product. The cart module owns the quantities (optimistic UI); `renderControls` swaps the controls for no-JavaScript forms on the cart page.',
      },
    },
  },
  render: function Render(args) {
    // A local stand-in for the cart module's optimistic state.
    const [lines, setLines] = useState<readonly CartLineListItem[]>(args.lines);
    return (
      <div className="max-w-md">
        <CartLineList
          {...args}
          lines={lines}
          onQuantityChange={(sku, quantity) => {
            args.onQuantityChange?.(sku, quantity);
            setLines((current) =>
              current.map((line) =>
                line.sku === sku
                  ? { ...line, quantity, lineTotal: line.unitPrice * quantity }
                  : line,
              ),
            );
          }}
          onRemove={(sku) => {
            args.onRemove?.(sku);
            setLines((current) => current.filter((line) => line.sku !== sku));
          }}
        />
      </div>
    );
  },
} satisfies Meta<typeof CartLineList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MixedCart: Story = { name: "In stock + backorder" };

export const OneLine: Story = {
  name: "One line",
  args: { lines: [IN_STOCK_LINE] },
};
