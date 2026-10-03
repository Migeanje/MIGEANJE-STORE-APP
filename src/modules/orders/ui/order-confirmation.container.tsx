import { notFound } from "next/navigation";
import { findOrderWithAccessToken } from "@/modules/orders/application/find-order";
import { ORDER_NUMBER_PATTERN } from "@/modules/orders/domain/order";
import { getOrderRepository } from "@/modules/orders/infrastructure";
import { readOrderAccess } from "@/modules/orders/infrastructure/order-access-cookie";
import { OrderConfirmation } from "@/shared/ui/templates/order-confirmation";
import { unlockOrderAction } from "./actions";
import { OrderAccessForm } from "./order-access-form";
import { orderConfirmationView } from "./order-view";

/**
 * /checkout/confirmacion/[number]: the confirmation for the browser that
 * just paid (its access cookie holds the order's secret token); anyone else
 * opens it with the buyer's email. A malformed number is a 404.
 */
export async function OrderConfirmationContainer({
  number,
}: {
  number: string;
}) {
  if (!ORDER_NUMBER_PATTERN.test(number)) notFound();

  const access = await readOrderAccess();
  const order =
    access?.number === number
      ? await findOrderWithAccessToken(
          getOrderRepository(),
          number,
          access.accessToken,
        )
      : null;
  if (!order) {
    return <OrderAccessForm number={number} action={unlockOrderAction} />;
  }
  return <OrderConfirmation {...orderConfirmationView(order)} />;
}
