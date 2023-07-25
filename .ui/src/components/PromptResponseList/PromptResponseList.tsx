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

import React, { FC, useEffect, useRef } from 'react';
import ChatGptImg from '../../img/ego.png';
import MyImg from '../../img/me.png';
import ReactMarkdown from 'react-markdown';
import { ResponseInterface } from "./response-interface";
import hljs from 'highlight.js';
import './PromptResponseList.scss';

interface PromptResponseListProps {
  responseList: ResponseInterface[];
}

const PromptResponseList: FC<PromptResponseListProps> = ({ responseList }) => {
  const responseListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hljs.highlightAll();
  })

  useEffect(() => {
    const lastItemIndex = responseList.length - 1;
    const lastItem = responseList[lastItemIndex];
    if (lastItem) {
      const id = `ego-${lastItem.id}-${lastItemIndex}`;

      const element = document.getElementById(id);
      if (typeof element?.scrollIntoView === 'function') {
        element.scrollIntoView();
      }
    }

    hljs.highlightAll();
  }, [responseList]);

  return (
    <div className="prompt-response-list" ref={responseListRef}>
      {responseList.map((responseData, responseDataIndex) => (
        <div
          className={"response-container " + (responseData.selfFlag ? 'my-question' : 'chatgpt-response')}
          key={responseData.id}
          id={`ego-${responseData.id}-${responseDataIndex}`}
        >
          <img className="avatar-image" src={responseData.selfFlag ? MyImg : ChatGptImg} alt="avatar" />
          <div className={(responseData.error ? 'error-response ' : '') + "prompt-content"} id={responseData.id}>
            {responseData.image &&
              <img src={responseData.image} className="ai-image" alt="generated ai" />
            }
            {responseData.response &&
              <ReactMarkdown
                children={responseData.response ?? ''}
                components={{
                  code({ className, children }) {
                    return (
                      <code className={className}>
                        {children}
                      </code>
                    )
                  }
                }}
              />
            }
          </div>
        </div>
      ))}
    </div>
  );
};

export default PromptResponseList;
