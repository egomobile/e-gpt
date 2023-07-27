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

// internal imports
import type { IChatPrompt } from '../../../../types';

interface IPromptListProps {
  activePromptIndex: number;
  prompts: IChatPrompt[];
  onMouseOver: (index: number) => void;
  onSelect: () => void;
  promptListRef: React.MutableRefObject<HTMLUListElement | null>;
}

const PromptList: React.FC<IPromptListProps> = ({
  activePromptIndex,
  onSelect,
  onMouseOver,
  promptListRef,
  prompts,
}) => {
  return (
    <ul
      ref={promptListRef}
      className="z-10 max-h-52 w-full overflow-scroll rounded border border-black/10 bg-white shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:border-neutral-500 dark:bg-[#343541] dark:text-white dark:shadow-[0_0_15px_rgba(0,0,0,0.10)]"
    >
      {prompts.map((prompt, index) => (
        <li
          key={prompt.id}
          className={`${index === activePromptIndex
            ? 'bg-gray-200 dark:bg-[#202123] dark:text-black'
            : ''
            } cursor-pointer px-3 py-2 text-sm text-black dark:text-white`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect();
          }}
          onMouseEnter={() => onMouseOver(index)}
        >
          {prompt.title}
        </li>
      ))}
    </ul>
  );
};

export default PromptList;
