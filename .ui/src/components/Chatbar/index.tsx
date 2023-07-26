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
import React, { useCallback, useMemo, useState } from 'react';
import { v4 } from 'uuid';

// internal imports
import ChatFolders from '../ChatFolders';
import Conversations from '../Conversations';
import Sidebar from '../Sidebar';
import { ChatConversationItem, IChatConversation, IChatConversationFolder } from '../../types';
import { toSearchString } from '../../utils';

const Chatbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [items, setItems] = useState<ChatConversationItem[]>([]);
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

  const handleDrop = useCallback((e: any) => {
    console.log('Chatbar.handleDrop');
  }, []);

  const handleCreateFolder = useCallback(() => {
    const newNextFolderIndex = nextNewFolderIndex + 1;

    const newFolder: IChatConversationFolder = {
      conversations: [],
      id: `${Date.now()}-${v4()}`,
      title: `New Folder #${newNextFolderIndex}`,
      type: 'chat',
    };

    setItems([...items, newFolder]);
    setNextNewFolderIndex(newNextFolderIndex);
  }, [items, nextNewFolderIndex]);

  const handleToggleChatbar = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const handleCreateItem = useCallback(() => {
    const newNextNewConversationIndex = nextNewConversationIndex + 1;

    const newConversation: IChatConversation = {
      folderId: '',
      id: `${Date.now()}-${v4()}`,
      title: `New Conversation #${newNextNewConversationIndex}`,
      messages: []
    };

    setItems([...items, newConversation]);
    setNextNewConversationIndex(newNextNewConversationIndex);
  }, [items, nextNewConversationIndex]);

  const handleSearchTerm = useCallback((newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
  }, []);

  const handleDeleteConversation = useCallback((conversation: IChatConversation) => {
    const newItemList = items.filter((item) => {
      if (!('conversations' in item)) {
        return item.id !== conversation.id;
      }

      return true;
    });

    setItems(newItemList);
  }, [items]);

  const handleDeleteFolder = useCallback((folder: IChatConversationFolder) => {
    const newItemList = items.filter((item) => {
      if ('conversations' in item) {
        return item.id !== folder.id;
      }

      return item.folderId !== folder.id;
    });

    setItems([...newItemList]);
  }, [items]);

  const handleUpdateFolderTitle = useCallback((folder: IChatConversationFolder, newTitle: string) => {
    newTitle = newTitle.trim();
    if (!newTitle) {
      return;
    }

    const newItemList = [...items];

    newItemList.forEach((item) => {
      if ('conversations' in item) {
        folder.title = newTitle;
      }
    });

    setItems([...newItemList]);
  }, [items]);

  const handleUpdateConversation = useCallback((newData: IChatConversation) => {
    const newList = [...items];

    [...newList].forEach((item, itemIndex) => {
      if (item.id === newData.id) {
        newList[itemIndex] = newData;
      }
    });

    setItems(newList);
  }, [items]);

  return (
    <>
      <Sidebar
        side={'left'}
        isOpen={isOpen}
        addItemButtonTitle={'New chat'}
        itemComponent={(
          <Conversations
            conversations={filteredConversations}
            onDelete={handleDeleteConversation}
            onUpdate={handleUpdateConversation}
          />
        )}
        folderComponent={
          <ChatFolders
            folders={folders}
            searchTerm={searchTerm}
            onDeleteConversation={handleDeleteConversation}
            onDeleteFolder={handleDeleteFolder} onUpdateFolderTitle={handleUpdateFolderTitle}
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
        handleDrop={handleDrop}
        footerComponent={null}
      />
    </>
  );
};

export default Chatbar;
