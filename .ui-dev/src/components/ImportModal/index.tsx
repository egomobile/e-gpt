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
import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Nullable } from '@egomobile/types';

// internal imports
import { loadBlob, tryGetHtmlContent } from '../../utils';

interface IImportModalProps {
  onClose: (content: Nullable<string>) => void;
}

const ImportModal: React.FC<IImportModalProps> = ({ onClose }) => {
  const [content, setContent] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [url, setUrl] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = useCallback(async () => {
    if (!url.trim()) {
      return;
    }

    setIsDownloading(true);

    let downloadUrl = url.trim();
    if (!downloadUrl.startsWith('http')) {
      downloadUrl = `https://${downloadUrl}`;
    }

    try {
      const {
        data, status
      } = await axios.get('download', {
        params: {
          'u': downloadUrl
        },
        responseType: 'blob'
      });

      if (status >= 400 && status < 500) {
        throw new Error(`Unknown client error ${status}`);
      }
      if (status >= 500) {
        throw new Error(`Unknown server error ${status}`);
      }

      const html = await loadBlob(data, 'text');

      setContent(
        tryGetHtmlContent(html)
      );
    } catch (e) {
      alert(`Could not download from '${downloadUrl}': ${e}`);
    } finally {
      setIsDownloading(false);
    }
  }, [url]);

  useEffect(() => {
    urlInputRef.current?.focus();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    >
      <div className="fixed inset-0 z-10 overflow-hidden">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="hidden sm:inline-block sm:h-screen sm:align-middle"
            aria-hidden="true"
          />

          <div
            ref={modalRef}
            className="dark:border-netural-400 inline-block max-h-[400px] transform overflow-y-auto rounded-lg border border-gray-300 bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all dark:bg-[#202123] sm:my-8 sm:max-h-[600px] sm:w-full sm:max-w-lg sm:p-6 sm:align-middle"
            role="dialog"
          >
            <div className="text-sm font-bold text-black dark:text-neutral-200">
              {'Source / URL'}
            </div>
            <input
              className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#40414F] dark:text-neutral-100"
              style={{ resize: 'none' }}
              placeholder={''}
              type='text'
              value={url}
              ref={urlInputRef}
              onChange={(e) => {
                setUrl(e.target.value);
              }}
            />

            <div className="w-full flex">
              <button
                disabled={isDownloading || !url.trim()}
                type="button"
                className="w-full flex-1 px-4 py-2 mt-3 mb-4 border rounded-lg shadow border-neutral-500 text-neutral-900 hover:bg-neutral-100 focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-300"
                onClick={handleDownload}
              >
                {'Download'}
              </button>
            </div>

            <div className="mt-2 text-sm font-bold text-black dark:text-neutral-200">
              {'Content to import'}
            </div>
            <textarea
              className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#40414F] dark:text-neutral-100"
              style={{ resize: 'none' }}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
              }}
              rows={10}
            />

            <div className="w-full flex">
              <button
                disabled={isDownloading || !content.trim()}
                type="button"
                className="w-full flex-1 px-4 py-2 mt-6 mr-3 border rounded-lg shadow border-neutral-500 text-neutral-900 hover:bg-neutral-100 focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-300"
                onClick={() => {
                  if (content.trim().length) {
                    onClose(content);
                  }
                }}
              >
                {'Import'}
              </button>

              <button
                type="button"
                disabled={isDownloading}
                className="w-full flex-1 px-4 py-2 mt-6 ml-3 border rounded-lg shadow border-neutral-500 text-neutral-900 hover:bg-neutral-100 focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-300"
                onClick={() => {
                  onClose(null);
                }}
              >
                {'Cancel'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
