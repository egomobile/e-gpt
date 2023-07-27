/**
 * This file is part of the e.GPT distribution.
 * Copyright (c) Next.e.GO Mobile SE, Aachen, Germany (https://e-go-mobile.com/)
 *
 * e-gpt is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, version 3.
 *
 * e-gpt is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public License.
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

// system imports
import { IconArrowBarLeft, IconArrowBarRight } from '@tabler/icons-react';

interface IOpenSidebarButtonProps {
  onClick: any;
  side: 'left' | 'right';
}

const OpenSidebarButton = ({ onClick, side }: IOpenSidebarButtonProps) => {
  return (
    <button
      className={`fixed top-2.5 ${side === 'right' ? 'right-2' : 'left-2'
        } z-50 h-7 w-7 text-white hover:text-gray-400 dark:text-white dark:hover:text-gray-300 sm:top-0.5 sm:${side === 'right' ? 'right-2' : 'left-2'
        } sm:h-8 sm:w-8 sm:text-neutral-700`}
      onClick={onClick}
    >
      {side === 'right' ? <IconArrowBarLeft /> : <IconArrowBarRight />}
    </button>
  );
};

export default OpenSidebarButton;
