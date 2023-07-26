// This file is part of the e.GPT distribution.
// Copyright (c) Next.e.GO Mobile SE, Aachen, Germany (https://e-go-mobile.com/)
//
// e-gpt is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as
// published by the Free Software Foundation, version 3.
//
// e-gpt is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
// Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

// system imports
import UAParser from 'ua-parser-js';
import { toStringSafe } from "@egomobile/nodelike-utils";
import type { Nilable } from "@egomobile/types";

export interface IToSearchStringOptions {
  noWhitespaces?: boolean;
}

export const generateRandomString = (length: number, lowercase = false) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXY3456789'; // excluding similar looking characters like Z, 2, I, 1, O, 0
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return lowercase ? result.toLowerCase() : result;
};

export function isMobile(): boolean {
  try {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator?.userAgent?.trim();

      if (userAgent) {
        const parser = new UAParser(userAgent);

        return parser.getResult().device.type === 'mobile';
      }
    }
  } catch {
    /** ignore */
  }

  return false;
}

export function parseVariables(content: any) {
  const regex = /{{(.*?)}}/g;
  const foundVariables = [];

  let match;

  while ((match = regex.exec(toStringSafe(content))) !== null) {
    foundVariables.push(match[1]);
  }

  return foundVariables;
};

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): T {
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number;

  return ((...args) => {
    if (!lastRan) {
      func(...args);

      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);

      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func(...args);

          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  }) as T;
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
