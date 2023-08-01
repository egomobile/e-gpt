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
import { v4 } from 'uuid';

// internal imports
import Prompts from '../Prompts';
import PromptFolders from '../PromptFolders';
import Sidebar from '../Sidebar';
import type { ChatPromptItem, IChatPrompt, IChatPromptFolder } from '../../types';
import { filterChatPrompts } from '../../utils';

interface IPromptbarProps {
  items: ChatPromptItem[];
  onPromptDelete: (promptId: string) => void;
  onPromptItemsUpdate: (items: ChatPromptItem[]) => void;
}

const Promptbar: React.FC<IPromptbarProps> = ({
  items,
  onPromptDelete,
  onPromptItemsUpdate
}) => {
  const [currentFolder, setCurrentFolder] = useState<Nullable<IChatPromptFolder>>(null);
  const [isOpen, setIsOpen] = useState(true);
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
    return filterChatPrompts(prompts, searchTerm);
  }, [prompts, searchTerm]);

  const handleItemsUpdate = useCallback((newList: ChatPromptItem[]) => {
    onPromptItemsUpdate(newList);
  }, [onPromptItemsUpdate]);

  const handleCreateFolder = useCallback(() => {
    const newNextFolderIndex = nextNewFolderIndex + 1;

    const newFolder: IChatPromptFolder = {
      prompts: [],
      id: `cpf:${Date.now()}-${v4()}`,
      title: `New Folder #${newNextFolderIndex}`,
      type: 'prompt',
    };

    handleItemsUpdate([...items, newFolder]);
    setNextNewFolderIndex(newNextFolderIndex);
  }, [handleItemsUpdate, items, nextNewFolderIndex]);

  const handleToggleChatbar = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const handleCreateItem = useCallback(() => {
    const newNextNewPromptIndex = nextNewPromptIndex + 1;

    const newPrompt: IChatPrompt = {
      folderId: currentFolder?.id || '',
      id: `cp:${Date.now()}-${v4()}`,
      title: `New Prompt #${newNextNewPromptIndex}`,
      content: '',
      description: ''
    };

    const list = [...items];

    if (currentFolder) {
      currentFolder.prompts.push(newPrompt);
    } else {
      list.push(newPrompt);
    }

    handleItemsUpdate(list);
    setNextNewPromptIndex(newNextNewPromptIndex);
  }, [currentFolder, handleItemsUpdate, items, nextNewPromptIndex]);

  const handleSearchTerm = useCallback((newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
  }, []);

  const handleUpdatePrompt = useCallback((newData: IChatPrompt) => {
    const folder = folders.find((f) => {
      return f.id === newData.folderId;
    });

    const newList = [...items];

    const list = folder ? folder.prompts : newList;
    [...list].forEach((item, itemIndex) => {
      if (item.id === newData.id) {
        list[itemIndex] = newData;
      }
    });

    handleItemsUpdate(newList);
  }, [folders, handleItemsUpdate, items]);

  const handleDeletePrompt = useCallback((prompt: IChatPrompt, triggerUpdateEvents: boolean) => {
    const newItemList = items.filter((item) => {
      if (!('prompts' in item)) {
        return item.id !== prompt.id;
      }

      return true;
    });

    if (triggerUpdateEvents) {
      handleItemsUpdate([...newItemList]);

      onPromptDelete(prompt.id);
    }
  }, [handleItemsUpdate, items, onPromptDelete]);

  const handleDeleteFolder = useCallback((folder: IChatPromptFolder) => {
    const newItemList = items.filter((item) => {
      if ('prompts' in item) {
        return item.id !== folder.id;
      }

      return item.folderId !== folder.id;
    });

    folder.prompts.forEach((prompt) => {
      handleDeletePrompt(prompt, false);
    });

    setCurrentFolder(null);
    handleItemsUpdate(newItemList);
  }, [handleDeletePrompt, handleItemsUpdate, items]);

  const handleUpdateFolderTitle = useCallback((folder: IChatPromptFolder, newTitle: string) => {
    newTitle = newTitle.trim();
    if (!newTitle) {
      return;
    }

    const newItemList = [...items];

    [...newItemList].forEach((item, itemIndex) => {
      if ('prompts' in item && item.id === folder.id) {
        newItemList[itemIndex] = {
          ...item,

          title: newTitle
        };
      }
    });

    handleItemsUpdate(newItemList);
  }, [handleItemsUpdate, items]);

  useEffect(() => {
    onPromptItemsUpdate(items);
  }, [items, onPromptItemsUpdate]);

  return (
    <>
      <Sidebar
        side={'right'}
        isOpen={isOpen}
        addItemButtonTitle={'New prompt'}
        itemComponent={
          <Prompts
            prompts={filteredPrompts}
            onClick={() => {
              setCurrentFolder(null);
            }}
            onDelete={(p) => handleDeletePrompt(p, true)}
            onUpdate={handleUpdatePrompt}
          />
        }
        folderComponent={
          <PromptFolders
            folders={folders}
            onDeleteFolder={handleDeleteFolder}
            onDeletePrompt={(p) => handleDeletePrompt(p, true)}
            onFolderClick={(folder, isOpen) => {
              if (isOpen) {
                setCurrentFolder(folder);
              } else {
                setCurrentFolder(null);
              }
            }}
            onFolderOpenUpate={(folder, isOpen) => { }}
            onPromptClick={(c) => {
              setCurrentFolder(null);
            }}
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
        footerComponent={null}
      />
    </>
  );
};

export default Promptbar;
