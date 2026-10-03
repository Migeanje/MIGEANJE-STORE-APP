import type { Catalog } from "@/modules/catalog/domain/catalog";
import { apple } from "./apple";
import { audio } from "./audio";
import { BRANDS } from "./brands";
import { cables } from "./cables";
import { CATEGORIES } from "./categories";
import { chargers } from "./chargers";
import { hubsAndDocks } from "./hubs-and-docks";
import { powerBanks } from "./power-banks";
import { storage } from "./storage";
import { wirelessCharging } from "./wireless-charging";

/**
 * The 19 owner-approved products (Engram `product/mock-catalog`), in
 * "featured" order. Unvalidated input: `catalog.mock.ts` parses it with
 * `catalogSchema` before anything reads it.
 */
export const catalogFixtures: Catalog = {
  categories: Object.values(CATEGORIES),
  brands: Object.values(BRANDS),
  products: [
    ...chargers,
    ...powerBanks,
    ...cables,
    ...hubsAndDocks,
    ...wirelessCharging,
    ...audio,
    ...storage,
    ...apple,
  ],
};
