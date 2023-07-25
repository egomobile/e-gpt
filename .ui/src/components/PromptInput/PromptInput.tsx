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

import { useEffect, useRef, useCallback } from 'react';
import ContentEditable from 'react-contenteditable';
import './PromptInput.scss';

interface PromptInputProps {
  disabled?: boolean;
  prompt: string;
  onSubmit: () => void;
  updatePrompt: (prompt: string) => void;
}

const PromptInput: React.FC<PromptInputProps> = ({ disabled, prompt, onSubmit, updatePrompt }) => {
  const checkKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.ctrlKey || e.shiftKey) {
        document.execCommand('insertHTML', false, '<br/><br/>');
      } else {
        onSubmit();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  const contentEditableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.addEventListener("keydown", checkKeyPress);
    return () => {
      window.removeEventListener("keydown", checkKeyPress);
    };
  }, [checkKeyPress]);

  return (
    <ContentEditable
      innerRef={contentEditableRef}
      html={prompt}
      disabled={disabled}
      id="prompt-input"
      className="prompt-input"
      onChange={(event) => updatePrompt(event.target.value)}
    />
  );
};

export default PromptInput;
