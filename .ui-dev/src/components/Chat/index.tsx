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
import _ from 'lodash';
import axios from 'axios';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Nilable } from '@egomobile/types';

// internal imports
import ChatInput from './components/ChatInput';
import ChatLoader from './components/ChatLoader';
import ChatMessage from './components/ChatMessage';
import SystemPrompt from './components/SystemPrompt';
import TemperatureSlider from './components/TemperatureSlider';
import useAppContext from '../../hooks/useAppContext';
import { throttle } from '../../utils';
import type { IChatConversation, IChatMessage, IChatPrompt } from '../../types';
import { defaultSystemPrompt, defaultTemperature } from '../../constants';

interface IChatProps {
  onConversationUpdate: (conversation: IChatConversation) => void;
  onRefresh: (conversationToSelect: Nilable<IChatConversation>) => void;
  prompts: IChatPrompt[];
}

interface ILastError {
  message: string;
  time: string;
}

type SendType = 'append' | 'regenerate';

const Chat: React.FC<IChatProps> = ({
  onConversationUpdate,
  onRefresh,
  prompts
}) => {
  const [showScrollDownButton, setShowScrollDownButton] =
    useState<boolean>(false);

  const {
    apiKeySettings,
    selectedConversation
  } = useAppContext();

  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true);
  const [isSending, setIsSending] = useState(false);
  const [lastError, setLastError] = useState<Nilable<ILastError>>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentUserMessage = useMemo(() => {
    return _(selectedConversation?.messages ?? [])
      .filter((m) => {
        return m.role === 'user';
      })
      .last() ?? null;
  }, [selectedConversation?.messages]);

  const currentMessage = useMemo(() => {
    return _(selectedConversation?.messages ?? [])
      .last() ?? null;
  }, [selectedConversation?.messages]);

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

      systemPrompt: newPrompt.trim(),
    });
  }, [onConversationUpdate]);

  const handleUpdateConversationTemperatureChange = useCallback((conversation: IChatConversation, newTemperature: number) => {
    onConversationUpdate({
      ...conversation,

      temperature: newTemperature,
    });
  }, [onConversationUpdate]);

  const handleSend = useCallback(async (type: SendType, message: IChatMessage, done: (error: any) => void) => {
    if (isSending || !selectedConversation) {
      return;
    }

    setIsSending(true);
    setLastError(null);

    try {
      const conversationMessages = [...selectedConversation.messages];
      if (type === 'regenerate') {
        // remove last user message with all following
        // answers

        let lastMessage: Nilable<IChatMessage>;
        do {
          lastMessage = _(conversationMessages).last();

          if (lastMessage?.role === 'user') {
            conversationMessages.pop();
          }
        } while (lastMessage?.role === 'user');
      }

      const appendMessage = (msg: IChatMessage) => {
        conversationMessages.push(msg);

        onConversationUpdate({
          ...selectedConversation,

          messages: [...conversationMessages]
        });
      };

      appendMessage(message);

      const systemPrompt = selectedConversation.systemPrompt.trim() ||
        defaultSystemPrompt;
      const temperature = typeof selectedConversation.temperature === 'number' ?
        Number(selectedConversation.temperature.toFixed(2)) :
        defaultTemperature;

      const postData = {
        conversation: [
          systemPrompt,
          ...conversationMessages.map((cm) => {
            return cm.content;
          }),
        ],
        temperature
      };

      const {
        data, status
      } = await axios.post('chat', postData);

      if (status !== 200) {
        throw new Error(`Unexpected response: ${status}`);
      }

      appendMessage({
        role: 'assistant',
        content: data.answer,
        time: data.time
      });

      done(null);

      onRefresh(_.cloneDeep({
        ...selectedConversation,

        messages: [...conversationMessages]
      }));
    } catch (error: any) {
      console.error('[ERROR]', 'Chat.handleSend(1)', error);

      setLastError({
        message: `[${error?.name}] ${error?.message}`,
        time: new Date().toISOString()
      });

      done(error);
    } finally {
      setIsSending(false);
    }
  }, [isSending, onConversationUpdate, onRefresh, selectedConversation]);

  const handleSendError = useCallback((error: any) => {
    if (error) {
      console.error('[ERROR]', 'Chat.handleRegenerate()', error);
    }
  }, []);

  const handleRegenerate = useCallback(() => {
    if (!currentUserMessage) {
      return;
    }

    handleSend('regenerate', currentUserMessage, handleSendError);
  }, [currentUserMessage, handleSend, handleSendError]);

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
            Important: Please update your API settings first!
          </div>
        </div>
      </div>
    );
  }, []);

  const renderLoader = useCallback(() => {
    if (!isSending) {
      return null;
    }

    return <ChatLoader />;
  }, [isSending]);

  const renderLastError = useCallback(() => {
    if (isSending) {
      return null;
    }

    if (!lastError) {
      return null;
    }

    return (
      <ChatMessage
        isSending={isSending}
        onDelete={() => {
          setLastError(null);
        }}
        message={{
          content: lastError.message,
          isError: true,
          role: 'assistant',
          time: lastError.time
        }}
        messageIndex={Number.MIN_SAFE_INTEGER}
      />
    );
  }, [isSending, lastError]);

  const renderMessages = useCallback(() => {
    if (!selectedConversation?.messages) {
      return null;
    }

    return (
      <div className='pt-8'>
        {selectedConversation?.messages.map((message, index) => (
          <ChatMessage
            key={index}
            isSending={isSending}
            message={message}
            messageIndex={index}
            onDelete={(messageIndex, conversation) => {
              const copyOfConversation = _.clone({
                ...conversation,

                messages: conversation.messages.slice(0, messageIndex)
              });

              onConversationUpdate(copyOfConversation);
              if (copyOfConversation.id === selectedConversation?.id) {
                onRefresh(copyOfConversation);
              }
            }}
            onEdit={(editedMessage, conversation) => {
              const copyOfConversation = _.clone({
                ...conversation,

                messages: [...conversation.messages]
              });

              copyOfConversation.messages[index] = editedMessage;

              onConversationUpdate(copyOfConversation);
              if (copyOfConversation.id === selectedConversation?.id) {
                onRefresh(copyOfConversation);
              }
            }}
          />
        ))}

        {renderLoader()}
        {renderLastError()}

        <div
          className="h-[162px] bg-white dark:bg-[#343541]"
          ref={messagesEndRef}
        />
      </div>
    );
  }, [isSending, onConversationUpdate, onRefresh, renderLastError, renderLoader, selectedConversation?.id, selectedConversation?.messages]);

  const renderTemperature = useCallback(() => {
    if (!selectedConversation) {
      return null;
    }

    const label: React.ReactNode = 'Temperature';

    if (!!selectedConversation.messages?.length) {
      return (
        <div className="flex flex-col">
          <label className="mb-2 text-left text-neutral-700 dark:text-neutral-400">
            {label}: <span className="font-bold">{selectedConversation.temperature.toFixed(1)}</span>
          </label>
        </div>
      );
    }

    return (
      <TemperatureSlider
        label={label}
        disabled={isSending}
        conversation={selectedConversation}
        onChange={(temperature) => {
          handleUpdateConversationTemperatureChange(selectedConversation, temperature);
        }}
      />
    );
  }, [handleUpdateConversationTemperatureChange, isSending, selectedConversation]);

  const renderChatInput = useCallback(() => {
    return (
      <>
        <div
          className="max-h-full overflow-x-hidden"
          ref={chatContainerRef}
          onScroll={handleScroll}
        >
          <div className="mx-auto flex flex-col space-y-5 md:space-y-10 px-3 pt-5 md:pt-12 sm:max-w-[600px]">
            <div className="text-center text-3xl font-semibold text-gray-800 dark:text-gray-100">
              e.GPT by e.GO
            </div>

            {selectedConversation && (
              <>
                <SystemPrompt
                  conversation={selectedConversation}
                  disabled={isSending || !!selectedConversation?.messages.length}
                  prompts={prompts}
                  onChange={(prompt) => {
                    handleUpdateConversationPromptChange(selectedConversation, prompt);
                  }}
                />

                {renderTemperature()}
              </>
            )}
          </div>

          {renderMessages()}
        </div>

        <ChatInput
          isSending={isSending}
          prompts={prompts}
          textareaRef={textareaRef}
          onSend={(msg, done) => {
            handleSend('append', msg, done);
          }}
          onScrollDownClick={handleScrollDown}
          onRegenerate={handleRegenerate}
          showScrollDownButton={showScrollDownButton}
        />
      </>
    );
  }, [handleRegenerate, handleScroll, handleScrollDown, handleSend, handleUpdateConversationPromptChange, isSending, prompts, renderMessages, renderTemperature, selectedConversation, showScrollDownButton]);

  const renderContent = useCallback(() => {
    if (!apiKeySettings?.accessType) {
      return renderApiKeyRequiredContent();
    }

    return renderChatInput();
  }, [apiKeySettings?.accessType, renderApiKeyRequiredContent, renderChatInput]);

  useEffect(() => {
    if (currentMessage) {
      throttledScrollDown();
    }
  }, [currentMessage, throttledScrollDown]);

  return (
    <div className="relative flex-1 overflow-hidden bg-white dark:bg-[#343541]">
      {renderContent()}
    </div>
  );
};

export default Chat;
