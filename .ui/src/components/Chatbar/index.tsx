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
import React, { useCallback, useState } from 'react';

// internal imports
import Sidebar from '../Sidebar';

const Chatbar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleDrop = useCallback((e: any) => {
    console.log('Chatbar.handleDrop');
  }, []);

  const handleCreateFolder = useCallback(() => {
    console.log('Chatbar.handleCreateFolder');
  }, []);

  const handleToggleChatbar = useCallback(() => {
    console.log('Chatbar.handleToggleChatbar');
  }, []);

  const handleCreateItem = useCallback(() => {
    console.log('Chatbar.handleCreateItem');
  }, []);

  const handleSearchTerm = useCallback((searchTerm: string) => {
    console.log('Chatbar.handleSearchTerm', searchTerm);
  }, []);

  return (
    <>
      <Sidebar
        side={'left'}
        isOpen
        addItemButtonTitle={'New chat'}
        itemComponent={null}
        folderComponent={null}
        items={[]}
        searchTerm={''}
        handleSearchTerm={handleSearchTerm}
        toggleOpen={handleToggleChatbar}
        handleCreateItem={handleCreateItem}
        handleCreateFolder={handleCreateFolder}
        handleDrop={handleDrop}
        footerComponent={null}
      />
    </>
  );
};

export default Chatbar;
