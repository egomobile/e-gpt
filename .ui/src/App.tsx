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
import Chat from './components/Chat';
import Chatbar from './components/Chatbar';
import Promptbar from './components/Promptbar';

// styles
import './App.css';

const App: React.FC = () => {
  return (
    <>
      <div
        className={`flex h-screen w-screen flex-col text-sm text-white dark:text-white dark`}
      >
        <div className="flex h-full w-full pt-[48px] sm:pt-0">
          <Chatbar />

          <div className="flex flex-1">
            <Chat />
          </div>

          <Promptbar />
        </div>
      </div>
    </>
  );
};

export default App;
