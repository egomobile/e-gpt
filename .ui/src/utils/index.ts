// system imports
import { toStringSafe } from "@egomobile/nodelike-utils";
import type { Nilable } from "@egomobile/types";

export interface IToSearchStringOptions {
  noWhitespaces?: boolean;
}

export function toSearchString(val: any, options?: Nilable<IToSearchStringOptions>): string {
  const shouldRemoveWhitespaces = !!options?.noWhitespaces;

  let result = toStringSafe(val)
    .toLowerCase()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replaceAll("\t", "  ")
    .replaceAll("\n", " ")
    .replaceAll("\r", "")
    .split(" ")
    .map((x) => {
      return x.trim();
    })
    .filter((x) => {
      return x !== "";
    })
    .join(" ")
    .trim();

  if (shouldRemoveWhitespaces) {
    // this also has to be 100% browser compatible
    result = result.split(" ")
      .join("")
      .trim();
  }

  return result;
}
