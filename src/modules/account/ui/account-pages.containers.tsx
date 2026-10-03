import Link from "next/link";
import {
  type AccountAddress,
  type CustomerAccount,
  defaultAddress,
} from "@/modules/account/domain/customer-account";
import { getUbigeoDirectory } from "@/modules/checkout/infrastructure";
import {
  type FormState,
  initialFormState,
} from "@/modules/checkout/ui/checkout-forms";
import { Button } from "@/shared/ui/atoms/button";
import { Heading } from "@/shared/ui/atoms/heading";
import { Price } from "@/shared/ui/atoms/price";
import { Tag } from "@/shared/ui/atoms/tag";
import { Text } from "@/shared/ui/atoms/text";
import { DescriptionList } from "@/shared/ui/molecules/description-list";
import { EmptyState } from "@/shared/ui/molecules/empty-state";
import { ProductCard } from "@/shared/ui/molecules/product-card";
import { AccountPage } from "@/shared/ui/templates/account-page";
import {
  ACCOUNT_NOTICES,
  ADDRESSES_COPY,
  DASHBOARD_COPY,
  FAVORITES_COPY,
  ORDERS_COPY,
  PROFILE_COPY,
} from "./account-copy";
import type {
  AccountOrderSummary,
  AccountOrdersLookup,
  FavoriteProductsLookup,
} from "./account-extensions";
import type { AddressField } from "./account-forms";
import { AccountNavigation } from "./account-navigation";
import { ACCOUNT_PATHS, noticeFrom } from "./account-paths";
import { requireSignedInAccount } from "./account-session";
import {
  deleteAddressAction,
  removeFavoriteAction,
  saveAddressAction,
  setDefaultAddressAction,
  updateProfileAction,
} from "./actions";
import { AddressForm } from "./address-form";
import { ProfileForm } from "./profile-form";

type SearchParams = Record<string, string | string[] | undefined>;

const RECENT_ORDERS = 3;

const linkClassName =
  "text-body-sm font-medium text-foreground underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** One order: number, date, status, items and total, with its two links. */
function OrderSummaryCard({
  order,
  headingLevel,
}: {
  order: AccountOrderSummary;
  /** 3 under a section heading, 2 right under the page title. */
  headingLevel: 2 | 3;
}) {
  const Title = headingLevel === 2 ? "h2" : "h3";
  return (
    <article
      aria-labelledby={`pedido-${order.number}`}
      className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5"
    >
      <Title
        id={`pedido-${order.number}`}
        className="font-mono text-body font-medium text-foreground"
      >
        {order.number}
      </Title>
      <DescriptionList
        columns={2}
        items={[
          {
            term: ORDERS_COPY.placedOn,
            details: (
              <time dateTime={order.placedOn.dateTime}>
                {order.placedOn.label}
              </time>
            ),
          },
          { term: ORDERS_COPY.status, details: order.status },
          { term: ORDERS_COPY.items, details: order.itemCountLabel },
          {
            term: ORDERS_COPY.total,
            details: <Price amount={order.total} size="sm" />,
          },
        ]}
      />
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary" size="sm">
          <Link href={order.trackingHref}>
            {ORDERS_COPY.track} <span className="sr-only">{order.number}</span>
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href={order.detailHref}>
            {ORDERS_COPY.detail}{" "}
            <span className="sr-only">de {order.number}</span>
          </Link>
        </Button>
      </div>
    </article>
  );
}

function NoOrders({ headingLevel }: { headingLevel: 2 | 3 }) {
  return (
    <EmptyState title={ORDERS_COPY.empty} headingLevel={headingLevel}>
      <Button asChild>
        <Link href="/">{ORDERS_COPY.emptyAction}</Link>
      </Button>
    </EmptyState>
  );
}

