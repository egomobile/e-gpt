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

// system import
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Nullable } from '@egomobile/types';

// internal imports
import ChatInput from './components/ChatInput';
import ChatLoader from './components/ChatLoader';
import MemoizedChatMessage from './components/MemoizedChatMessage';
import SystemPrompt from './components/SystemPrompt';
import useSelectedChatConversation from '../../hooks/useSelectedChatConversation';
import { throttle } from '../../utils';
import type { IChatConversation, IChatMessage, IChatPrompt } from '../../types';

interface IChatProps {
  onConversationUpdate: (conversation: IChatConversation) => void;
  prompts: IChatPrompt[];
}

const Chat: React.FC<IChatProps> = ({
  onConversationUpdate,
  prompts
}) => {
  const [showScrollDownButton, setShowScrollDownButton] =
    useState<boolean>(false);

  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true);
  const [currentMessage, setCurrentMessage] = useState<Nullable<IChatMessage>>();
  const [isLoading, setIsLoading] = useState(true);

  const selectedConversation = useSelectedChatConversation();

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleScrollDown = useCallback(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, []);

  const handleScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      const bottomTolerance = 30;

      if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
        setAutoScrollEnabled(false);
        setShowScrollDownButton(true);
      } else {
        setAutoScrollEnabled(true);
        setShowScrollDownButton(false);
      }
    }
  }, []);

  const scrollDown = useCallback(() => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView(true);
    }
  }, [autoScrollEnabled]);

  const throttledScrollDown = useMemo(() => {
    return throttle(scrollDown, 250);
  }, [scrollDown]);

  const handleUpdateConversationPromptChange = useCallback((conversation: IChatConversation, newPrompt: string) => {
    onConversationUpdate({
      ...conversation,

      systemPrompt: newPrompt,
    });
  }, [onConversationUpdate]);

  const handleSend = useCallback((message: IChatMessage) => {
    if (isLoading) {
      return;
    }

    setCurrentMessage(message);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
    }, 5000);
  }, [isLoading]);

  const renderApiKeyRequiredContent = useCallback(() => {
    return (
      <div className="mx-auto flex h-full w-[300px] flex-col justify-center space-y-6 sm:w-[600px]">
        <div className="text-center text-4xl font-bold text-black dark:text-white">
          Welcome to e.GPT
        </div>
        <div className="text-center text-lg text-black dark:text-white">
          <div className="mb-8">
            <div className="mb-2">
              UI is inspired by <a
                href="https://github.com/mckaywrigley/chatbot-ui"
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:underline"
              >
                Chatbot UI
              </a> by <a
                href="https://github.com/mckaywrigley"
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:underline"
              >
                Mckay Wrigley
              </a>
            </div>
          </div>
          <div className="mb-2 font-bold">
            Important: e.GPT UI is 100% unaffiliated with OpenAI.
          </div>
        </div>
      </div>
    );
  }, []);

  const renderChatInput = useCallback(() => {
    return (
      <>
        <div
          className="max-h-full overflow-x-hidden"
          ref={chatContainerRef}
          onScroll={handleScroll}
        >
          {!selectedConversation?.messages.length ? (
            <>
              <div className="mx-auto flex flex-col space-y-5 md:space-y-10 px-3 pt-5 md:pt-12 sm:max-w-[600px]">
                <div className="text-center text-3xl font-semibold text-gray-800 dark:text-gray-100">
                  e.GPT by e.GO
                </div>

                {!selectedConversation && (
                  <div className="text-center text-lg text-black dark:text-white">
                    <div className="mb-2 font-bold">
                      No conversation selected
                    </div>
                  </div>
                )}

                {selectedConversation && (
                  <SystemPrompt
                    conversation={selectedConversation}
                    disabled={!!selectedConversation?.messages.length}
                    prompts={prompts}
                    onPromptChange={(prompt) => {
                      handleUpdateConversationPromptChange(selectedConversation, prompt);
                    }}
                  />
                )}
              </div>
            </>
          ) : (
            <>
              {selectedConversation?.messages.map((message, index) => (
                <MemoizedChatMessage
                  key={index}
                  message={message}
                  messageIndex={index}
                  onEdit={(editedMessage) => {
                    setCurrentMessage(editedMessage);

                    //
                  }}
                />
              ))}

              {isLoading && <ChatLoader />}

              <div
                className="h-[162px] bg-white dark:bg-[#343541]"
                ref={messagesEndRef}
              />
            </>
          )}
        </div>

        <ChatInput
          prompts={prompts}
          textareaRef={textareaRef}
          onSend={handleSend}
          onScrollDownClick={handleScrollDown}
          onRegenerate={() => {
            //
          }}
          showScrollDownButton={showScrollDownButton}
        />
      </>
    );
  }, [handleScroll, handleScrollDown, handleSend, handleUpdateConversationPromptChange, isLoading, prompts, selectedConversation, showScrollDownButton]);

  const renderContent = useCallback(() => {
    const apiKey = 'TEST';  // TODO: replace

    if (!apiKey) {
      return renderApiKeyRequiredContent();
    }

    return renderChatInput();
  }, [renderApiKeyRequiredContent, renderChatInput]);

  useEffect(() => {
    throttledScrollDown();
    selectedConversation &&
      setCurrentMessage(
        selectedConversation.messages[selectedConversation.messages.length - 2],
      );
  }, [selectedConversation, throttledScrollDown]);

  return (
    <div className="relative flex-1 overflow-hidden bg-white dark:bg-[#343541]">
      {renderContent()}
    </div>
  );
};

export default Chat;
