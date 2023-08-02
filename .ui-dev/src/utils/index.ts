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
import striptags from 'striptags';
import UAParser from 'ua-parser-js';
import { toStringSafe } from "@egomobile/nodelike-utils";
import type { Nilable, Optional } from "@egomobile/types";
import { parse as parseHtml } from 'node-html-parser';

// internal imports
import { ChatConversationItem, IChatConversation, IChatPrompt, IFolder, IVariable, VariableInputType } from '../types';

/**
 * An action for a list iteration for an item.
 * 
 * @param {T} item The current item.
 * @param {number} index The zero-based index.
 * @param {T[]} orgArr The original input array.
 */
export type ForEachAction<T = any> = (item: T, index: number, orgArr: T[]) => any;

/**
 * Options for `parseFinalContentWithVariables()` function.
 */
export interface IParseFinalContentWithVariablesOptions {
  /**
   * The unparsed content.
   */
  content: Nilable<string>;
  /**
   * The list of variable values.
   */
  values: string[];
  /**
   * The variable definitions.
   */
  variables: IVariable[];
}

/**
 * Options for `toSearchString()` function.
 */
export interface IToSearchStringOptions {
  /**
   * Remove all whitespaces or not.
   * 
   * @default `false`
   */
  noWhitespaces?: Nilable<boolean>;
}

/**
 * A possible list of formats for `loadBlob()` function.
 */
export type LoadBlobFormat = 'arraybuffer' | 'dataurl' | 'text';

/**
 * A possible list of result types for `loadBlob()` function.
 */
export type LoadBlobResult = ArrayBuffer | string;

const randomChars = 'ABCDEFGHJKLMNPQRSTUVWXY3456789'; // excluding similar looking characters like Z, 2, I, 1, O, 0

/**
 * Downloads a Blob as a file with an optional name.
 *
 * @param {Blob} blob The Blob object to download
 * @param {Nilable<string>} [name] Optional name for the downloaded file. If not provided, the name of the Blob will be used if it is a File object.
 *
 * @returns {Promise<void>} Promise that resolves when the file has been downloaded.
 */
export async function downloadBlob(blob: Blob, name?: Nilable<string>): Promise<void> {
  const dataUrl = await loadBlob(blob, 'dataurl');

  const a = document.createElement('a');
  a.setAttribute('download', name || (blob as File).name);
  a.setAttribute('href', dataUrl);
  a.click();

  setTimeout(() => {
    a.remove();
  }, 2000);
}

/**
 * Filters an array of chat prompts based on a search term.
 *
 * @param {IChatPrompt[]} prompts The array of chat prompts to filter.
 * @param {any} searchTerm The search term to filter with.
 *
 * @returns {IChatPrompt[]} The filtered array of chat prompts.
 */
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

/**
 * Creates a copy of an array and iterates over it.
 *
 * @param {T[]} arr The original input array.
 * @param {ForEachAction<T>} action The action to invoke.
 */
export function forEachOfCopy<T>(arr: T[], action: ForEachAction<T>): void {
  [...arr].forEach((item, index) => {
    action(item, index, arr);
  });
}

/**
 * Generates a random string of a given length.
 *
 * @param {number} length The length of the random string to generate.
 * @param {boolean} [lowercase=false] - Whether or not to return the random string in lowercase.
 *
 * @returns {string} The generated random string.
 */
export function generateRandomString(length: number, lowercase: boolean = false): string {
  let result = '';

  for (let i = 0; i < length; i++) {
    result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }

  return lowercase ? result.toLowerCase() : result;
}

/**
 * Returns the sort value for two `IChatConversation` items.
 *
 * @param {IChatConversation} x The "left" item.
 * @param {IChatConversation} y The "right" item.
 *
 * @returns {number} The sort value.
 */
export function getSortValueForConversations(x: IChatConversation, y: IChatConversation): number {
  return toSearchString(x.title).localeCompare(
    toSearchString(y.title)
  );
}

/**
 * Returns the sort value for two `IFolder` items.
 *
 * @param {IFolder} x The "left" item.
 * @param {IFolder} y The "right" item.
 *
 * @returns {number} The sort value.
 */
export function getSortValueForFolders(x: IFolder, y: IFolder): number {
  return toSearchString(x.title).localeCompare(
    toSearchString(y.title)
  );
}

/**
 * Returns the sort value for two `IChatPrompt` items.
 *
 * @param {IChatPrompt} x The "left" item.
 * @param {IChatPrompt} y The "right" item.
 *
 * @returns {number} The sort value.
 */
export function getSortValueForPrompts(x: IChatPrompt, y: IChatPrompt): number {
  return toSearchString(x.title).localeCompare(
    toSearchString(y.title)
  );
}

/**
 * Returns a regular expression to match variables in a string template.
 *
 * @returns {RegExp} A regular expression to match variables in a string template.
 */
export function getVariableRegex(): RegExp {
  return /{{([^|}]*)(\|?)([^}]*)}}/g;
}

/**
 * Checks if the current device is a mobile device.
 *
 * @returns {boolean} `return` if the current device is a mobile device, otherwise returns false.
 */
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

