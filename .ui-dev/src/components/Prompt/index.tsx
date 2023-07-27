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
import {
  IconBulbFilled,
  IconCheck,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

// internal imports
import PromptModal from '../PromptModal';
import SidebarActionButton from '../SidebarActionButton';
import type { IChatPrompt } from '../../types';

interface IPromptProps {
  prompt: IChatPrompt;
  onClick: () => void;
  onDelete: () => void;
  onUpdate: (newData: IChatPrompt) => void;
}

const Prompt: React.FC<IPromptProps> = ({
  onClick,
  onDelete,
  onUpdate,
  prompt
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [showModal, setShowModal] = useState<boolean>(false);

  const handleUpdate = useCallback((prompt: IChatPrompt) => {
    onUpdate(prompt);
  }, [onUpdate]);

  const handleDelete: React.MouseEventHandler<HTMLButtonElement> = useCallback((e) => {
    e.stopPropagation();

    if (isDeleting) {
      onDelete();
    }

    setIsDeleting(false);
  }, [isDeleting, onDelete]);

  const handleCancelDelete: React.MouseEventHandler<HTMLButtonElement> = useCallback((e) => {
    e.stopPropagation();

    setIsDeleting(false);
  }, []);

  const handleOpenDeleteModal: React.MouseEventHandler<HTMLButtonElement> = useCallback((e) => {
    e.stopPropagation();

    setIsDeleting(true);
  }, []);

  useEffect(() => {
    const newTitle = renameValue.trim();
    if (newTitle) {
      handleUpdate({
        ...prompt,

        title: newTitle
      });
    }
  }, [handleUpdate, prompt, renameValue]);

  useEffect(() => {
    if (isRenaming) {
      setIsDeleting(false);
    } else if (isDeleting) {
      setIsRenaming(false);
    }
  }, [isRenaming, isDeleting]);

  return (
    <div className="relative flex items-center">
      <button
        className="flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-sm transition-colors duration-200 hover:bg-[#343541]/90"
        onClick={(e) => {
          onClick();

          e.stopPropagation();
          setShowModal(true);
        }}
        onMouseLeave={() => {
          setIsDeleting(false);
          setIsRenaming(false);
          setRenameValue('');
        }}
      >
        <IconBulbFilled size={18} />

        <div className="relative max-h-5 flex-1 overflow-hidden text-ellipsis whitespace-nowrap break-all pr-4 text-left text-[12.5px] leading-3">
          {prompt.title}
        </div>
      </button>

      {(isDeleting || isRenaming) && (
        <div className="absolute right-1 z-10 flex text-gray-300">
          <SidebarActionButton handleClick={handleDelete}>
            <IconCheck size={18} />
          </SidebarActionButton>

          <SidebarActionButton handleClick={handleCancelDelete}>
            <IconX size={18} />
          </SidebarActionButton>
        </div>
      )}

      {!isDeleting && !isRenaming && (
        <div className="absolute right-1 z-10 flex text-gray-300">
          <SidebarActionButton handleClick={handleOpenDeleteModal}>
            <IconTrash size={18} />
          </SidebarActionButton>
        </div>
      )}

      {showModal && (
        <PromptModal
          prompt={prompt}
          onClose={() => setShowModal(false)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

export default Prompt;
