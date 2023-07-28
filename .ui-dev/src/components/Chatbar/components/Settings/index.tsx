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
import React, { useCallback, useMemo, useRef } from 'react';
import { IconFileExport, IconFileImport } from '@tabler/icons-react';

// internal imports
import SidebarButton from '../../../SidebarButton';
import useCurrentSettings from '../../../../hooks/useCurrentSettings';
import { downloadBlob, loadBlob } from '../../../../utils';
import { ISettings } from '../../../../types';

// Day.js
import dayjs from 'dayjs';
import dayjs_timezone from 'dayjs/plugin/timezone';
import dayjs_utc from 'dayjs/plugin/utc';

dayjs.extend(dayjs_timezone);
dayjs.extend(dayjs_utc);

interface ISettingsProps {
  onSettingsUpdate: (newData: ISettings) => void;
}

const Settings: React.FC<ISettingsProps> = ({
  onSettingsUpdate
}) => {
  const fileInput = useRef<HTMLInputElement>(null);

  const settings = useCurrentSettings();

  const hasEnoughData = useMemo(() => {
    return !!settings?.conversationItems &&
      !!settings.promptItems;
  }, [settings?.conversationItems, settings?.promptItems]);

  const importFiles = useCallback(async (files: File[]) => {
    const newSettings: ISettings = {
      ...(settings ?? {
        conversationItems: [],
        promptItems: []
      }),
    };

    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];

        const importedSettings: ISettings = JSON.parse(
          await loadBlob(file, 'text')
        );

        if (Array.isArray(importedSettings?.conversationItems)) {
          newSettings.conversationItems = [
            ...(newSettings.conversationItems ?? []),
            ...importedSettings.conversationItems.filter((c) => !!c),
          ];
        }

        if (Array.isArray(importedSettings?.promptItems)) {
          newSettings.promptItems = [
            ...(newSettings.promptItems ?? []),
            ...importedSettings.promptItems.filter((c) => !!c),
          ];
        }
      } catch (error) {
        console.error('[ERROR]', `Settings.importFiles(${i})`, error)
      }
    }

    onSettingsUpdate(newSettings);
  }, [onSettingsUpdate, settings]);

  const exportSettings = useCallback(async () => {
    const now = dayjs.utc();

    const jsonStr = JSON.stringify(settings, null, 2);
    const jsonBlob = new Blob([jsonStr], {
      type: 'application/json'
    });

    const fileName = `egpt_export_${now.format('YYYYMMDD-HHmmss')}.json`;

    await downloadBlob(jsonBlob, fileName);
  }, [settings]);

  const handleImport = useCallback(() => {
    if (!hasEnoughData) {
      return;
    }

    fileInput.current?.click();
  }, [hasEnoughData]);

  const handleExport = useCallback(() => {
    if (!hasEnoughData) {
      return;
    }

    exportSettings();
  }, [exportSettings, hasEnoughData]);

  const handleOnChange = useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = [];

    const fileList = fileInput?.current?.files;
    if (fileList) {
      for (let i = 0; i < fileList.length; i++) {
        files.push(fileList.item(i) as File);
      }
    }

    if (fileInput.current) {
      // reset
      fileInput.current.value = "";
    }

    if (files.length) {
      importFiles(files);
    }
  }, [importFiles]);

  return (
    <div className="flex flex-col items-center space-y-1 border-t border-white/20 pt-1 text-sm">
      <SidebarButton
        disabled={!hasEnoughData}
        text={'Import'}
        icon={<IconFileImport size={18} />}
        onClick={handleImport}
      />

      <SidebarButton
        disabled={!hasEnoughData}
        text={'Export data'}
        icon={<IconFileExport size={18} />}
        onClick={handleExport}
      />

      <input
        type="file"
        ref={fileInput}
        accept={'application/json, text/json, application/x-json'}
        onChange={handleOnChange}
        multiple
        style={{
          width: 1,
          height: 1,
          display: 'hidden',
        }}
      />
    </div>
  );
};

export default Settings;
