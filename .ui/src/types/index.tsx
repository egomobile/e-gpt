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

export type ChatConversationItem =
  IChatConversationFolder |
  IChatConversation;

export type ChatPromptItem =
  IChatPromptFolder |
  IChatPrompt;

export type ChatRole = 'assistant' | 'user';

export type FolderType = 'chat' | 'prompt';

export interface IChatConversation {
  folderId: string;
  id: string;
  messages: IChatMessage[];
  title: string;
}

export interface IChatConversationFolder extends IFolder {
  conversations: IChatConversation[];
  type: 'chat';
}

export interface IChatMessage {
  content: string;
  role: ChatRole;
}

export interface IChatPromptFolder extends IFolder {
  prompts: IChatPrompt[];
  type: 'prompt';
}

export interface IChatPrompt {
  content: string;
  description: string;
  folderId: string;
  id: string;
  title: string;
}

export interface IFolder {
  id: string;
  title: string;
  type: FolderType;
}
