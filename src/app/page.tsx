export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col justify-center gap-6 bg-background px-4 py-16 text-foreground sm:px-8">
      <h1 className="font-sans text-display-xl text-balance">Migeanje Store</h1>
      <p className="max-w-prose text-body text-muted-foreground">
        Estamos preparando la tienda. Muy pronto encontrarás aquí accesorios
        para que tu equipo rinda al máximo.
      </p>
      <p className="font-mono text-body-sm text-muted-foreground">
        v0.1.0 · Lima, Perú
      </p>
    </main>
  );
}
