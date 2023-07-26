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
import Prompts from '../Prompts';
import PromptFolders from '../PromptFolders';
import Sidebar from '../Sidebar';
import { ChatPromptItem, IChatPrompt, IChatPromptFolder } from '../../types';
import { toSearchString } from '../../utils';

const Promptbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [items, setItems] = useState<ChatPromptItem[]>([]);
  const [nextNewFolderIndex, setNextNewFolderIndex] = useState(0);
  const [nextNewPromptIndex, setNextNewPromptIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const folders = useMemo(() => {
    return items.filter((item) => {
      return 'prompts' in item;
    }) as IChatPromptFolder[];
  }, [items]);

  const prompts = useMemo(() => {
    return items.filter((item) => {
      return !('prompts' in item) && !item.folderId;
    }) as IChatPrompt[];
  }, [items]);

  const filteredPrompts = useMemo(() => {
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
  }, [prompts, searchTerm]);

  const handleDrop = useCallback((e: any) => {
    console.log('Chatbar.handleDrop');
  }, []);

  const handleCreateFolder = useCallback(() => {
    const newNextFolderIndex = nextNewFolderIndex + 1;

    const newFolder: IChatPromptFolder = {
      prompts: [],
      id: `${Date.now()}-${v4()}`,
      title: `New Folder #${newNextFolderIndex}`,
      type: 'prompt',
    };

    setItems([...items, newFolder]);
    setNextNewFolderIndex(newNextFolderIndex);
  }, [items, nextNewFolderIndex]);

  const handleToggleChatbar = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const handleCreateItem = useCallback(() => {
    const newNextNewPromptIndex = nextNewPromptIndex + 1;

    const newPrompt: IChatPrompt = {
      folderId: '',
      id: `${Date.now()}-${v4()}`,
      title: `New Prompt #${newNextNewPromptIndex}`,
      content: '',
      description: ''
    };

    setItems([...items, newPrompt]);
    setNextNewPromptIndex(newNextNewPromptIndex);
  }, [items, nextNewPromptIndex]);

  const handleSearchTerm = useCallback((newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
  }, []);

  const handleUpdatePrompt = useCallback((newData: IChatPrompt) => {
    const newList = [...items];

    [...newList].forEach((item, itemIndex) => {
      if (item.id === newData.id) {
        newList[itemIndex] = newData;
      }
    });

    setItems(newList);
  }, [items]);

  const handleDeleteFolder = useCallback((folder: IChatPromptFolder) => {
    const newItemList = items.filter((item) => {
      if ('prompts' in item) {
        return item.id !== folder.id;
      }

      return item.folderId !== folder.id;
    });

    setItems([...newItemList]);
  }, [items]);

  const handleDeletePrompt = useCallback((prompt: IChatPrompt) => {
    const newItemList = items.filter((item) => {
      if (!('prompts' in item)) {
        return item.id !== prompt.id;
      }

      return true;
    });

    setItems([...newItemList]);
  }, [items]);

  const handleUpdateFolderTitle = useCallback((folder: IChatPromptFolder, newTitle: string) => {
    newTitle = newTitle.trim();
    if (!newTitle) {
      return;
    }

    const newItemList = [...items];

    newItemList.forEach((item) => {
      if ('prompts' in item) {
        folder.title = newTitle;
      }
    });

    setItems([...newItemList]);
  }, [items]);

  return (
    <>
      <Sidebar
        side={'left'}
        isOpen={isOpen}
        addItemButtonTitle={'New prompt'}
        itemComponent={
          <Prompts
            prompts={filteredPrompts}
            onDelete={handleDeletePrompt}
            onUpdate={handleUpdatePrompt}
          />
        }
        folderComponent={
          <PromptFolders
            folders={folders}
            onDeleteFolder={handleDeleteFolder}
            onDeletePrompt={handleDeletePrompt}
            onUpdateFolderTitle={handleUpdateFolderTitle}
            onUpdatePrompt={(folder, newData) => {
              handleUpdatePrompt(newData);
            }}
            searchTerm={searchTerm}
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

export default Promptbar;
