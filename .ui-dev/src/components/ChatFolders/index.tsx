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
import React, { useCallback } from 'react';

// internal imports
import Conversation from '../Conversation';
import Folder from '../Folder';
import type { IChatConversation, IChatConversationFolder } from '../../types';
import { toSearchString } from '../../utils';

interface IChatFoldersProps {
  folders: IChatConversationFolder[];
  onConversationClick: (conversation: IChatConversation) => void;
  onDeleteConversation: (conversation: IChatConversation) => void;
  onDeleteFolder: (folder: IChatConversationFolder) => void;
  onFolderClick: (folder: IChatConversationFolder) => void;
  onFolderOpenUpate: (folder: IChatConversationFolder, isOpen: boolean) => void;
  onUpdateConversation: (folder: IChatConversationFolder, newData: IChatConversation) => void
  onUpdateFolderTitle: (folder: IChatConversationFolder, title: string) => void;
  searchTerm: string;
}

interface IGetFolderOptions {
  currentFolder: IChatConversationFolder;
  onConversationClick: (conversation: IChatConversation) => void;
  onDeleteConversation: (conversation: IChatConversation) => void;
  onUpdateConversation: (folder: IChatConversationFolder, newData: IChatConversation) => void;
}

const getFolder = ({
  currentFolder,
  onConversationClick,
  onDeleteConversation,
  onUpdateConversation
}: IGetFolderOptions) => {
  const {
    conversations
  } = currentFolder;

  if (!conversations) {
    return;
  }

  return (
    conversations
      .filter((conversation) => conversation.folderId)
      .map((conversation, index) => {
        if (conversation.folderId !== currentFolder.id) {
          return null;
        }

        return (
          <div key={index} className="ml-5 gap-2 border-l pl-2">
            <Conversation
              conversation={conversation}
              onClick={() => onConversationClick(conversation)}
              onDelete={() => onDeleteConversation(conversation)}
              onUpdate={(newData) => onUpdateConversation(currentFolder, newData)}
            />
          </div>
        );
      })
  );
};

const ChatFolders: React.FC<IChatFoldersProps> = ({
  folders,
  onConversationClick,
  onDeleteConversation,
  onDeleteFolder,
  onFolderClick,
  onFolderOpenUpate,
  onUpdateConversation,
  onUpdateFolderTitle,
  searchTerm
}) => {
  const handleDeleteFolder = useCallback((folder: IChatConversationFolder) => {
    onDeleteFolder(folder);
  }, [onDeleteFolder]);

  const handleUpdateFolderTitle = useCallback((folder: IChatConversationFolder, newTitle: string) => {
    onUpdateFolderTitle(folder, newTitle);
  }, [onUpdateFolderTitle]);

  return (
    <div className="flex w-full flex-col pt-2">
      {folders
        .sort((x, y) => {
          return toSearchString(x.title).localeCompare(
            toSearchString(y.title)
          );
        })
        .map((folder, folderIndex) => (
          <Folder
            key={folderIndex}
            currentFolder={folder}
            folderComponent={getFolder({
              currentFolder: folder,
              onConversationClick,
              onDeleteConversation,
              onUpdateConversation
            }) as any}
            onClick={() => onFolderClick(folder)}
            onDelete={() => handleDeleteFolder(folder)}
            onOpenUpdate={(isOpen) => onFolderOpenUpate(folder, isOpen)}
            onUpdateTitle={(newTitle) => handleUpdateFolderTitle(folder, newTitle)}
            searchTerm={searchTerm}
          />
        ))}
    </div>
  );
};

export default ChatFolders;
