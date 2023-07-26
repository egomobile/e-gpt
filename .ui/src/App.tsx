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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Nullable } from '@egomobile/types';

// internal imports
import Chat from './components/Chat';
import Chatbar from './components/Chatbar';
import Promptbar from './components/Promptbar';
import SelectedChatConversationContext from './contexts/SelectedChatConversationContext';
import type { ChatConversationItem, ChatPromptItem, IChatConversation } from './types';

// styles
import './App.css';

const conversationsStorageKey = 'egoChatConversationList';
const promptsStorageKey = 'egoChatPromptList';

const App: React.FC = () => {
  const [conversationItems, setConversationItems] = useState<Nullable<ChatConversationItem[]>>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [promptItems, setPromptItems] = useState<Nullable<ChatPromptItem[]>>(null);
  const [selectedConversation, setSelectedConversation] = useState<Nullable<IChatConversation>>(null);

  const allPrompts = useMemo(() => {
    if (!promptItems) {
      return null;
    }

    return promptItems.map((item) => {
      if ('prompts' in item) {
        return item.prompts ?? [];
      }

      return [item];
    }).flat();
  }, [promptItems]);

  const handleConversationDelete = useCallback((conversationId: string) => {
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null);
    }
  }, [selectedConversation?.id]);

  const handleConversationItemsUpdate = useCallback((newList: ChatConversationItem[]) => {
    if (!Array.isArray(conversationItems)) {
      return;
    }

    try {
      localStorage.setItem(conversationsStorageKey, JSON.stringify(newList));
    } catch (error) {
      console.error('[ERROR]', 'App.handleConversationItemsUpdate', error);
    }

    setConversationItems(newList);
  }, [conversationItems]);

  const handleConversationUpdate = useCallback((conversation: IChatConversation) => {
    //
  }, []);

  const handlePromptItemsUpdate = useCallback((newList: ChatPromptItem[]) => {
    if (!Array.isArray(promptItems)) {
      return;
    }

    try {
      localStorage.setItem(promptsStorageKey, JSON.stringify(newList));
    } catch (error) {
      console.error('[ERROR]', 'App.handlePromptItemsUpdate', error);
    }

    setPromptItems(newList);
  }, [promptItems]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    try {
      const storedConversationItemsStr = window.localStorage.getItem(conversationsStorageKey);

      if (storedConversationItemsStr) {
        const storedConversationItems: ChatConversationItem[] = JSON.parse(storedConversationItemsStr);

        if (Array.isArray(storedConversationItems)) {
          setConversationItems(storedConversationItems);
        }
      }
    } catch (error) {
      console.error('[ERROR]', 'App.useEffect().conversationItems', error);
    }

    try {
      const storedPromptItemsStr = window.localStorage.getItem(promptsStorageKey);

      if (storedPromptItemsStr) {
        const storedPromptItems: ChatPromptItem[] = JSON.parse(storedPromptItemsStr);

        if (Array.isArray(storedPromptItems)) {
          setPromptItems(storedPromptItems);
        }
      }
    } catch (error) {
      console.error('[ERROR]', 'App.useEffect().promptItems', error);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);

  useEffect(() => {
    setIsInitialized(true);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SelectedChatConversationContext.Provider value={selectedConversation}>
      <div
        className={`flex h-screen w-screen flex-col text-sm text-white dark:text-white dark`}
      >
        <div className="flex h-full w-full pt-[48px] sm:pt-0">
          <Chatbar
            items={conversationItems ?? []}
            onConversationClick={setSelectedConversation}
            onConversationDelete={handleConversationDelete}
            onConversationItemsUpdate={handleConversationItemsUpdate}
          />

          <div className="flex flex-1">
            <Chat
              onConversationUpdate={handleConversationUpdate}
              prompts={allPrompts ?? []}
            />
          </div>

          <Promptbar
            items={promptItems ?? []}
            onPromptItemsUpdate={handlePromptItemsUpdate}
          />
        </div>
      </div>
    </SelectedChatConversationContext.Provider>
  );
};

export default App;
