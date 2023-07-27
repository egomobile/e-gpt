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

interface ICloseSidebarButtonProps {
  onClick: any;
  side: 'left' | 'right';
}

const CloseSidebarButton = ({ onClick, side }: ICloseSidebarButtonProps) => {
  return (
    <>
      <button
        className={`fixed top-5 ${side === 'right' ? 'right-[270px]' : 'left-[270px]'
          } z-50 h-7 w-7 hover:text-gray-400 dark:text-white dark:hover:text-gray-300 sm:top-0.5 sm:${side === 'right' ? 'right-[270px]' : 'left-[270px]'
          } sm:h-8 sm:w-8 sm:text-neutral-700`}
        onClick={onClick}
      >
        {side === 'right' ? <IconArrowBarRight /> : <IconArrowBarLeft />}
      </button>
      <div
        onClick={onClick}
        className="absolute top-0 left-0 z-10 h-full w-full bg-black opacity-70 sm:hidden"
      ></div>
    </>
  );
};

export default CloseSidebarButton;
