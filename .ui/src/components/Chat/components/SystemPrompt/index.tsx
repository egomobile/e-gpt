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
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// internal imports
import type { IChatConversation, IChatPrompt } from '../../../../types';
import PromptList from '../PromptList';
import VariableModal from '../VariableModal';
import { defaultSystemPrompt } from '../../../../constants';
import { filterChatPrompts, parseVariables } from '../../../../utils';

interface Props {
  conversation: IChatConversation;
  onChangePrompt: (prompt: string) => void;
  prompts: IChatPrompt[];
}

const SystemPrompt: React.FC<Props> = ({
  conversation,
  prompts,
  onChangePrompt,
}) => {
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [promptInputValue, setPromptInputValue] = useState('');
  const [showPromptList, setShowPromptList] = useState(false);
  const [value, setValue] = useState<string>('');
  const [variables, setVariables] = useState<string[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const promptListRef = useRef<HTMLUListElement | null>(null);

  const maxLength = useMemo(() => {
    return conversation.model.maxLength ?? null;
  }, [conversation.model.maxLength]);

  const prompt = useMemo(() => {
    return _(conversation.messages)
      .filter((msg) => {
        return msg.role === 'user';
      })
      .last()?.content ?? null;
  }, [conversation.messages]);

  const filteredPrompts = useMemo(() => {
    return filterChatPrompts(prompts, promptInputValue);
  }, [prompts, promptInputValue]);

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
    const value = e.target.value;

    if (value.length > maxLength) {
      alert(`Prompt limit is ${maxLength} characters. You have entered ${value.length} characters.`);
      return;
    }

    setValue(value);
    updatePromptListVisibility(value);

    if (value.length > 0) {
      onChangePrompt(value);
    }
  }, [maxLength, onChangePrompt, updatePromptListVisibility]);

  const handlePromptSelect = useCallback((prompt: IChatPrompt) => {
    const parsedVariables = parseVariables(prompt.content);
    setVariables(parsedVariables);

    if (parsedVariables.length > 0) {
      setIsModalVisible(true);
    } else {
      const updatedContent = value?.replace(/\/\w*$/, prompt.content);

      setValue(updatedContent);
      onChangePrompt(updatedContent);

      updatePromptListVisibility(prompt.content);
    }
  }, [onChangePrompt, updatePromptListVisibility, value]);

  const handleInitModal = useCallback(() => {
    const selectedPrompt = filteredPrompts[activePromptIndex];
    setValue((prevVal) => {
      const newContent = prevVal?.replace(/\/\w*$/, selectedPrompt.content);
      return newContent;
    });
    handlePromptSelect(selectedPrompt);
    setShowPromptList(false);
  }, [activePromptIndex, filteredPrompts, handlePromptSelect]);

  const handleSubmit = useCallback((updatedVariables: string[]) => {
    const newContent = value?.replace(/{{(.*?)}}/g, (match, variable) => {
      const index = variables.indexOf(variable);
      return updatedVariables[index];
    });

    setValue(newContent);
    onChangePrompt(newContent);

    if (textareaRef && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [onChangePrompt, value, variables]);

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
    }
  }, [handleInitModal, prompts.length, showPromptList]);

  useEffect(() => {
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current?.scrollHeight}px`;
    }
  }, [value]);

  useEffect(() => {
    if (prompt) {
      setValue(prompt);
    } else {
      setValue(defaultSystemPrompt);
    }
  }, [conversation, prompt]);

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
    <div className="flex flex-col">
      <label className="mb-2 text-left text-neutral-700 dark:text-neutral-400">
        {'System Prompt'}
      </label>
      <textarea
        ref={textareaRef}
        className="w-full rounded-lg border border-neutral-200 bg-transparent px-4 py-3 text-neutral-900 dark:border-neutral-600 dark:text-neutral-100"
        style={{
          resize: 'none',
          bottom: `${textareaRef?.current?.scrollHeight}px`,
          maxHeight: '300px',
          overflow: `${textareaRef.current && textareaRef.current.scrollHeight > 400
            ? 'auto'
            : 'hidden'
            }`,
        }}
        placeholder={
          `Enter a prompt or type "/" to select a prompt...`
        }
        value={value}
        rows={1}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />

      {showPromptList && filteredPrompts.length > 0 && (
        <div>
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
          prompt={prompts[activePromptIndex]}
          variables={variables}
          onSubmit={handleSubmit}
          onClose={() => setIsModalVisible(false)}
        />
      )}
    </div>
  );
};

export default SystemPrompt;
