import type { UbigeoDirectory } from "@/modules/checkout/application/ports";
import {
  type UbigeoTree,
  ubigeoTreeSchema,
} from "@/modules/checkout/domain/ubigeo";
import { deepFreeze } from "@/shared/lib/deep-freeze";
import { UBIGEO_FIXTURE } from "./fixtures/ubigeo";

let tree: UbigeoTree | undefined;

/**
 * UbigeoDirectory over the mock subset (see fixtures/ubigeo.ts). The fixture
 * is parsed with the domain schema on first use (a bad code fails loudly) and
 * shared deeply frozen.
 */
export function createMockUbigeoDirectory(): UbigeoDirectory {
  return {
    async tree() {
      tree ??= deepFreeze(ubigeoTreeSchema.parse(UBIGEO_FIXTURE));
      return tree;
    },
  };
}
