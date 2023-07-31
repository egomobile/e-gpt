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
import React, { useCallback } from "react";

// internal imports
import Folder from "../Folder";
import Prompt from "../Prompt";
import type { IChatPrompt, IChatPromptFolder } from "../../types";
import { toSearchString } from "../../utils";

interface IGetFolderProps {
  currentFolder: IChatPromptFolder;
  onDeletePrompt: (prompt: IChatPrompt) => void;
  onPromptClick: (conversation: IChatPrompt) => void;
  onUpdatePrompt: (folder: IChatPromptFolder, newData: IChatPrompt) => void;
}

interface IPromptFoldersProps {
  folders: IChatPromptFolder[];
  onDeleteFolder: (folder: IChatPromptFolder) => void;
  onDeletePrompt: (prompt: IChatPrompt) => void;
  onFolderClick: (folder: IChatPromptFolder, isOpen: boolean) => void;
  onFolderOpenUpate: (folder: IChatPromptFolder, isOpen: boolean) => void;
  onPromptClick: (conversation: IChatPrompt) => void;
  onUpdateFolderTitle: (folder: IChatPromptFolder, title: string) => void;
  onUpdatePrompt: (folder: IChatPromptFolder, newData: IChatPrompt) => void;
  searchTerm: string;
}

const getFolder = ({
  currentFolder,
  onDeletePrompt,
  onPromptClick,
  onUpdatePrompt
}: IGetFolderProps) => {
  const {
    prompts
  } = currentFolder;

  if (!prompts) {
    return;
  }

  return (
    prompts
      .filter((p) => p.folderId)
      .map((prompt, index) => {
        if (prompt.folderId === currentFolder.id) {
          return (
            <div key={index} className="ml-5 gap-2 border-l pl-2">
              <Prompt
                prompt={prompt}
                onClick={() => onPromptClick(prompt)}
                onDelete={() => onDeletePrompt(prompt)}
                onUpdate={(newData) => onUpdatePrompt(currentFolder, newData)}
              />
            </div>
          );
        }

        return null;
      })
  );
};

const PromptFolders: React.FC<IPromptFoldersProps> = ({
  folders,
  onDeleteFolder,
  onDeletePrompt,
  onFolderClick,
  onFolderOpenUpate,
  onPromptClick,
  onUpdateFolderTitle,
  onUpdatePrompt,
  searchTerm
}) => {
  const handleDeleteFolder = useCallback((folder: IChatPromptFolder) => {
    onDeleteFolder(folder);
  }, [onDeleteFolder]);

  const handleUpdateFolderTitle = useCallback((folder: IChatPromptFolder, newTitle: string) => {
    onUpdateFolderTitle(folder, newTitle);
  }, [onUpdateFolderTitle]);

  return (
    <div className="flex w-full flex-col pt-2">
      {folders
        .filter((folder) => folder.type === 'prompt')
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
              onPromptClick,
              onDeletePrompt,
              onUpdatePrompt
            }) as any}
            onClick={(isOpen) => onFolderClick(folder, isOpen)}
            onDelete={() => handleDeleteFolder(folder)}
            onOpenUpdate={(isOpen) => onFolderOpenUpate(folder, isOpen)}
            onUpdateTitle={(newTitle) => handleUpdateFolderTitle(folder, newTitle)}
            searchTerm={searchTerm}
          />
        ))}
    </div>
  );
};

export default PromptFolders;
