import type { Metadata } from "next";
import Link from "next/link";
import { Heading } from "@/shared/ui/atoms/heading";
import { LedScore } from "@/shared/ui/atoms/led-score";
import { Text } from "@/shared/ui/atoms/text";
import { LegalPage, type LegalSection } from "@/shared/ui/templates/legal-page";
import { LEGAL_PATHS, LEGAL_UPDATED_AT, relatedLinks } from "../_legal/legal";
import { RUBRIC_CRITERIA } from "./rubric-criteria";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Cómo elegimos",
    description:
      "Cómo selecciona Migeanje Store sus productos, cómo leer nuestra opinión y sus puntajes, por qué a veces te decimos que un producto no es para ti y qué significa «En importación».",
  };
}

const SCALE: readonly { score: number; meaning: string }[] = [
  { score: 5, meaning: "Sobresaliente: lo mejor que encontramos en su rango." },
  { score: 4, meaning: "Muy bueno: cumple con creces." },
  { score: 3, meaning: "Cumple: hace lo que promete, sin destacar." },
  { score: 2, meaning: "Con limitaciones: tenlas en cuenta antes de comprar." },
  { score: 1, meaning: "No lo recomendamos para eso." },
];

// DRAFT: the curation claims (official channels, spec checks, real use) are
// the owner's brief; the score meanings are a proposal.
const SECTIONS: LegalSection[] = [
  {
    id: "seleccion",
    title: "Cómo seleccionamos los productos",
    content: (
      <>
        <Text>
          Preferimos pocas opciones bien elegidas a un catálogo infinito. Antes
          de vender un producto:
        </Text>
        <ul>
          <li>
            <strong>Lo compramos por canales oficiales:</strong> distribuidores
            e importadores autorizados o la tienda oficial de la marca. Nada de
            copias ni productos de origen dudoso.
          </li>
          <li>
            <strong>Verificamos sus especificaciones:</strong> comparamos lo que
            dice la publicidad con la información oficial del fabricante. Si un
            cargador «de 160 W» entrega como máximo 140 W por un solo puerto, te
            lo decimos así.
          </li>
          <li>
            <strong>Lo probamos en uso real:</strong> con los celulares, laptops
            y audífonos que usamos todos los días, antes de escribir nuestra
            opinión.
          </li>
          <li>
            <strong>Revisamos cada pedido:</strong> controlamos los productos
            cuando llegan y antes de enviártelos.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "lo-que-no-hacemos",
    title: "Lo que no hacemos",
    content: (
      <ul>
        <li>
          No cobramos por aparecer en la tienda ni por salir primero: no hay
          productos patrocinados ni posiciones pagadas.
        </li>
        <li>
          Las marcas no pagan ni revisan nuestras opiniones ni nuestros
          puntajes.
        </li>
        <li>
          No estamos afiliados a las marcas que vendemos: usamos sus nombres
          solo para describir los productos, sin sus logos.
        </li>
        <li>No inventamos reseñas ni puntajes.</li>
      </ul>
    ),
  },
  {
    id: "nuestra-opinion",
    title: "Cómo leer nuestra opinión",
    content: (
      <>
        <Text>
          Cada producto que reseñamos tiene un veredicto corto, para quién es,
          para quién no es y una evaluación por criterios. Cada criterio tiene
          un puntaje de 1 a 5, que mostramos con luces como las de un cargador,
          y una nota que explica el porqué.
        </Text>
        <Heading level={3} className="text-body font-medium">
          Qué significa cada puntaje
        </Heading>
        <table>
          <caption>Escala de puntajes</caption>
          <thead>
            <tr>
              <th scope="col">Puntaje</th>
              <th scope="col">Qué significa</th>
            </tr>
          </thead>
          <tbody>
            {SCALE.map(({ score, meaning }) => (
              <tr key={score}>
                <th scope="row" className="whitespace-nowrap">
                  <LedScore score={score} />
                </th>
                <td>{meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Heading level={3} className="text-body font-medium">
          Qué evaluamos en cada categoría
        </Heading>
        <Text>
          Los criterios cambian según lo que importa en cada tipo de producto:
        </Text>
        <table>
          <caption>Criterios de evaluación por categoría</caption>
          <thead>
            <tr>
              <th scope="col">Categoría</th>
              <th scope="col">Criterios</th>
            </tr>
          </thead>
          <tbody>
            {RUBRIC_CRITERIA.map(({ category, criteria }) => (
              <tr key={category}>
                <th scope="row">{category}</th>
                <td>{criteria.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    ),
  },
  {
    id: "no-es-para-ti",
    title: "Por qué a veces te decimos que no es para ti",
    content: (
      <>
        <Text>
          Un buen producto puede ser una mala compra para ti. Por eso cada
          opinión dice también para quién no es. Por ejemplo, unos audífonos con
          LDAC suenan mejor en un celular Android compatible, pero el iPhone no
          usa LDAC: si tienes iPhone, te lo advertimos antes de que pagues por
          algo que no vas a aprovechar.
        </Text>
        <Text>
          Preferimos que compres lo correcto a una devolución. Si dudas entre
          dos productos, compáralos lado a lado desde la página de cada
          producto.
        </Text>
      </>
    ),
  },
  {
    id: "en-importacion",
    title: "Qué significa «En importación»",
    content: (
      <>
        <Text>
          Algunos productos no los tenemos en el Perú todo el tiempo. Cuando
          dicen «En importación», los pedimos al proveedor oficial apenas
          confirmamos tu pago y te los traemos. Pagas hoy y te avisamos en cada
          paso.
        </Text>
        <Text>
          El plazo (normalmente de 15 a 20 días hábiles) se muestra en el
          producto, en el carrito y antes de pagar, y ya está incluido en la
          fecha estimada de entrega. Conoce los costos y plazos en{" "}
          <Link href={LEGAL_PATHS.shipping}>Envíos y devoluciones</Link>.
        </Text>
      </>
    ),
  },
];

/** /como-elegimos: our curation method and how to read our reviews. */
export default function HowWeChoosePage() {
  return (
    <LegalPage
      title="Cómo elegimos"
      intro="Vendemos pocos productos y los elegimos con criterio. Así decidimos qué entra a la tienda y qué te recomendamos."
      updatedAt={LEGAL_UPDATED_AT}
      sections={SECTIONS}
      related={relatedLinks("shipping", "warranty", "terms")}
    />
  );
}
