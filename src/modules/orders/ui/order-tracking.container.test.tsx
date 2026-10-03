import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getOrderRepository } from "@/modules/orders/infrastructure";
import { ACCESS_TOKEN, anOrder } from "@/modules/orders/testing/order-builders";
import { expectNoAxeViolations } from "@/test/a11y";
import { OrderTrackingContainer } from "./order-tracking.container";

vi.mock("server-only", () => ({}));

const access = vi.hoisted(() => ({
  value: null as null | { number: string; accessToken: string },
}));
vi.mock("@/modules/orders/infrastructure/order-access-cookie", () => ({
  readOrderAccess: async () => access.value,
}));
vi.mock("./actions", () => ({
  trackOrderAction: vi.fn(),
  trackAnotherOrderAction: vi.fn(),
}));

const order = anOrder({ number: "MG-2026-626262" });

beforeEach(async () => {
  access.value = null;
  await getOrderRepository().save(order);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const numberField = () =>
  screen.getByRole("textbox", { name: /Número de pedido/ });

describe("OrderTrackingContainer", () => {
  it("asks for the number and email, prefilling only the number from the link", async () => {
    render(await OrderTrackingContainer({ numero: "mg-2026-626262" }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Seguimiento de pedido" }),
    ).toBeInTheDocument();
    expect(numberField()).toHaveValue("MG-2026-626262");
    expect(
      screen.getByRole("textbox", { name: /Correo electrónico/ }),
    ).toHaveValue("");
    expect(
      screen.queryByRole("region", { name: "Estado del pedido" }),
    ).toBeNull();
  });

  it("hints the demo orders with mock data only", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const { unmount } = render(await OrderTrackingContainer({}));

    const hint = screen.getByRole("region", { name: "Datos de demostración" });
    expect(hint).toHaveTextContent("demo@migeanje.pe");
    expect(
      within(hint).getByRole("link", { name: /MG-2026-480315/ }),
    ).toHaveAttribute("href", "/pedidos/seguimiento?numero=MG-2026-480315");
    expect(hint).toHaveTextContent("En importación");
    unmount();

    vi.stubEnv("DATA_SOURCE", "medusa");
    render(await OrderTrackingContainer({}));
    expect(
      screen.queryByRole("region", { name: "Datos de demostración" }),
    ).toBeNull();
  });

  it("shows the status of the order this browser looked up (or paid)", async () => {
    access.value = { number: order.number, accessToken: ACCESS_TOKEN };
    render(await OrderTrackingContainer({}));

    expect(screen.getByText(order.number)).toHaveClass("font-mono");
    expect(
      screen.getByRole("region", { name: "Estado del pedido" }),
    ).toHaveTextContent("Pagado");
    expect(
      screen.getByRole("button", { name: "Consultar otro pedido" }),
    ).toHaveAttribute("type", "submit");
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("links the Libro de Reclamaciones with the order number when one is shown", async () => {
    const { unmount } = render(await OrderTrackingContainer({}));
    expect(
      screen.getByRole("link", { name: "Libro de Reclamaciones" }),
    ).toHaveAttribute("href", "/libro-de-reclamaciones");
    unmount();

    access.value = { number: order.number, accessToken: ACCESS_TOKEN };
    render(await OrderTrackingContainer({}));
    expect(
      screen.getByRole("link", { name: "Libro de Reclamaciones" }),
    ).toHaveAttribute("href", "/libro-de-reclamaciones?pedido=MG-2026-626262");
  });

  it("follows ?numero= of the same order, and asks again for another one", async () => {
    access.value = { number: order.number, accessToken: ACCESS_TOKEN };
    const { unmount } = render(
      await OrderTrackingContainer({ numero: "mg 2026 626262" }),
    );
    expect(
      screen.getByRole("region", { name: "Estado del pedido" }),
    ).toBeInTheDocument();
    unmount();

    render(await OrderTrackingContainer({ numero: "MG-2026-111111" }));
    expect(numberField()).toHaveValue("MG-2026-111111");
  });

  it("asks again when the remembered access is wrong", async () => {
    access.value = {
      number: order.number,
      accessToken: "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d",
    };
    render(await OrderTrackingContainer({}));
    expect(numberField()).toHaveValue("");
  });

  it("has no axe violations: lookup and order status", async () => {
    vi.stubEnv("DATA_SOURCE", "mock");
    const { container, unmount } = render(await OrderTrackingContainer({}));
    await expectNoAxeViolations(container);
    unmount();

    access.value = { number: order.number, accessToken: ACCESS_TOKEN };
    const status = render(await OrderTrackingContainer({}));
    await expectNoAxeViolations(status.container);
  });
});
