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
import Prompt from '../Prompt';
import { IChatPrompt } from '../../types';

interface IPromptsProps {
  onClick: (prompt: IChatPrompt) => void;
  onDelete: (prompt: IChatPrompt) => void;
  onUpdate: (newData: IChatPrompt) => void;
  prompts: IChatPrompt[];
}

const Prompts: React.FC<IPromptsProps> = ({
  onClick,
  onDelete,
  onUpdate,
  prompts
}) => {
  return (
    <div className="flex w-full flex-col gap-1">
      {prompts
        .slice()
        .reverse()
        .map((prompt, index) => (
          <Prompt
            key={index}
            prompt={prompt}
            onClick={() => onClick(prompt)}
            onDelete={() => onDelete(prompt)}
            onUpdate={onUpdate}
          />
        ))}
    </div>
  );
};

export default Prompts;
