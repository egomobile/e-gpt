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
import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Nilable, Nullable } from '@egomobile/types';

// internal imports
import AppContext from './contexts/AppContext';
import Chat from './components/Chat';
import Chatbar from './components/Chatbar';
import Promptbar from './components/Promptbar';
import type { ChatConversationItem, ChatPromptItem, IApiKeySettings, IAppContext, IChatConversation, ISettings } from './types';

// styles
import './App.css';

const App: React.FC = () => {
  const [apiKeySettings, setApiKeySettings] = useState<Nullable<IApiKeySettings>>(null);
  const [currentSettings, setCurrentSettings] = useState<ISettings>({
    conversationItems: null,
    promptItems: null
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Nilable<IChatConversation>>(null);

  const {
    conversationItems,
    promptItems
  } = useMemo(() => {
    return {
      conversationItems: currentSettings.conversationItems,
      promptItems: currentSettings.promptItems,
    };
  }, [currentSettings.conversationItems, currentSettings.promptItems]);

  const appContext: IAppContext = useMemo(() => {
    return {
      apiKeySettings: apiKeySettings || null,
      selectedConversation: selectedConversation || null,
      settings: currentSettings || null
    };
  }, [apiKeySettings, currentSettings, selectedConversation]);

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

  const reloadApiKeySettings = useCallback(async () => {
    setApiKeySettings(null);

    try {
      const {
        data, status
      } = await axios.get<IApiKeySettings>('settings/keys/current');

      if (status !== 200) {
        throw new Error(`Unexpected response: ${status}`);
      }

      setApiKeySettings(data);
    } catch (error: any) {
      setApiKeySettings({
        accessType: '',
        error: `${error}`
      });
    }
  }, []);

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

    const newSettings: ISettings = {
      conversationItems: newConversationList,
      promptItems: newPromptList
    };

    if (_.isEqual(currentSettings, newSettings)) {
      return;
    }

    try {
      const {
        status
      } = await axios.put<ISettings>('settings', newSettings);

      if (status !== 204) {
        throw new Error(`Unexpected response: ${status}`);
      }

      setCurrentSettings(newSettings);
    } catch (error) {
      console.error('[ERROR]', 'App.updateSettings', error);
    }
  }, [currentSettings, isInitialized]);

  const handleConversationDelete = useCallback((conversationId: string) => {
    if (!conversationItems) {
      return;
    }

    let newList = [...conversationItems];

    newList = newList.filter((item) => {
      return item.id !== conversationId;
    });
    newList.forEach((item) => {
      if ('conversations' in item) {
        item.conversations = item.conversations.filter((item) => {
          return item.id !== conversationId;
        });
      }
    });

    updateSettings(newList, promptItems);

    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null);
    }
  }, [conversationItems, promptItems, selectedConversation?.id, updateSettings]);

  const handleConversationItemsUpdate = useCallback((newList: ChatConversationItem[]) => {
    updateSettings(newList, promptItems);
  }, [promptItems, updateSettings]);

  const handleRefresh = useCallback((newSelectedConversation: Nilable<IChatConversation>) => {
    if (newSelectedConversation) {
      setSelectedConversation(newSelectedConversation);
    } else {
      setSelectedConversation(newSelectedConversation === null ? undefined : null)
    }
  }, []);

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

    updateSettings(newItems, promptItems);

    if (selectedConversation?.id === conversation.id) {
      setSelectedConversation({
        ...conversation
      });
    }
  }, [conversationItems, promptItems, selectedConversation?.id, updateSettings]);

  const handlePromptDelete = useCallback((promptId: string) => {
    if (!promptItems) {
      return;
    }

    let newList = [...promptItems];

    newList = newList.filter((item) => {
      return item.id !== promptId;
    });
    newList.forEach((item) => {
      if ('prompts' in item) {
        item.prompts = item.prompts.filter((item) => {
          return item.id !== promptId;
        });
      }
    });

    updateSettings(conversationItems, newList);
  }, [conversationItems, promptItems, updateSettings]);

  const handlePromptItemsUpdate = useCallback((newList: ChatPromptItem[]) => {
    updateSettings(conversationItems, newList);
  }, [conversationItems, updateSettings]);

  const handleSettingsUpdate = useCallback((newData: ISettings) => {
    setCurrentSettings(newData);
  }, []);

  useEffect(() => {
    reloadSettings()
      .then((settings) => {
        setCurrentSettings(settings);
      })
      .finally(() => {
        setIsInitialized(true);
      });

    reloadApiKeySettings();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppContext.Provider value={appContext}>
      <div
        className={`flex h-screen w-screen flex-col text-sm text-white dark:text-white dark`}
      >
        <div className="flex h-full w-full pt-[48px] sm:pt-0">
          <Chatbar
            items={conversationItems ?? []}
            onConversationClick={setSelectedConversation}
            onConversationDelete={handleConversationDelete}
            onConversationItemsUpdate={handleConversationItemsUpdate}
            onSettingsUpdate={handleSettingsUpdate}
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
            onPromptDelete={handlePromptDelete}
            onPromptItemsUpdate={handlePromptItemsUpdate}
          />
        </div>
      </div>
    </AppContext.Provider>
  );
};

export default App;
