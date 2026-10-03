import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getOrderRepository } from "@/modules/orders/infrastructure";
import { ACCESS_TOKEN, anOrder } from "@/modules/orders/testing/order-builders";
import { OrderConfirmationContainer } from "./order-confirmation.container";

vi.mock("server-only", () => ({}));

const access = vi.hoisted(() => ({
  value: null as null | { number: string; accessToken: string },
}));
vi.mock("@/modules/orders/infrastructure/order-access-cookie", () => ({
  readOrderAccess: async () => access.value,
}));
vi.mock("./actions", () => ({ unlockOrderAction: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const order = anOrder({ number: "MG-2026-424242" });

beforeEach(async () => {
  access.value = null;
  await getOrderRepository().save(order);
});

describe("OrderConfirmationContainer", () => {
  it("shows the confirmation right after paying (access cookie)", async () => {
    access.value = { number: order.number, accessToken: ACCESS_TOKEN };
    render(await OrderConfirmationContainer({ number: order.number }));

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "¡Gracias por tu compra!",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(order.number)).toHaveClass("font-mono");
  });

  it("asks for the email without access (or with another order's)", async () => {
    access.value = { number: "MG-2026-000001", accessToken: ACCESS_TOKEN };
    render(await OrderConfirmationContainer({ number: order.number }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Confirma tu correo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /Correo electrónico/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText("¡Gracias por tu compra!")).toBeNull();
  });

  it("asks for the email with a wrong token too", async () => {
    access.value = {
      number: order.number,
      accessToken: "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d",
    };
    render(await OrderConfirmationContainer({ number: order.number }));
    expect(
      screen.getByRole("heading", { level: 1, name: "Confirma tu correo" }),
    ).toBeInTheDocument();
  });

  it("is not found for a malformed number", async () => {
    await expect(OrderConfirmationContainer({ number: "123" })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});
