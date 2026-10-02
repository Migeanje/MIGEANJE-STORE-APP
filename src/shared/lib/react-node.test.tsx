import { createElement, Fragment, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { isEmptyNode } from "./react-node";

describe("isEmptyNode", () => {
  it.each<[string, ReactNode]>([
    ["undefined", undefined],
    ["null", null],
    ["false", false],
    ["true", true],
    ["an empty string", ""],
    ["an empty array", []],
    ["an array of empty values", [null, undefined, false, true, ""]],
    ["nested empty arrays", [[], [null, [false]]]],
    ["an empty fragment", createElement(Fragment)],
    ["a fragment of empty values", createElement(Fragment, null, null, "")],
  ])("treats %s as empty", (_label, node) => {
    expect(isEmptyNode(node)).toBe(true);
  });

  it.each<[string, ReactNode]>([
    ["a string", "Ingresa tu nombre."],
    ["a whitespace string", " "],
    ["the number 0", 0],
    ["an element", <strong key="strong">Obligatorio</strong>],
    ["an array with one value", [null, "Ingresa tu nombre."]],
    [
      "a fragment with text",
      createElement(Fragment, null, "Ingresa tu nombre."),
    ],
  ])("treats %s as content", (_label, node) => {
    expect(isEmptyNode(node)).toBe(false);
  });
});
