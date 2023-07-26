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

const Promptbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDrop = useCallback((e: any) => {
    console.log('Promptbar.handleDrop');
  }, []);

  const handleCreateFolder = useCallback(() => {
    console.log('Promptbar.handleCreateFolder');
  }, []);

  const handleTogglePromptbar = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const handleCreatePrompt = useCallback(() => {
    console.log('Promptbar.handleCreateItem');
  }, []);

  const handleSearchTerm = useCallback((searchTerm: string) => {
    setSearchTerm(searchTerm);
  }, []);

  return (
    <>
      <Sidebar
        side={'right'}
        isOpen={isOpen}
        addItemButtonTitle={'New prompt'}
        itemComponent={null}
        folderComponent={null}
        items={[]}
        searchTerm={searchTerm}
        handleSearchTerm={handleSearchTerm}
        toggleOpen={handleTogglePromptbar}
        handleCreateItem={handleCreatePrompt}
        handleCreateFolder={handleCreateFolder}
        handleDrop={handleDrop}
      />
    </>
  );
};

export default Promptbar;
