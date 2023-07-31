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
import type { Nilable } from "@egomobile/types";

/**
 * Represents an item in a chat conversation.
 */
export type ChatConversationItem =
  IChatConversationFolder |
  IChatConversation;

/**
 * Represents an item in a chat prompt.
 */
export type ChatPromptItem =
  IChatPromptFolder |
  IChatPrompt;

/**
 * Represents a chat role, which can be either an assistant or a user.
 */
export type ChatRole = 'assistant' | 'user';

/**
 * Represents the type of a folder, which can be either chat or prompt.
 */
export type FolderType = 'chat' | 'prompt';

/**
 * API key settings from backend.
 */
export interface IApiKeySettings {
  /** The access type to the chat API. */
  accessType: '' | 'openai_key' | 'proxy_api_key' | 'proxy_oauth2';
  /** The error message, if occurred. */
  error: string;
}

/**
 * Represents a chat conversation.
 */
export interface IChatConversation {
  /** The ID of the folder that the conversation belongs to. */
  folderId: string;
  /** The ID of the conversation. */
  id: string;
  /** The messages in the conversation. */
  messages: IChatMessage[];
  /** The model of the conversation. */
  model: IChatConversationModel;
  /** The system prompt of the conversation. */
  systemPrompt: string;
  /** The temperature of the conversation. */
  temperature: number;
  /** The title of the conversation. */
  title: string;
}

/**
 * Represents a chat conversation model.
 */
export interface IChatConversationModel {
  /** The maximum length of the conversation. */
  maxLength: number;
  /** The name of the model. */
  name: string;
  /** The token limit of the underlying conversation. */
  tokenLimit: number;
}

/**
 * Represents a folder that contains chat conversations.
 */
export interface IChatConversationFolder extends IFolder {
  /** The conversations in the folder. */
  conversations: IChatConversation[];
  /** The type of the folder, which is chat. */
  type: 'chat';
}

/**
 * Represents a message in a chat conversation.
 */
export interface IChatMessage {
  /** The content of the message. */
  content: string;
  /** Whether the message is an error. */
  isError?: boolean;
  /** The role of the message. */
  role: ChatRole;
  /** The time when the message was sent. */
  time: string;
}

/**
 * Represents a folder that contains chat prompts.
 */
export interface IChatPromptFolder extends IFolder {
  /** The prompts in the folder. */
  prompts: IChatPrompt[];
  /** The type of the folder, which is prompt. */
  type: 'prompt';
}

/**
 * Represents a chat prompt.
 */
export interface IChatPrompt {
  /** The content of the prompt. */
  content: string;
  /** The description of the prompt. */
  description: string;
  /** The ID of the folder that the prompt belongs to. */
  folderId: string;
  /** The ID of the prompt. */
  id: string;
  /** The title of the prompt. */
  title: string;
}

/**
 * Represents a folder.
 */
export interface IFolder {
  /** The ID of the folder. */
  id: string;
  /** The title of the folder. */
  title: string;
  /** The type of the folder. */
  type: FolderType;
}

/**
 * Represents the settings of the chat.
 */
export interface ISettings {
  /** The conversation items of the chat. */
  conversationItems: Nilable<ChatConversationItem[]>;
  /** The prompt items of the chat. */
  promptItems: Nilable<ChatPromptItem[]>;
}

/**
 * Represents a variable.
 */
export interface IVariable {
  /** The description of the variable. */
  description: string;
  /** The name of the variable. */
  name: string;
  /** The type of the variable. */
  type: VariableInputType;
}

/**
 * Represents the input type of a variable.
 */
export enum VariableInputType {
  /** A list. */
  List = 'list',
  /** A text. */
  Text = 'text'
}
