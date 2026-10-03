/**
 * Freezes a plain data tree (objects and arrays) in place and returns it.
 * Adapters freeze what they share across requests, so a caller that mutates a
 * returned value gets a TypeError (modules run in strict mode) instead of
 * silently changing what every later request sees.
 */
export function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const key of Reflect.ownKeys(value)) {
    deepFreeze((value as Record<PropertyKey, unknown>)[key]);
  }
  return value;
}
