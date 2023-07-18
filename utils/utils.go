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
	"os/exec"
	"path"
	"path/filepath"
	"runtime"
	"strings"
)

type OAuth2TokenResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
	TokenType   string `json:"token_type"`
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

func ExecuteCommand(rawCommand string) (*exec.Cmd, error) {
	shellName := GetShellName()

	var shellPath string
	var shellArgs []string
	if strings.Contains(shellName, "Power") {
		shellPath = "powershell"
		shellArgs = append(shellArgs, "-Command", "Get-Process")
	} else if strings.Contains(shellName, "cmd") {
		shellPath = "cmd"
		shellArgs = append(shellArgs, "/c")
	} else if strings.HasSuffix(shellName, "shell") {
		shellPath = strings.TrimSpace(os.Getenv("SHELL"))
		shellArgs = append(shellArgs, "-c")
	}

	if shellPath == "" {
		return nil, fmt.Errorf("shell %v not supported", shellName)
	}

	shellArgs = append(shellArgs, rawCommand)

	cmd := exec.Command(shellPath, shellArgs...)

	cmd.Stderr = os.Stderr
	cmd.Stdout = os.Stdout
	cmd.Stdin = os.Stdin

	err := cmd.Start()
	if err != nil {
		return cmd, err
	}

	err = cmd.Wait()
	if err != nil {
		return cmd, err
	}

	return cmd, nil
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

func GetAndCheckInput(args []string, openEditor bool) string {
	input, err := GetInput(args, openEditor)
	if err != nil {
		panic(err)
	}

	input = strings.TrimSpace(input)
	if input == "" {
		panic(errors.New("no valid input"))
	}

	return input
}

func GetInput(args []string, openEditor bool) (string, error) {
	result := ""

	if openEditor {
		tmpFile, err := os.CreateTemp("", "egpt")
		if err != nil {
			return "", err
		}

		tmpFile.Close()

		tmpFilePath, err := filepath.Abs(tmpFile.Name())
		if err != nil {
			return "", err
		}

		editorPath, editorArgs := TryGetBestOpenEditorCommand(tmpFilePath)
		if editorPath == "" {
			return "", errors.New("no matching editor found")
		}

		defer os.Remove(tmpFilePath)

		cmd := exec.Command(editorPath, editorArgs...)

		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		cmd.Dir = path.Dir(tmpFilePath)

		cmd.Run()

		tmpData, err := os.ReadFile(tmpFilePath)
		if err != nil {
			return "", err
		}

		result += string(tmpData)
	}

	fi, _ := os.Stdin.Stat()
	if (fi.Mode() & os.ModeNamedPipe) == 0 {
		//
	} else {
		data, err := io.ReadAll(os.Stdin)
		if err != nil {
			return "", err
		}

		result += string(data)
	}

	result += strings.Join(args, " ")

	return result, nil
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

func GetShellName() string {
	osName := runtime.GOOS

	if osName == "windows" {
		psVer := os.Getenv("PowershellVersion")
		if psVer != "" {
			return "PowerShell"
		}

		comspec := os.Getenv("COMSPEC")
		if strings.Contains(strings.ToLower(comspec), "cmd.exe") {
			return "Windows Command Processor (cmd.exe)"
		}
	}

	psPath := os.Getenv("PSModulePath")
	if psPath != "" {
		return "PowerShell"
	}

	shell := strings.TrimSpace(os.Getenv("SHELL"))
	if shell != "" {
		if strings.HasSuffix(shell, "/zsh") {
			return "Z shell"
		}

		if strings.HasSuffix(shell, "/bash") {
			return "Bourne-again shell"
		}
	}

	return "Unknown"
}

func TryGetBestOpenEditorCommand(filePath string) (string, []string) {
	osName := runtime.GOOS

	if osName == "windows" {
		return "notepad.exe", []string{filePath}
	}

	viPath := TryGetExecutablePath("vi")
	if viPath != "" {
		return viPath, []string{"-c", "startinsert", filePath}
	}

	nanoPath := TryGetExecutablePath("nano")
	if nanoPath != "" {
		return nanoPath, []string{filePath}
	}

	return "", []string{}
}

func TryGetExecutablePath(command string) string {
	exePath, err := exec.LookPath(command)

	if err != nil {
		return ""
	}

	return exePath
}
