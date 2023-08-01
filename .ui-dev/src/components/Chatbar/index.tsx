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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Nullable } from '@egomobile/types';
import { v4 } from 'uuid';

// internal imports
import ChatFolders from '../ChatFolders';
import Conversations from '../Conversations';
import Settings from './components/Settings';
import Sidebar from '../Sidebar';
import { ChatConversationItem, IChatConversation, IChatConversationFolder, ISettings } from '../../types';
import { toSearchString } from '../../utils';
import { defaultTemperature } from '../../constants';

interface IChatbarProps {
  items: ChatConversationItem[];
  onConversationClick: (conversation: IChatConversation) => void;
  onConversationDelete: (conversationId: string) => void;
  onConversationItemsUpdate: (items: ChatConversationItem[]) => void;
  onSettingsUpdate: (newData: ISettings) => void;
}

const Chatbar: React.FC<IChatbarProps> = ({
  items,
  onConversationClick,
  onConversationDelete,
  onConversationItemsUpdate,
  onSettingsUpdate
}) => {
  const [currentFolder, setCurrentFolder] = useState<Nullable<IChatConversationFolder>>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [nextNewConversationIndex, setNextNewConversationIndex] = useState(0);
  const [nextNewFolderIndex, setNextNewFolderIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const folders = useMemo(() => {
    return items.filter((item) => {
      return 'conversations' in item;
    }) as IChatConversationFolder[];
  }, [items]);

  const conversations = useMemo(() => {
    return items.filter((item) => {
      return !('conversations' in item) && !item.folderId;
    }) as IChatConversation[];
  }, [items]);

  const filteredConversations = useMemo(() => {
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
      return [...conversations];
    }

    return conversations.filter((c) => {
      const title = toSearchString(c.title);

      return parts.every((p) => {
        return title.includes(p);
      });
    });
  }, [conversations, searchTerm]);

  const handleItemsUpdate = useCallback((newList: ChatConversationItem[]) => {
    onConversationItemsUpdate(newList);
  }, [onConversationItemsUpdate]);

  const handleCreateFolder = useCallback(() => {
    const newNextFolderIndex = nextNewFolderIndex + 1;

    const newFolder: IChatConversationFolder = {
      conversations: [],
      id: `ccf:${Date.now()}-${v4()}`,
      title: `New Folder #${newNextFolderIndex}`,
      type: 'chat',
    };

    handleItemsUpdate([...items, newFolder]);
    setNextNewFolderIndex(newNextFolderIndex);
  }, [handleItemsUpdate, items, nextNewFolderIndex]);

  const handleToggleChatbar = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const handleCreateItem = useCallback(() => {
    const newNextNewConversationIndex = nextNewConversationIndex + 1;

    const newConversation: IChatConversation = {
      folderId: currentFolder?.id || '',
      id: `cc:${Date.now()}-${v4()}`,
      title: `New Conversation #${newNextNewConversationIndex}`,
      messages: [],
      model: {
        maxLength: 12000,
        name: 'GPT-3.5',
        tokenLimit: 4000
      },
      systemPrompt: '',
      temperature: defaultTemperature
    };

    const list = [...items];

    if (currentFolder) {
      [...list].forEach((item, itemIndex) => {
        if ('conversations' in item && item.id === currentFolder.id) {
          list[itemIndex] = {
            ...item,

            conversations: [...currentFolder.conversations, newConversation]
          };
        }
      });
    } else {
      list.push(newConversation);
    }

    handleItemsUpdate(list);
    setNextNewConversationIndex(newNextNewConversationIndex);
  }, [currentFolder, handleItemsUpdate, items, nextNewConversationIndex]);

  const handleSearchTerm = useCallback((newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
  }, []);

  const handleDeleteConversation = useCallback((conversation: IChatConversation, triggerUpdateEvents: boolean) => {
    const newItemList = items.filter((item) => {
      if (!('conversations' in item)) {
        return item.id !== conversation.id;
      }

      return true;
    });

    if (triggerUpdateEvents) {
      handleItemsUpdate(newItemList);

      onConversationDelete(conversation.id);
    }
  }, [handleItemsUpdate, items, onConversationDelete]);

  const handleUpdateConversation = useCallback((newData: IChatConversation) => {
    let folder = folders.find((f) => {
      return f.id === newData.folderId;
    });

    const newList = [...items];
    if (folder) {
      folder = {
        ...folder,

        conversations: [...folder.conversations]
      };

      [...newList].forEach((item, itemIndex) => {
        if ('conversations' in item && item.id === folder!.id) {
          newList[itemIndex] = folder!;
        }
      });
    }

    const list = folder ? folder.conversations : newList;
    [...list].forEach((item, itemIndex) => {
      if (!('conversations' in item) && item.id === newData.id) {
        list[itemIndex] = newData;
      }
    });

    handleItemsUpdate(newList);
  }, [folders, handleItemsUpdate, items]);

  const handleDeleteFolder = useCallback((folder: IChatConversationFolder) => {
    const newItemList = items.filter((item) => {
      if ('conversations' in item) {
        return item.id !== folder.id;
      }

      return item.folderId !== folder.id;
    });

    folder.conversations.forEach((c) => {
      handleDeleteConversation(c, false);
    });

    setCurrentFolder(null);
    handleItemsUpdate([...newItemList]);
  }, [handleDeleteConversation, handleItemsUpdate, items]);

  const handleUpdateFolderTitle = useCallback((folder: IChatConversationFolder, newTitle: string) => {
    newTitle = newTitle.trim();
    if (!newTitle) {
      return;
    }

    const newItemList = [...items];

    [...newItemList].forEach((item, itemIndex) => {
      if ('conversations' in item && item.id === folder.id) {
        newItemList[itemIndex] = {
          ...item,

          title: newTitle
        };
      }
    });

    handleItemsUpdate(newItemList);
  }, [handleItemsUpdate, items]);

  useEffect(() => {
    onConversationItemsUpdate(items);
  }, [items, onConversationItemsUpdate]);

  return (
    <>
      <Sidebar
        side={'left'}
        isOpen={isOpen}
        addItemButtonTitle={'New chat'}
        itemComponent={(
          <Conversations
            conversations={filteredConversations}
            onClick={onConversationClick}
            onDelete={(c) => handleDeleteConversation(c, true)}
            onUpdate={handleUpdateConversation}
          />
        )}
        folderComponent={
          <ChatFolders
            folders={folders}
            searchTerm={searchTerm}
            onConversationClick={(c) => {
              setCurrentFolder(null);

              onConversationClick(c);
            }}
            onDeleteConversation={(c) => handleDeleteConversation(c, true)}
            onDeleteFolder={handleDeleteFolder} onUpdateFolderTitle={handleUpdateFolderTitle}
            onFolderClick={(folder, isOpen) => {
              if (isOpen) {
                setCurrentFolder(folder);
              } else {
                setCurrentFolder(null);
              }
            }}
            onFolderOpenUpate={(folder, isOpen) => { }}
            onUpdateConversation={(folder, newData) => {
              handleUpdateConversation(newData);
            }}
          />}
        items={items}
        searchTerm={searchTerm}
        handleSearchTerm={handleSearchTerm}
        toggleOpen={handleToggleChatbar}
        handleCreateItem={handleCreateItem}
        handleCreateFolder={handleCreateFolder}
        footerComponent={<Settings onSettingsUpdate={onSettingsUpdate} />}
      />
    </>
  );
};

export default Chatbar;
