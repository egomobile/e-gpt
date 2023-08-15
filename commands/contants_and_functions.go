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

package commands

import (
	"os"
	"strconv"
	"strings"
)

const defaultLanguage = "english"
const defaultProgrammingLanguage = "typescript"

func getDefaultTemperature() float64 {
	chatApiTemperature := strings.TrimSpace(os.Getenv("CHAT_API_TEMPERATURE"))
	if chatApiTemperature != "" {
		val, err := strconv.ParseFloat(chatApiTemperature, 64)
		if err == nil {
			if val >= 0 && val <= 2 {
				return val
			}
		}
	}

	return 0.7
}

func getLanguage(language string) string {
	lang := strings.TrimSpace(
		strings.ToLower(language),
	)
	if lang == "" {
		lang = defaultLanguage
	}

	return lang
}

func getProgrammingLanguage(language string) string {
	programmingLanguage := strings.TrimSpace(
		strings.ToLower(language),
	)
	if programmingLanguage == "" {
		programmingLanguage = defaultProgrammingLanguage
	}

	return programmingLanguage
}
