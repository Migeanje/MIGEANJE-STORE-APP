import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FAVORITE_TOGGLE_COPY } from "./account-copy";
import {
  FavoriteSignInLink,
  FavoriteToggle,
  type ToggleFavoriteAction,
} from "./favorite-toggle";

// Stands in for `toggleFavoriteAction`: accepts after a short wait.
const accept: ToggleFavoriteAction = async (state, formData) => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const favorite = formData.get("favorito") === "si";
  return {
    favorite,
    message: favorite
      ? FAVORITE_TOGGLE_COPY.added
      : FAVORITE_TOGGLE_COPY.removed,
    tone: "default",
    attempt: state.attempt + 1,
  };
};

const meta = {
  title: "Account/FavoriteToggle",
  component: FavoriteToggle,
  tags: ["autodocs"],
  args: {
    slug: "soundcore-liberty-5",
    initialFavorite: false,
    action: accept,
    returnTo: "/productos/soundcore-liberty-5",
  },
  parameters: {
    docs: {
      description: {
        component:
          '"Guardar en favoritos" on the product page for a signed-in customer: a toggle button (`aria-pressed`, the look of "Comparar") in a form that posts to `toggleFavoriteAction` (works without JavaScript). It shows the new state while the answer is on its way and announces it in a polite status. Guests get `FavoriteSignInLink` instead.',
      },
    },
  },
} satisfies Meta<typeof FavoriteToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotSaved: Story = { name: "Not saved" };

export const Saved: Story = { args: { initialFavorite: true } };

export const Guest: Story = {
  name: "Guest (sign-in link)",
  render: (args) => <FavoriteSignInLink returnTo={args.returnTo} />,
};
