import { Heading } from "@/shared/ui/atoms/heading";
import { Text } from "@/shared/ui/atoms/text";

// Placeholder so the app shell can be reviewed; the real home arrives in M3.
export default function HomePage() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-24 sm:px-8 lg:py-32">
      <Heading level={1} size="display-xl" className="text-balance">
        Migeanje Store
      </Heading>
      <Text tone="muted" className="max-w-prose">
        Accesorios tecnológicos premium, elegidos para que tu equipo rinda al
        máximo. Explora las categorías y encuentra el tuyo.
      </Text>
    </section>
  );
}
