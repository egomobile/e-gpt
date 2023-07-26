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
import React from 'react';

// internal import
import Conversation from '../Conversation';
import type { IChatConversation } from '../../types';

interface IConversationsProps {
  conversations: IChatConversation[];
}

const Conversations: React.FC<IConversationsProps> = ({ conversations }: IConversationsProps) => {
  return (
    <div className="flex w-full flex-col gap-1">
      {conversations
        .filter((conversation) => !conversation.folderId)
        .slice()
        .reverse()
        .map((conversation, conversationIndex) => (
          <Conversation
            key={`chat-conversation-${conversationIndex}`}
            conversation={conversation}
          />
        ))}
    </div>
  );
};

export default Conversations;