/** Server Component: /cuenta, the account's start page. */
export async function AccountDashboardContainer({
  searchParams,
  orders,
}: {
  searchParams: SearchParams;
  orders: AccountOrdersLookup;
}) {
  const account = await requireSignedInAccount(ACCOUNT_PATHS.home);
  const recent = (await orders(account.email)).slice(0, RECENT_ORDERS);
  const main = defaultAddress(account);

  return (
    <AccountPage
      title={DASHBOARD_COPY.greeting(account.firstName)}
      description={DASHBOARD_COPY.description}
      notice={noticeFrom(searchParams, ACCOUNT_NOTICES)}
      nav={<AccountNavigation current={ACCOUNT_PATHS.home} />}
    >
      <section aria-labelledby="cuenta-pedidos" className="flex flex-col gap-4">
        <Heading id="cuenta-pedidos" level={2}>
          {DASHBOARD_COPY.recentOrders}
        </Heading>
        {recent.length === 0 ? (
          <Text tone="muted">{DASHBOARD_COPY.noOrders}</Text>
        ) : (
          <>
            <div className="grid gap-4 xl:grid-cols-2">
              {recent.map((order) => (
                <OrderSummaryCard
                  key={order.number}
                  order={order}
                  headingLevel={3}
                />
              ))}
            </div>
            <p>
              <Link href={ACCOUNT_PATHS.orders} className={linkClassName}>
                {DASHBOARD_COPY.allOrders}
              </Link>
            </p>
          </>
        )}
      </section>
      <section aria-labelledby="cuenta-accesos" className="flex flex-col gap-4">
        <Heading id="cuenta-accesos" level={2}>
          {DASHBOARD_COPY.quickLinks}
        </Heading>
        <ul className="grid gap-4 sm:grid-cols-3">
          {DASHBOARD_COPY.links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex h-full flex-col gap-1 rounded-lg border border-border bg-card p-5 transition-colors duration-(--duration-fast) ease-out hover:border-input focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="text-body font-medium text-foreground">
                  {link.label}
                </span>
                <span className="text-body-sm text-muted-foreground">
                  {link.href === ACCOUNT_PATHS.addresses && main
                    ? `Principal: ${main.ubigeo.distrito.name}`
                    : link.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </AccountPage>
  );
}

/** Server Component: /cuenta/perfil. */
export async function ProfilePageContainer({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const account = await requireSignedInAccount(ACCOUNT_PATHS.profile);
  return (
    <AccountPage
      title={PROFILE_COPY.title}
      description={PROFILE_COPY.description}
      notice={noticeFrom(searchParams, ACCOUNT_NOTICES)}
      nav={<AccountNavigation current={ACCOUNT_PATHS.profile} />}
    >
      <DescriptionList
        className="max-w-xl"
        items={[{ term: PROFILE_COPY.emailLabel, details: account.email }]}
      />
      <Text size="body-sm" tone="muted" className="-mt-8">
        {PROFILE_COPY.emailNote}
      </Text>
      <ProfileForm
        action={updateProfileAction}
        initialState={initialFormState({
          firstName: account.firstName,
          lastName: account.lastName,
          phone: account.phone ?? "",
        })}
      />
    </AccountPage>
  );
}

function addressFormValues(
  address: AccountAddress | undefined,
  account: CustomerAccount,
): FormState<AddressField> {
  if (!address) return initialFormState();
  return initialFormState({
    addressId: address.id,
    label: address.label,
    addressLine: address.line,
    addressReference: address.reference,
    departamento: address.ubigeo.departamento.code,
    provincia: address.ubigeo.provincia.code,
    distrito: address.ubigeo.distrito.code,
    makeDefault: account.defaultAddressId === address.id ? "si" : "",
  });
}

function AddressCard({
  address,
  isDefault,
}: {
  address: AccountAddress;
  isDefault: boolean;
}) {
  const { departamento, provincia, distrito } = address.ubigeo;
  const name = address.label || address.line;
  return (
    <article
      aria-labelledby={`direccion-${address.id}`}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3
          id={`direccion-${address.id}`}
          className="text-body font-medium text-foreground"
        >
          {name}
        </h3>
        {isDefault ? <Tag>{ADDRESSES_COPY.defaultBadge}</Tag> : null}
      </div>
      <address className="flex flex-col text-body-sm text-muted-foreground not-italic">
        <span className="text-foreground">{address.line}</span>
        {address.reference ? <span>{address.reference}</span> : null}
        <span>
          {distrito.name}, {provincia.name}, {departamento.name}
        </span>
      </address>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="secondary" size="sm">
          <Link
            href={`${ACCOUNT_PATHS.addresses}?editar=${encodeURIComponent(address.id)}`}
          >
            {ADDRESSES_COPY.edit}
            <span className="sr-only">: {name}</span>
          </Link>
        </Button>
        {isDefault ? null : (
          <form action={setDefaultAddressAction}>
            <input type="hidden" name="addressId" value={address.id} />
            <Button type="submit" variant="ghost" size="sm">
              {ADDRESSES_COPY.setDefault}
              <span className="sr-only">: {name}</span>
            </Button>
          </form>
        )}
        <form action={deleteAddressAction}>
          <input type="hidden" name="addressId" value={address.id} />
          <Button type="submit" variant="ghost" size="sm">
            {ADDRESSES_COPY.remove}
            <span className="sr-only">: {name}</span>
          </Button>
        </form>
      </div>
    </article>
  );
}

/** Server Component: /cuenta/direcciones (`?editar=<id>` edits one). */
export async function AddressesPageContainer({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const account = await requireSignedInAccount(ACCOUNT_PATHS.addresses);
  const ubigeo = await getUbigeoDirectory().tree();
  const editId = searchParams.editar;
  const editing = account.addresses.find(({ id }) => id === editId);

  return (
    <AccountPage
      title={ADDRESSES_COPY.title}
      description={ADDRESSES_COPY.description}
      notice={noticeFrom(searchParams, ACCOUNT_NOTICES)}
      nav={<AccountNavigation current={ACCOUNT_PATHS.addresses} />}
    >
      <section
        aria-labelledby="direcciones-lista"
        className="flex flex-col gap-4"
      >
        <Heading id="direcciones-lista" level={2}>
          {ADDRESSES_COPY.listHeading}
        </Heading>
        {account.addresses.length === 0 ? (
          <Text tone="muted">{ADDRESSES_COPY.empty}</Text>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {account.addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                isDefault={address.id === account.defaultAddressId}
              />
            ))}
          </div>
        )}
      </section>
      <section
        id="formulario-direccion"
        aria-labelledby="direcciones-formulario"
        className="flex max-w-2xl scroll-mt-32 flex-col gap-6"
      >
        <Heading id="direcciones-formulario" level={2}>
          {editing ? ADDRESSES_COPY.editHeading : ADDRESSES_COPY.newHeading}
        </Heading>
        <AddressForm
          // A new form (fresh fields) for each address being edited.
          key={editing?.id ?? "nueva"}
          action={saveAddressAction}
          initialState={addressFormValues(editing, account)}
          ubigeo={ubigeo}
          cancelHref={ACCOUNT_PATHS.addresses}
        />
      </section>
    </AccountPage>
  );
}

/** Server Component: /cuenta/pedidos. */
export async function AccountOrdersContainer({
  orders,
}: {
  orders: AccountOrdersLookup;
}) {
  const account = await requireSignedInAccount(ACCOUNT_PATHS.orders);
  const list = await orders(account.email);
  return (
    <AccountPage
      title={ORDERS_COPY.title}
      description={ORDERS_COPY.description}
      nav={<AccountNavigation current={ACCOUNT_PATHS.orders} />}
    >
      {list.length === 0 ? (
        <NoOrders headingLevel={2} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {list.map((order) => (
            <OrderSummaryCard
              key={order.number}
              order={order}
              headingLevel={2}
            />
          ))}
        </div>
      )}
    </AccountPage>
  );
}

/** Server Component: /cuenta/favoritos. */
export async function FavoritesPageContainer({
  searchParams,
  products,
}: {
  searchParams: SearchParams;
  products: FavoriteProductsLookup;
}) {
  const account = await requireSignedInAccount(ACCOUNT_PATHS.favorites);
  const cards = await products(account.favorites);
  const missing = cards.length < account.favorites.length;

  return (
    <AccountPage
      title={FAVORITES_COPY.title}
      description={FAVORITES_COPY.description}
      notice={noticeFrom(searchParams, ACCOUNT_NOTICES)}
      nav={<AccountNavigation current={ACCOUNT_PATHS.favorites} />}
    >
      {cards.length === 0 ? (
        <EmptyState
          title={FAVORITES_COPY.empty}
          description={FAVORITES_COPY.emptyHint}
        >
          <Button asChild>
            <Link href="/">{FAVORITES_COPY.emptyAction}</Link>
          </Button>
        </EmptyState>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ slug, card }) => (
            <li key={slug} className="flex flex-col gap-3">
              <ProductCard {...card} headingLevel={2} className="flex-1" />
              {/* Outside the card: the card is one stretched link. */}
              <form action={removeFavoriteAction}>
                <input type="hidden" name="slug" value={slug} />
                <Button type="submit" variant="ghost" size="sm">
                  {FAVORITES_COPY.remove}
                  <span className="sr-only">: {card.name}</span>
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
      {missing ? <Text tone="muted">{FAVORITES_COPY.unavailable}</Text> : null}
    </AccountPage>
  );
}
