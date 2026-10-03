/**
 * Transactional pages (cart, checkout, account, orders, Libro de
 * Reclamaciones, legal): native scroll and micro-transitions only, so nothing
 * slows down buying. No Lenis, no scroll-linked GSAP.
 */
export default function TransactionalLayout({ children }: LayoutProps<"/">) {
  return children;
}
