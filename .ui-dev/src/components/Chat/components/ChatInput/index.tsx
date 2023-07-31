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
import clsx from 'clsx';
import React, { useCallback, useEffect, useMemo, useRef, useState, } from 'react';
import {
  IconArrowDown,
  IconRepeat,
  IconSend,

  TablerIconsProps,
  IconDots,
  IconDotsDiagonal,
  IconDotsDiagonal2,
  IconDotsVertical,
} from '@tabler/icons-react';
import type { Nullable, Optional } from '@egomobile/types';

// internal imports
import PromptList from '../PromptList';
import useSelectedChatConversation from '../../../../hooks/useSelectedChatConversation';
import VariableModal from '../VariableModal';
import type { IChatMessage, IChatPrompt, IVariable } from '../../../../types';
import { isMobile, parseFinalContentWithVariables, parseVariables, toSearchString } from '../../../../utils';

type IconComponent = React.FC<TablerIconsProps>;

interface IChatInputProps {
  isSending: boolean;
  onSend: (
    message: IChatMessage,
    done: (error: any) => any
  ) => void;
  onRegenerate: () => void;
  onScrollDownClick: () => void;
  prompts: IChatPrompt[];
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  showScrollDownButton: boolean;
}

const dotIconComponents: IconComponent[] = [
  IconDots,
  IconDotsDiagonal2,
  IconDotsVertical,
  IconDotsDiagonal,
];

