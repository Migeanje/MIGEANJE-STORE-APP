import { Fragment, isValidElement, type ReactNode } from "react";

/**
 * True when `node` renders nothing visible: undefined, null, booleans, "",
 * and arrays or fragments made only of those. Use it to decide whether an
 * optional slot (an error message, a hint) exists before wiring ARIA to it.
 * Numbers (even 0), elements and non-array iterables count as content.
 */
export function isEmptyNode(node: ReactNode): boolean {
  if (node === undefined || node === null || typeof node === "boolean") {
    return true;
  }
  if (typeof node === "string") return node === "";
  if (Array.isArray(node)) return node.every(isEmptyNode);
  if (isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment) {
    return isEmptyNode(node.props.children);
  }
  return false;
}
