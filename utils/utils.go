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
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"runtime"
	"strings"
)

type OAuth2TokenResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
	TokenType   string `json:"token_type"`
}

func GetAccessToken() (OAuth2TokenResponse, error) {
	var tokenResponse OAuth2TokenResponse

	response, err := getAccessTokenHttpResponse()
	if err != nil {
		return tokenResponse, err
	}

	defer response.Body.Close()

	if response.StatusCode == 200 {
		bodyData, err := io.ReadAll(response.Body)
		if err != nil {
			return tokenResponse, err
		}

		err = json.Unmarshal(bodyData, &tokenResponse) // try parse as JSON

		return tokenResponse, err
	} else {
		errorMessage := getResponseErrorMessage("The credentials do not work:", response)

		return tokenResponse, errors.New(errorMessage)
	}
}

func getAccessTokenHttpRequest() (*http.Request, *[]byte, error) {
	clientId := strings.TrimSpace(os.Getenv("CHAT_API_CLIENT_ID"))
	clientSecret := strings.TrimSpace(os.Getenv("CHAT_API_CLIENT_SECRET"))
	getApiTokenUrl := strings.TrimSpace(os.Getenv("OAUTH2_GET_TOKEN_URL"))

	// build POST body
	body := url.Values{}
	body.Add("grant_type", "client_credentials")
	body.Add("client_id", clientId)
	body.Add("client_secret", clientSecret)

	bodyStr := body.Encode()

	request, err := http.NewRequest("POST", getApiTokenUrl, bytes.NewBufferString(bodyStr))
	if err != nil {
		return nil, nil, err
	}

	bodyData := []byte(bodyStr)

	return request, &bodyData, nil
}

func getAccessTokenHttpResponse() (*http.Response, error) {
	request, _, err := getAccessTokenHttpRequest()
	if err != nil {
		return nil, err
	}

	httpClient := &http.Client{}

	return httpClient.Do(request)
}

func getResponseErrorMessage(message string, response *http.Response) string {
	errorMessage := ""

	if response != nil {
		errorMessage = fmt.Sprint(message, response.StatusCode)

		appendToErrorMessage := func(txt string) {
			errorMessage += "\n\n" + txt
		}

		bodyData, err := io.ReadAll(response.Body)

		if err == nil {
			if len(bodyData) > 0 {
				appendBodyData := func() {
					appendToErrorMessage(string(bodyData))
				}

				var temp interface{}
				err = json.Unmarshal(bodyData, &temp) // try parse as JSON
				if err != nil {
					appendBodyData() // append unformatted string on error
				} else {
					jsonData, err := json.MarshalIndent(temp, "", "  ")
					if err != nil {
						appendBodyData() // append unformatted string on error
					} else {
						appendToErrorMessage(string(jsonData))
					}
				}
			}
		}
	}

	return errorMessage
}

func GetOperatingSystemName() string {
	switch os := runtime.GOOS; os {
	case "darwin":
		return "macOS"
	case "freebsd":
		return "FreeBSD"
	case "linux":
		return "Linux"
	case "windows":
		return "Windows"
	case "android":
		return "Android"
	case "ios":
		return "iOS"
	case "dragonfly":
		return "DragonFly BSD"
	case "netbsd":
		return "NetBSD"
	case "openbsd":
		return "OpenBSD"
	case "plan9":
		return "Plan 9"
	case "solaris":
		return "Solaris"
	default:
		return "Unknown"
	}
}
