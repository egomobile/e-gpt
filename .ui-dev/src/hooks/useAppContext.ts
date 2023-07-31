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
import { useContext, useMemo } from "react";

// internal imports
import AppContext from "../contexts/AppContext";
import type { IAppContext } from "../types";

function useAppContext(): IAppContext {
  const value = useContext(AppContext);

  return useMemo(() => {
    return {
      apiKeySettings: value.apiKeySettings || null,
      selectedConversation: value.selectedConversation || null,
      settings: value.settings,
    };
  }, [value.apiKeySettings, value.selectedConversation, value.settings]);
}

export default useAppContext;
