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

interface ISidebarActionButtonProps {
  children: React.ReactElement;
  handleClick: React.MouseEventHandler<HTMLButtonElement>;
}

const SidebarActionButton = ({ handleClick, children }: ISidebarActionButtonProps) => (
  <button
    className="min-w-[20px] p-1 text-neutral-400 hover:text-neutral-100"
    onClick={handleClick}
  >
    {children}
  </button>
);

export default SidebarActionButton;
