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
import React, { useCallback, useEffect, useRef, useState } from 'react';

// internal imports
import { IChatPrompt, IVariable, VariableInputType } from '../../../../types';

interface IVariableInt {
  description: string;
  key: string;
  type: VariableInputType;
  value: string;
}

interface IVariableModalProps {
  prompt: IChatPrompt;
  variables: IVariable[];
  onSubmit: (updatedVariables: string[]) => void;
  onClose: () => void;
}

const VariableModal: React.FC<IVariableModalProps> = ({
  prompt,
  variables,
  onSubmit,
  onClose,
}) => {
  const [updatedVariables, setUpdatedVariables] = useState<IVariableInt[]>(
    variables
      .map((variable) => ({
        description: variable.description,
        key: variable.name,
        type: variable.type,
        value: '',
      }))
      .filter(
        (item, index, array) =>
          array.findIndex((t) => t.key === item.key) === index,
      ),
  );

  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback((index: number, value: string) => {
    setUpdatedVariables((prev) => {
      const updated = [...prev];
      updated[index].value = value;

      return updated;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    if (updatedVariables.some((variable) => variable.value === '')) {
      alert('Please fill out all variables');
      return;
    }

    onSubmit(updatedVariables.map((variable) => variable.value));
    onClose();
  }, [onClose, onSubmit, updatedVariables]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [handleSubmit, onClose]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('click', handleOutsideClick);

    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, [onClose]);

  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onKeyDown={handleKeyDown}
    >
      <div
        ref={modalRef}
        className="dark:border-netural-400 inline-block max-h-[400px] transform overflow-y-auto rounded-lg border border-gray-300 bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all dark:bg-[#202123] sm:my-8 sm:max-h-[600px] sm:w-full sm:max-w-lg sm:p-6 sm:align-middle"
        role="dialog"
      >
        <div className="mb-4 text-xl font-bold text-black dark:text-neutral-200">
          {prompt.title}
        </div>

        <div className="mb-4 text-sm italic text-black dark:text-neutral-200">
          {prompt.description}
        </div>

        {updatedVariables.map((variable, variableIndex) => {
          const placeholder = variable.description.trim();

          let inputComponent: React.ReactNode;
          if (variable.type === VariableInputType.List) {
            // items are separated by comma(s)
            const items = variable.description
              .split(',')
              .filter((item) => {
                return item.trim().length > 0;  // no empty
              });

            inputComponent = (
              <select
                className="mt-1 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#40414F] dark:text-neutral-100"
                onChange={(e) => handleChange(variableIndex, e.target.value)}
                value={variable.value}
              >
                <option value="">Please select a value ...</option>
                {items.map((item, itemIndex) => {
                  return (
                    <option
                      key={`variable-list-item-${variable.key}-${itemIndex}`}
                      value={item}
                    >{item}</option>
                  );
                })}
              </select>
            );
          } else {
            inputComponent = (
              <textarea
                ref={variableIndex === 0 ? nameInputRef : undefined}
                className="mt-1 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#40414F] dark:text-neutral-100"
                style={{ resize: 'none' }}
                placeholder={placeholder}
                value={variable.value}
                onChange={(e) => handleChange(variableIndex, e.target.value)}
                rows={3}
              />
            );
          }

          return (
            <div className="mb-4" key={variableIndex}>
              <div className="mb-2 text-sm font-bold text-neutral-200">
                {variable.key}
              </div>

              {inputComponent}
            </div>
          );
        })}

        <button
          className="mt-6 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow hover:bg-neutral-100 focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-300"
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default VariableModal;
