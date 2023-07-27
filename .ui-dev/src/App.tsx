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
import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Nilable, Nullable } from '@egomobile/types';

// internal imports
import Chat from './components/Chat';
import Chatbar from './components/Chatbar';
import Promptbar from './components/Promptbar';
import SelectedChatConversationContext from './contexts/SelectedChatConversationContext';
import type { ChatConversationItem, ChatPromptItem, IChatConversation } from './types';

// styles
import './App.css';

interface ISettings {
  conversationItems: Nilable<ChatConversationItem[]>;
  promptItems: Nilable<ChatPromptItem[]>;
}

const App: React.FC = () => {
  const [conversationItems, setConversationItems] = useState<Nullable<ChatConversationItem[]>>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [promptItems, setPromptItems] = useState<Nullable<ChatPromptItem[]>>(null);
  const [selectedConversation, setSelectedConversation] = useState<Nilable<IChatConversation>>(null);

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

  const reloadSettings = useCallback(async () => {
    let newConversationItems: ChatConversationItem[] = [];
    let newPromptItems: ChatPromptItem[] = [];

    try {
      const {
        data, status
      } = await axios.get<ISettings>('settings');

      if (status === 200) {
        newConversationItems = data.conversationItems!;
        newPromptItems = data.promptItems!;
      }
    } catch (error) {
      console.error('[ERROR]', 'App.reloadSettings', error);
    }

    const settings: ISettings = {
      conversationItems: newConversationItems,
      promptItems: newPromptItems
    };

    return settings;
  }, []);

  const updateSettings = useCallback(async (
    newConversationList: Nilable<ChatConversationItem[]>,
    newPromptList: Nilable<ChatPromptItem[]>
  ) => {
    if (!isInitialized) {
      return;
    }

    if (!newConversationList || !newPromptList) {
      return;
    }

    try {
      const settings: ISettings = {
        conversationItems: newConversationList,
        promptItems: newPromptList
      };

      const {
        status
      } = await axios.put<ISettings>('settings', settings);

      if (status !== 204) {
        throw new Error(`Unexpected response: ${status}`);
      }
    } catch (error) {
      console.error('[ERROR]', 'App.updateSettings', error);
    }
  }, [isInitialized]);

  const handleConversationDelete = useCallback((conversationId: string) => {
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null);
    }
  }, [selectedConversation?.id]);

  const handleConversationItemsUpdate = useCallback((newList: ChatConversationItem[]) => {
    setConversationItems(newList);

    updateSettings(newList, promptItems);
  }, [promptItems, updateSettings]);

  const handleConversationUpdate = useCallback((conversation: IChatConversation) => {
    if (!conversationItems) {
      return;
    }

    const newItems = [...conversationItems];

    const iterateAndUpdate = (list: ChatConversationItem[]) => {
      for (let i = 0; i < list.length; i++) {
        const item = list[i];

        if ('conversations' in item) {
          iterateAndUpdate(item.conversations);
        } else {
          if (item.id === conversation.id) {
            list[i] = conversation;
          }
        }
      }
    };

    iterateAndUpdate(newItems);

    setConversationItems(newItems);
  }, [conversationItems]);

  const handlePromptItemsUpdate = useCallback((newList: ChatPromptItem[]) => {
    setPromptItems(newList);

    updateSettings(conversationItems, newList);
  }, [conversationItems, updateSettings]);

  const handleRefresh = useCallback((newSelectedConversation: Nilable<IChatConversation>) => {
    if (newSelectedConversation) {
      setSelectedConversation(newSelectedConversation);
    } else {
      setSelectedConversation(newSelectedConversation === null ? undefined : null)
    }
  }, []);

  useEffect(() => {
    reloadSettings()
      .then((settings) => {
        setConversationItems(settings.conversationItems!);
        setPromptItems(settings.promptItems!);
      })
      .finally(() => {
        setIsInitialized(true);
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SelectedChatConversationContext.Provider value={selectedConversation ?? null}>
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
              onRefresh={handleRefresh}
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
