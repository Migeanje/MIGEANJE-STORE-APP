import { findOrderWithAccessToken } from "@/modules/orders/application/find-order";
import {
  normalizeOrderNumber,
  type Order,
} from "@/modules/orders/domain/order";
import {
  getDemoTracking,
  getOrderRepository,
} from "@/modules/orders/infrastructure";
import { readOrderAccess } from "@/modules/orders/infrastructure/order-access-cookie";
import { Button } from "@/shared/ui/atoms/button";
import { OrderTracking } from "@/shared/ui/templates/order-tracking";
import { trackAnotherOrderAction, trackOrderAction } from "./actions";
import { DemoOrdersHint } from "./demo-orders-hint";
import {
  ORDER_STATUS_LABELS,
  TRACKING_COPY,
  trackingHelpLinks,
} from "./order-copy";
import { orderTrackingHref } from "./order-paths";
import { OrderTrackingForm } from "./order-tracking-form";
import { orderTrackingView } from "./order-tracking-view";
import { trackingInitialState } from "./tracking-form";

/**
 * The order this browser may see: the one in its access cookie (after a
 * lookup with number + email, or right after paying), unless `?numero=`
 * asks for another order.
 */
async function rememberedOrder(numero: string | undefined) {
  const access = await readOrderAccess();
  if (!access) return null;
  if (numero !== undefined && normalizeOrderNumber(numero) !== access.number) {
    return null;
  }
  return findOrderWithAccessToken(
    getOrderRepository(),
    access.number,
    access.accessToken,
  );
}

function demoHint() {
  const demo = getDemoTracking();
  if (!demo) return undefined;
  return (
    <DemoOrdersHint
      email={demo.email}
      orders={demo.orders.map(({ number, status }) => ({
        number,
        status: ORDER_STATUS_LABELS[status],
        href: orderTrackingHref(number),
      }))}
    />
  );
}

function trackAnotherOrder() {
  return (
    <form action={trackAnotherOrderAction}>
      <Button type="submit" variant="secondary" size="lg">
        {TRACKING_COPY.anotherOrder}
      </Button>
    </form>
  );
}

/**
 * /pedidos/seguimiento: public order tracking. Shows the status of the
 * order this browser looked up (refreshing keeps it while the access cookie
 * lasts); otherwise the lookup form, with the number from `?numero=`
 * prefilled and, with mock data, the demo orders.
 */
export async function OrderTrackingContainer({ numero }: { numero?: string }) {
  const order: Order | null = await rememberedOrder(numero);
  if (order) {
    return (
      <OrderTracking
        intro={TRACKING_COPY.intro}
        order={orderTrackingView(order)}
        orderActions={trackAnotherOrder()}
        helpLinks={trackingHelpLinks(order.number)}
      />
    );
  }
  return (
    <OrderTracking
      intro={TRACKING_COPY.intro}
      lookup={
        <OrderTrackingForm
          action={trackOrderAction}
          initialState={trackingInitialState(numero)}
        />
      }
      lookupAside={demoHint()}
      helpLinks={trackingHelpLinks()}
    />
  );
}
