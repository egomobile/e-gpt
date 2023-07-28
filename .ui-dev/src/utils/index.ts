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
import _ from 'lodash';
import UAParser from 'ua-parser-js';
import { toStringSafe } from "@egomobile/nodelike-utils";
import type { Nilable } from "@egomobile/types";

// internal imports
import type { IChatPrompt, IVariable } from '../types';

export type LoadBlobFormat = 'arraybuffer' | 'dataurl' | 'text';

export type LoadBlobResult = ArrayBuffer | string;

export interface IToSearchStringOptions {
  noWhitespaces?: Nilable<boolean>;
}

export async function downloadBlob(blob: Blob, name?: Nilable<string>) {
  const dataUrl = await loadBlob(blob, 'dataurl');

  const a = document.createElement('a');
  a.setAttribute('download', name || (blob as File).name);
  a.setAttribute('href', dataUrl);
  a.click();

  setTimeout(() => {
    a.remove();
  }, 2000);
}

export function filterChatPrompts(prompts: IChatPrompt[], searchTerm: any): IChatPrompt[] {
  const parts = _(toSearchString(searchTerm).split(' '))
    .map((p) => {
      return p.trim();
    })
    .filter((p) => {
      return p !== '';
    })
    .uniq()
    .value();

  if (!parts.length) {
    return [...prompts];
  }

  return prompts.filter((pr) => {
    const title = toSearchString(pr.title);

    return parts.every((p) => {
      return title.includes(p);
    });
  });
}

export function generateRandomString(length: number, lowercase = false) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXY3456789'; // excluding similar looking characters like Z, 2, I, 1, O, 0
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return lowercase ? result.toLowerCase() : result;
}

export function getVariableRegex() {
  return /{{([^:}]*)(:?)([^}]*)}}/g;
}

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

export function loadBlob(blob: Blob): Promise<ArrayBuffer>;
export function loadBlob(
  blob: Blob,
  format: 'arraybuffer',
): Promise<ArrayBuffer>;
export function loadBlob(blob: Blob, format: 'dataurl'): Promise<string>;
export function loadBlob(blob: Blob, format: 'text'): Promise<string>;
export function loadBlob(
  blob: Blob,
  format: LoadBlobFormat = 'arraybuffer',
): Promise<LoadBlobResult> {
  return new Promise<LoadBlobResult>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (ex) => {
      reject(ex);
    };
    reader.onload = async (e) => {
      resolve(e.target?.result as LoadBlobResult);
    };

    if (format === 'arraybuffer') {
      reader.readAsArrayBuffer(blob);
    } else if (format === 'dataurl') {
      reader.readAsDataURL(blob);
    } else if (format === 'text') {
      reader.readAsText(blob);
    } else {
      reject(new Error(`Format ${format} not supported`));
    }
  });
}

export function parseVariables(content: any) {
  const regex = getVariableRegex();
  const foundVariables: IVariable[] = [];

  let match;

  while ((match = regex.exec(toStringSafe(content))) !== null) {
    const name = match[1]?.trim() || '';
    if (!name) {
      continue;
    }

    const description = match[3]?.trim() || '';

    foundVariables.push({
      name,
      description
    });
  }

  return foundVariables;
}

export function sortProps<T = any>(val: T): T {
  if (!val) {
    return val as unknown as T;
  }

  if (typeof val !== 'object') {
    return val as unknown as T;
  }

  if (Array.isArray(val)) {
    return val.map(sortProps) as unknown as T;
  }

  const result: Partial<T> = {};

  const sortedProps = Object.keys(val).sort() as (keyof T)[];
  for (const prop of sortedProps) {
    result[prop] = val[prop];
  }

  return result as unknown as T;
}

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