const ChatInput = ({
  isSending,
  onSend,
  onRegenerate,
  onScrollDownClick,
  prompts,
  textareaRef,
  showScrollDownButton,
}: IChatInputProps) => {
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [content, setContent] = useState<Optional<string>>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [promptInputValue, setPromptInputValue] = useState('');
  const [sendIconIndex, setSendIconIndex] = useState<Nullable<number>>(null);
  const [showPluginSelect, setShowPluginSelect] = useState(false);
  const [showPromptList, setShowPromptList] = useState(false);
  const [variables, setVariables] = useState<IVariable[]>([]);

  const promptListRef = useRef<HTMLUListElement | null>(null);

  const selectedConversation = useSelectedChatConversation();

  const maxLength = useMemo(() => {
    return selectedConversation?.model.maxLength ?? null;
  }, [selectedConversation?.model.maxLength]);

  const isInputDiabled = useMemo(() => {
    return !selectedConversation;
  }, [selectedConversation]);

  const canSend = useMemo(() => {
    return !(
      isInputDiabled ||
      isSending ||
      !content?.trim().length
    );
  }, [content, isInputDiabled, isSending]);

  const filteredPrompts = useMemo(() => {
    return prompts.filter((prompt) =>
      toSearchString(prompt.title).toLowerCase().includes(toSearchString(promptInputValue)),
    );
  }, [promptInputValue, prompts]);

  const updatePromptListVisibility = useCallback((text: string) => {
    const match = text.match(/\/\w*$/);

    if (match) {
      setShowPromptList(true);
      setPromptInputValue(match[0].slice(1));
    } else {
      setShowPromptList(false);
      setPromptInputValue('');
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;

    if (maxLength && v.length > maxLength) {
      alert(
        `Message limit is ${maxLength} characters. You have entered ${v.length} characters.`,
      );
      return;
    }

    setContent(v);
    updatePromptListVisibility(v);
  }, [maxLength, updatePromptListVisibility]);

  const handleSend = useCallback(() => {
    if (!content) {
      alert('Please enter a message');
      return;
    }

    setContent('');
    textareaRef.current?.focus();

    onSend({
      role: 'user',
      content,
      time: new Date().toISOString(),
    }, (err) => {
      if (err) {
        console.error('[ERROR]', 'ChatInput.handleSend()', err);
      }
    });

    if (window.innerWidth < 640 && textareaRef && textareaRef.current) {
      textareaRef.current.blur();
    }
  }, [content, onSend, textareaRef]);

  const handlePromptSelect = useCallback((prompt: IChatPrompt) => {
    const parsedVariables = parseVariables(prompt.content);
    setVariables(parsedVariables);

    if (parsedVariables.length > 0) {
      setIsModalVisible(true);
    } else {
      setContent((prevContent) => {
        const updatedContent = prevContent?.replace(/\/\w*$/, prompt.content);
        return updatedContent;
      });
      updatePromptListVisibility(prompt.content);
    }
  }, [updatePromptListVisibility]);

  const handleInitModal = useCallback(() => {
    const selectedPrompt = filteredPrompts[activePromptIndex];
    if (selectedPrompt) {
      setContent((prevContent) => {
        const newContent = prevContent?.replace(
          /\/\w*$/,
          selectedPrompt.content,
        );
        return newContent;
      });
      handlePromptSelect(selectedPrompt);
    }

    setShowPromptList(false);
  }, [activePromptIndex, filteredPrompts, handlePromptSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showPromptList) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActivePromptIndex((prevIndex) =>
          prevIndex < prompts.length - 1 ? prevIndex + 1 : prevIndex,
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActivePromptIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : prevIndex,
        );
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setActivePromptIndex((prevIndex) =>
          prevIndex < prompts.length - 1 ? prevIndex + 1 : 0,
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleInitModal();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowPromptList(false);
      } else {
        setActivePromptIndex(0);
      }
    } else if (e.key === 'Enter' && !isTyping && !isMobile() && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === '/' && e.metaKey) {
      e.preventDefault();
      setShowPluginSelect(!showPluginSelect);
    }
  }, [handleInitModal, handleSend, isTyping, prompts.length, showPluginSelect, showPromptList]);

  const handleSubmit = useCallback((updatedVariables: string[]) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    parseFinalContentWithVariables({
      content,
      values: updatedVariables,
      variables,
    }).then((newContent) => {
      setContent(newContent);
    }).catch(console.error)
      .finally(() => {
        setIsSubmitting(false);

        textareaRef.current?.focus();
      });
  }, [content, isSubmitting, textareaRef, variables]);

  const renderInputField = useCallback(() => {
    let placeholder: string;
    if (isSending) {
      placeholder = '';
    } else {
      placeholder = !selectedConversation ?
        'Please select a conversation on the left side first' :
        'Type a message or type "/" to select a prompt ...';
    }

    return (
      <textarea
        ref={textareaRef}
        className="m-0 w-full resize-none border-0 bg-transparent p-0 py-2 pr-8 pl-4 text-black dark:bg-transparent dark:text-white md:py-3 md:pl-4"
        disabled={isInputDiabled}
        style={{
          resize: 'none',
          bottom: `${textareaRef?.current?.scrollHeight}px`,
          maxHeight: '400px',
          overflow: `${textareaRef.current && textareaRef.current.scrollHeight > 400
            ? 'auto'
            : 'hidden'
            }`,
        }}
        placeholder={placeholder}
        value={content}
        rows={1}
        onCompositionStart={() => setIsTyping(true)}
        onCompositionEnd={() => setIsTyping(false)}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    );
  }, [content, handleChange, handleKeyDown, isInputDiabled, isSending, selectedConversation, textareaRef]);

  const renderSendButton = useCallback(() => {
    if (isInputDiabled) {
      return null;
    }

    let IconClass: IconComponent = IconSend;
    if (typeof sendIconIndex === 'number') {
      IconClass = dotIconComponents[sendIconIndex];
    }

    const iconContainerClassName = "absolute right-2 top-2 rounded-sm p-1 text-neutral-800 opacity-60 dark:bg-opacity-50 dark:text-neutral-100";

    if (typeof sendIconIndex !== 'number') {
      return (
        <button
          className={clsx(iconContainerClassName, 'cursor-pointer')}
          onClick={handleSend}
          disabled={!canSend}
        >
          <IconClass size={18} />
        </button>
      );
    }

    return (
      <div
        className={iconContainerClassName}
      >
        <IconClass size={18} />
      </div>
    );
  }, [canSend, handleSend, isInputDiabled, sendIconIndex]);

  const renderRegenerateButton = useCallback(() => {
    if (isSending || !selectedConversation?.messages?.length) {
      return null;
    }

    return (
      <button
        className="absolute top-0 left-0 right-0 mx-auto mb-3 flex w-fit items-center gap-3 rounded border border-neutral-200 bg-white py-2 px-4 text-black hover:opacity-50 dark:border-neutral-600 dark:bg-[#343541] dark:text-white md:mb-0 md:mt-2"
        onClick={onRegenerate}
      >
        <IconRepeat size={16} /> {'Regenerate response'}
      </button>
    );
  }, [isSending, onRegenerate, selectedConversation?.messages?.length]);

  const renderContent = useCallback(() => {
    return (
      <div className="stretch mx-2 mt-4 flex flex-row gap-3 last:mb-2 md:mx-4 md:mt-[52px] md:last:mb-6 lg:mx-auto lg:max-w-3xl">
        {renderRegenerateButton()}

        <div className="relative mx-2 flex w-full flex-grow flex-col rounded-md border border-black/10 bg-white shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:border-gray-900/50 dark:bg-[#40414F] dark:text-white dark:shadow-[0_0_15px_rgba(0,0,0,0.10)] sm:mx-4">
          {renderInputField()}
          {renderSendButton()}

          {showScrollDownButton && (
            <div className="absolute bottom-12 right-0 lg:bottom-0 lg:-right-10">
              <button
                className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-300 text-gray-800 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-neutral-200"
                onClick={onScrollDownClick}
              >
                <IconArrowDown size={18} />
              </button>
            </div>
          )}

          {showPromptList && filteredPrompts.length > 0 && (
            <div className="absolute bottom-12 w-full">
              <PromptList
                activePromptIndex={activePromptIndex}
                prompts={filteredPrompts}
                onSelect={handleInitModal}
                onMouseOver={setActivePromptIndex}
                promptListRef={promptListRef}
              />
            </div>
          )}

          {isModalVisible && (
            <VariableModal
              prompt={filteredPrompts[activePromptIndex]}
              variables={variables}
              onSubmit={handleSubmit}
              onClose={() => setIsModalVisible(false)}
            />
          )}
        </div>
      </div>
    );
  }, [activePromptIndex, filteredPrompts, handleInitModal, handleSubmit, isModalVisible, onScrollDownClick, renderInputField, renderRegenerateButton, renderSendButton, showPromptList, showScrollDownButton, variables]);

  useEffect(() => {
    if (promptListRef.current) {
      promptListRef.current.scrollTop = activePromptIndex * 30;
    }
  }, [activePromptIndex]);

  useEffect(() => {
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current?.scrollHeight}px`;
      textareaRef.current.style.overflow = `${textareaRef?.current?.scrollHeight > 400 ? 'auto' : 'hidden'}`;
    }
  }, [content, textareaRef]);

  useEffect(() => {
    if (isSending) {
      let currentIndex = 0;
      setSendIconIndex(0);

      const i = setInterval(() => {
        ++currentIndex;
        if (currentIndex >= dotIconComponents.length) {
          currentIndex = 0;
        }

        setSendIconIndex(currentIndex);
      }, 100);

      return () => {
        clearInterval(i);
      };
    } else {
      setSendIconIndex(null);
    }
  }, [isSending]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        promptListRef.current &&
        !promptListRef.current.contains(e.target as Node)
      ) {
        setShowPromptList(false);
      }
    };

    window.addEventListener('click', handleOutsideClick);

    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  return (
    <div className="absolute bottom-0 left-0 w-full border-transparent bg-gradient-to-b from-transparent via-white to-white pt-6 dark:border-white/20 dark:via-[#343541] dark:to-[#343541] md:pt-2">
      {renderContent()}

      <div className="px-3 pt-2 pb-3 text-center text-[12px] text-black/50 dark:text-white/50 md:px-4 md:pt-3 md:pb-6">
        <a
          href="https://github.com/egomobile/e-gpt"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          e.GPT
        </a>
        {" is a command line tool that interacts with OpenAI's ChatGPT, without additional software."}
      </div>
    </div>
  );
};

export default ChatInput;
