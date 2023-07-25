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

import axios from "axios";
import React, { useEffect, useState } from 'react';
import PromptInput from "../PromptInput/PromptInput";
import PromptResponseList from "../PromptResponseList/PromptResponseList";
import { ResponseInterface } from "../PromptResponseList/response-interface";

import './App.scss';

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function htmlToText(html: string) {
  const temp = document.createElement('div');
  temp.innerHTML = html;

  return temp.textContent;
}

function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timestamp}-${hexadecimalString}`;
}

function resetLoader(uid: string) {
  const element = document.getElementById(uid) as HTMLElement;
  if (!element) {
    return;
  }

  element.textContent = '';
}

const App = () => {
  const [conversation, setConversation] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [promptToRetry, setPromptToRetry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [responseList, setResponseList] = useState<ResponseInterface[]>([]);
  const [uniqueIdToRetry, setUniqueIdToRetry] = useState<string | null>(null);

  let loadInterval: NodeJS.Timer | undefined;

  const addLoader = (uid: string) => {
    const element = document.getElementById(uid) as HTMLElement;
    if (!element) {
      return;
    }

    element.textContent = '';

    loadInterval = setInterval(() => {
      // Update the text content of the loading indicator
      element.textContent += '.';

      // If the loading indicator has reached three dots, reset it
      if (element.textContent === '....') {
        element.textContent = '';
      }
    }, 300);
  };

  const addResponse = (selfFlag: boolean, response?: string) => {
    const uid = generateUniqueId();

    setResponseList(prevResponses => [
      ...prevResponses,
      {
        id: uid,
        response,
        selfFlag
      },
    ]);

    return uid;
  };

  const updateResponse = (uid: string, updatedObject: Record<string, unknown>) => {
    setResponseList(prevResponses => {
      const updatedList = [...prevResponses];

      const index = prevResponses.findIndex((response) => response.id === uid);
      if (index > -1) {
        updatedList[index] = {
          ...updatedList[index],
          ...updatedObject
        };
      }

      return updatedList;
    });
  };

  const updateConversation = (prompt: string, answer: string) => {
    setConversation((prevConversation) => {
      let updatedList = [...prevConversation];

      updatedList.push(prompt, answer)

      if (updatedList.length > 40) {
        updatedList = updatedList.slice(2);
      }

      return updatedList;
    });
  };

  const getGPTResult = async (_promptToRetry?: string | null, _uniqueIdToRetry?: string | null) => {
    // Get the prompt input
    const _prompt = _promptToRetry ?? htmlToText(prompt);

    // If a response is already being generated or the prompt is empty, return
    if (isLoading || !_prompt) {
      return;
    }

    setIsLoading(true);

    // Clear the prompt input
    setPrompt('');

    let uniqueId: string;
    if (_uniqueIdToRetry) {
      uniqueId = _uniqueIdToRetry;
    } else {
      // Add the self prompt to the response list
      addResponse(true, _prompt);
      uniqueId = addResponse(false);
      await delay(50);
      addLoader(uniqueId);
    }

    try {
      // Send a POST request to the API with the prompt in the request body
      const response = await axios.post('chat', {
        conversation: [...conversation, _prompt],
      });

      if (response.status !== 200) {
        throw new Error(`Unexpected response: ${response.status}`);
      }

      const answer = response.data.answer.trim();
      updateConversation(_prompt, answer);

      updateResponse(uniqueId, {
        response: answer,
      });

      setPromptToRetry(null);
      setUniqueIdToRetry(null);
    } catch (err: any) {
      setPromptToRetry(_prompt);
      setUniqueIdToRetry(uniqueId);

      updateResponse(uniqueId, {
        response: `Error: ${err.message}`,
        error: true
      });
    } finally {
      // Clear the loader interval
      clearInterval(loadInterval);

      setIsLoading(false);
      resetLoader(uniqueId);
    }
  };

  const regenerateResponse = async () => {
    await getGPTResult(promptToRetry, uniqueIdToRetry);
  };

  useEffect(() => {
    const element = document.getElementById('prompt-input');
    if (element) {
      element.focus();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="App">
      <div id="response-list">
        <PromptResponseList responseList={responseList} key="response-list" />
      </div>
      {uniqueIdToRetry &&
        (<div id="regenerate-button-container">
          <button id="regenerate-response-button" className={isLoading ? 'loading' : ''} onClick={() => regenerateResponse()}>
            Regenerate Response
          </button>
        </div>
        )
      }
      <div id="input-container">
        <PromptInput
          prompt={prompt}
          onSubmit={() => getGPTResult()}
          key="prompt-input"
          updatePrompt={(prompt) => setPrompt(prompt)}
        />
        <button id="submit-button" className={isLoading ? 'loading' : ''} onClick={() => getGPTResult()}></button>
      </div>
    </div>
  );
}

export default App;