/**
 * Loads a Blob and returns the result in the specified format.
 *
 * @param {Blob} blob The Blob to load.
 * @param {LoadBlobFormat} [format='arraybuffer'] The format in which to return the result.
 *
 * @returns {Promise<LoadBlobResult>} A Promise that resolves with the result in the specified format.
 */
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

/**
 * Parses final content, which may include variables.
 * 
 * @param {IParseFinalContentWithVariablesOptions} options The options.
 *
 * @returns {Optional<string>} The parsed content.
 */
export async function parseFinalContentWithVariables(options: IParseFinalContentWithVariablesOptions): Promise<Optional<string>> {
  const {
    content,
    values,
    variables
  } = options;

  return content?.replace(getVariableRegex(), (match, variable) => {
    const index = variables.findIndex((v) => {
      let variableName = variable as string;

      const sepIdx = variableName.indexOf(':');
      if (sepIdx > -1) {
        variableName = variableName.substring(0, sepIdx);
      }

      return v.name.trim() === variableName.trim();
    });

    return values[index];
  });
}

/**
 * Handles an input as string and pre-parses variables.
 *
 * @param {any} content The input data.
 *
 * @returns {IVariable[]} The list of variables.
 */
export function parseVariables(content: any): IVariable[] {
  const regex = getVariableRegex();
  const foundVariables: IVariable[] = [];

  const str = toStringSafe(content);

  let match;
  while ((match = regex.exec(str)) !== null) {
    const nameAndType = match[1]?.trim() || '';
    if (!nameAndType) {
      continue;
    }

    let name = nameAndType;
    const description = match[3]?.trim() || '';
    let type = '';

    const nameTypeSepIdx = nameAndType.indexOf(':');
    if (nameTypeSepIdx > -1) {
      name = nameAndType.substring(0, nameTypeSepIdx).trim();
      type = nameAndType.substring(nameTypeSepIdx + 1).toLowerCase().trim();
    }

    if (!name) {
      continue;
    }

    if (!Object.values(VariableInputType).includes(type as any)) {
      type = VariableInputType.Text;
    }

    foundVariables.push({
      name,
      description,
      type: type as VariableInputType
    });
  }

  return foundVariables;
}

/**
 * Replaces an `IChatConversation` in an list of `ChatConversationItem` items.
 * @param {Nilable<ChatConversationItem[]>} items The input list.
 * @param {IChatConversation} conversation The current item.
 *
 * @returns {Nilable<ChatConversationItem[]>} The copy of `items` with the new, original element from `conversation`.
 */
export function replaceNewConversationInList(
  items: Nilable<ChatConversationItem[]>,
  conversation: IChatConversation
): Nilable<ChatConversationItem[]> {
  if (!items) {
    return items;
  }

  const replaceWithItemIn = (list: ChatConversationItem[]) => {
    forEachOfCopy(list, (item, index, orgArr) => {
      if (!('conversations' in item) && item.id === conversation.id) {
        orgArr[index] = conversation;
      }
    });
  };

  const cloneOfItems = [...items.map(_.cloneDeep)];

  if (conversation.folderId) {
    forEachOfCopy(cloneOfItems, (item, index, orgArr) => {
      if ('conversations' in item && item.id === conversation.folderId) {
        const clonedItem = _.cloneDeep(item);
        replaceWithItemIn(clonedItem.conversations);

        orgArr[index] = clonedItem;
      }
    });
  } else {
    replaceWithItemIn(cloneOfItems);
  }

  return JSON.parse(
    JSON.stringify(cloneOfItems)
  );
}

/**
 * Creates a deep copy of a value with sorted properties.
 *
 * @param {T} val The input value.
 *
 * @returns {T} The copy.
 */
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
    result[prop] = sortProps(val[prop]);
  }

  return result as unknown as T;
}

/**
 * Throttles a given function so that it can only be called once within a given time limit.
 *
 * @param {T} func The function to be throttled.
 * @param {number} limit The time limit in milliseconds.
 *
 * @returns {T} The throttled function.
 */
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

/**
 * Creates a string from any kinf of value, that can be used for search and filter operations.
 * The final strings will usually contain lowercase chars only.
 * 
 * @param {any} val The input value to convert.
 * @param {Nilable<IToSearchStringOptions>} [options| Additional and custom options.
 * 
 * @returns {string} The final string.
 */
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
    result = result.replaceAll(" ", "")
      .trim();
  }

  return result;
}

/**
 * Handles an input value as HTML string an tries to return the non-HTML content part.
 *
 * @param {any} val The input value, handled as HTML.
 * 
 * @returns {string} The extracted content without HTML tags.
 */
export function tryGetHtmlContent(val: any): string {
  let html = toStringSafe(val);

  try {
    const root = parseHtml(val);

    const body = root.querySelector('body');
    if (body) {
      html = body.innerHTML;
    }
  } catch {
    // ignore
  }

  let result = striptags(
    toStringSafe(html)
  );
  result = result.replaceAll("\t", "  ")
    .replaceAll("\n", " ")
    .replaceAll("\r", "");

  while (result.includes("  ")) {
    result = result.replaceAll("  ", " ");
  }

  return result.trim();
}
