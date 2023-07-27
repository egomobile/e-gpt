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
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  IconCheck,
  IconMessage,
  IconPencil,
  IconTrash,
  IconX,
} from '@tabler/icons-react';

// internal imports
import SidebarActionButton from '../SidebarActionButton';
import useSelectedChatConversation from '../../hooks/useSelectedChatConversation';
import type { IChatConversation } from '../../types';

interface IConversationProps {
  conversation: IChatConversation;
  onClick: () => void;
  onDelete: () => void;
  onUpdate: (newData: IChatConversation) => void;
}

const Conversation: React.FC<IConversationProps> = ({ conversation, onClick, onDelete, onUpdate }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const selectedConversation = useSelectedChatConversation();

  const handleRename = useCallback((conversation: IChatConversation) => {
    const newTitle = renameValue.trim();

    if (!newTitle) {
      return;
    }

    onUpdate({
      ...conversation,

      title: newTitle
    });

    setRenameValue('');
    setIsRenaming(false);
  }, [onUpdate, renameValue]);

  const handleEnterDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (selectedConversation) {
        handleRename(selectedConversation);
      }
    }
  }, [handleRename, selectedConversation]);

  const handleConfirm: React.MouseEventHandler<HTMLButtonElement> = useCallback((e) => {
    e.stopPropagation();
    if (isDeleting) {
      onDelete();
    } else if (isRenaming) {
      handleRename(conversation);
    }

    setIsDeleting(false);
    setIsRenaming(false);
  }, [conversation, handleRename, isDeleting, isRenaming, onDelete]);

  const handleCancel: React.MouseEventHandler<HTMLButtonElement> = useCallback((e) => {
    e.stopPropagation();

    setIsDeleting(false);
    setIsRenaming(false);
  }, []);

  const handleOpenRenameModal: React.MouseEventHandler<HTMLButtonElement> = useCallback((e) => {
    e.stopPropagation();
    setIsRenaming(true);
    selectedConversation && setRenameValue(selectedConversation.title);
  }, [selectedConversation]);

  const handleOpenDeleteModal: React.MouseEventHandler<HTMLButtonElement> = useCallback((e) => {
    e.stopPropagation();

    setIsDeleting(true);
  }, []);

  useEffect(() => {
    if (isRenaming) {
      setIsDeleting(false);
    } else if (isDeleting) {
      setIsRenaming(false);
    }
  }, [isRenaming, isDeleting]);

  return (
    <div className="relative flex items-center">
      {isRenaming && selectedConversation?.id === conversation.id ? (
        <div className="flex w-full items-center gap-3 rounded-lg bg-[#343541]/90 p-3">
          <IconMessage size={18} />
          <input
            className="mr-12 flex-1 overflow-hidden overflow-ellipsis border-neutral-400 bg-transparent text-left text-[12.5px] leading-3 text-white outline-none focus:border-neutral-100"
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleEnterDown}
            autoFocus
          />
        </div>
      ) : (
        <button
          className={`flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-sm transition-colors duration-200 hover:bg-[#343541]/90'
            } ${selectedConversation?.id === conversation.id
              ? 'bg-[#343541]/90'
              : ''
            }`}
          onClick={onClick}
          draggable="true"
        >
          <IconMessage size={18} />
          <div
            className={`relative max-h-5 flex-1 overflow-hidden text-ellipsis whitespace-nowrap break-all text-left text-[12.5px] leading-3 ${selectedConversation?.id === conversation.id ? 'pr-12' : 'pr-1'
              }`}
          >
            {conversation.title}
          </div>
        </button>
      )}

      {(isDeleting || isRenaming) &&
        selectedConversation?.id === conversation.id && (
          <div className="absolute right-1 z-10 flex text-gray-300">
            <SidebarActionButton handleClick={handleConfirm}>
              <IconCheck size={18} />
            </SidebarActionButton>
            <SidebarActionButton handleClick={handleCancel}>
              <IconX size={18} />
            </SidebarActionButton>
          </div>
        )}

      {selectedConversation?.id === conversation.id &&
        !isDeleting &&
        !isRenaming && (
          <div className="absolute right-1 z-10 flex text-gray-300">
            <SidebarActionButton handleClick={handleOpenRenameModal}>
              <IconPencil size={18} />
            </SidebarActionButton>
            <SidebarActionButton handleClick={handleOpenDeleteModal}>
              <IconTrash size={18} />
            </SidebarActionButton>
          </div>
        )}
    </div>
  );
};

export default Conversation;
