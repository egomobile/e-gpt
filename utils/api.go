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

package utils

import (
	"os"
	"strings"
)

// GetApiAccessType returns the type of API access to be used.
// It checks if OpenAI API Key is provided in environment variable OPENAI_API_KEY,
// if not, it checks if Chat API Client ID is provided in environment variable CHAT_API_CLIENT_ID.
// If Chat API Client ID is provided, it further checks if Chat API URL and Key are provided.
// If Chat API URL and Key are provided, it returns "proxy_api_key".
// If Chat API URL and Key are not provided, it gets the access token using GetAccessToken and returns "proxy_oauth2".
// If none of the above are provided, it returns an empty string and no error.
func GetApiAccessType() (string, error) {
	openaiApiKey := strings.TrimSpace(os.Getenv("OPENAI_API_KEY"))
	if openaiApiKey != "" {
		return "openai_key", nil
	}

	clientId := strings.TrimSpace(os.Getenv("CHAT_API_CLIENT_ID"))
	if clientId != "" {
		apiUrl := strings.TrimSpace(os.Getenv("CHAT_API_URL"))
		if apiUrl != "" {
			apiKey := strings.TrimSpace(os.Getenv("CHAT_API_KEY"))
			if apiKey != "" {
				return "proxy_api_key", nil
			}

			_, err := GetAccessToken()
			if err != nil {
				return "", err
			}

			return "proxy_oauth2", nil
		}
	}

	return "", nil
}
