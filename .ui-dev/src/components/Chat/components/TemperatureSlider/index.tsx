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
import React, { useCallback, useEffect, useState } from 'react';

// internal imports
import useAppContext from '../../../../hooks/useAppContext';
import { defaultTemperature } from '../../../../constants';

interface ITemperatureSliderProps {
  disabled?: boolean;
  label: React.ReactNode;
  onTemperatureChange: (temperature: number) => void;
}

const TemperatureSlider: React.FC<ITemperatureSliderProps> = ({
  label,
  onTemperatureChange,
}) => {
  const {
    selectedConversation
  } = useAppContext();

  const [temperature, setTemperature] = useState<number>(defaultTemperature);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value.trim());

    setTemperature(newValue);
    onTemperatureChange(newValue);
  }, [onTemperatureChange]);

  useEffect(() => {
    setTemperature(selectedConversation?.temperature ?? defaultTemperature)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col">
      <label className="mb-2 text-left text-neutral-700 dark:text-neutral-400">
        {label}
      </label>
      <span className="text-[12px] text-black/50 dark:text-white/50 text-sm">
        {'Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.'}
      </span>
      <span className="mt-2 mb-1 text-center text-neutral-900 dark:text-neutral-100">
        {temperature.toFixed(1)}
      </span>
      <input
        className="cursor-pointer"
        type="range"
        min={0}
        max={2}
        step={0.1}
        value={temperature}
        onChange={handleChange}
      />
    </div>
  );
};

export default TemperatureSlider;
