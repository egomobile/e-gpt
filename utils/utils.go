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
	"bufio"
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

// EnsureDir checks if a directory exists at the given path. If it doesn't exist, it creates a directory with the given path.
// The function returns the directory path and an error, if any.
func EnsureDir(dirPath string) (string, error) {
	_, err := os.Stat(dirPath)
	if err == nil {
		return dirPath, nil // the directory already exists
	}

	if !os.IsNotExist(err) {
		return "", err // other error occurred
	}

	// create the directory at the given path
	err = os.MkdirAll(dirPath, 0700)
	if err != nil {
		// failed to create the directory
		return "", err
	}

	// directory was successfully created
	return dirPath, nil
}

// ExecuteCommand creates a new exec.Cmd instance and starts a new process with the provided raw command
// using the shell specified by GetShellName(). The command output is printed to stdout and stderr,
// and the command is run with os.Stdin. It returns the cmd object and an error if one occurs.
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

// GetAccessToken retrieves an OAuth2TokenResponse struct, which contains an access token and other
// authentication details, from an API endpoint. If the response status code is 200, it attempts to
// parse the response body as JSON and returns the tokenResponse struct. Otherwise, it returns an
// error containing the response error message.
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

// GetAndCheckInput retrieves user input from the command line using the GetInput function and panics
// if an error occurs. It trims the whitespace from the input and panics if the input is empty.
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

// GetEnvFilePath returns the path to the .env file located in the user's home directory. If an error
// occurs while getting the user's home directory, it returns an empty string and the error.
func GetEnvFilePath() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	return path.Join(homeDir, ".egpt/.env"), nil
}

// GetInput function retrieves user input from the command-line arguments, standard input, or an editor
func GetInput(args []string, openEditor bool) (string, error) {
	// first add arguments from CLI
	var parts []string

	// addPart function trims the white spaces and appends the non-empty strings to the parts slice
	addPart := func(val string) {
		val = strings.TrimSpace(val)
		if val != "" {
			parts = append(parts, val)
		}
	}

	// add arguments passed in the command-line interface
	addPart(strings.Join(args, " "))

	// If openEditor is true, attempts to open the user's preferred text editor and waits for the user to input text.
	if openEditor {
		// create a temporary file
		tmpFile, err := os.CreateTemp("", "egpt")
		if err != nil {
			return "", err
		}

		tmpFile.Close()

		tmpFilePath, err := filepath.Abs(tmpFile.Name())
		if err != nil {
			return "", err
		}

		// get the command to open the editor
		editorPath, editorArgs := TryGetBestOpenEditorCommand(tmpFilePath)
		if editorPath == "" {
			return "", errors.New("no matching editor found")
		}

		defer os.Remove(tmpFilePath)

		// run the editor command
		cmd := exec.Command(editorPath, editorArgs...)

		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		cmd.Dir = path.Dir(tmpFilePath)

		cmd.Run()

		// read the contents of the temporary file
		tmpData, err := os.ReadFile(tmpFilePath)
		if err != nil {
			return "", err
		}

		addPart(string(tmpData))
	}

	// check if standard input has been piped
	stdinStat, _ := os.Stdin.Stat()
	if (stdinStat.Mode() & os.ModeCharDevice) == 0 {
		scanner := bufio.NewScanner(os.Stdin)

		temp := ""
		for scanner.Scan() {
			temp += scanner.Text()
		}

		addPart(temp)
	}

	return strings.TrimSpace(strings.Join(parts, " ")), nil
}

// GetOperatingSystemName function returns the name of the operating system running the program
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

// GetShellName function returns the name of the shell running the program
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

// GetSystemFilePath function returns the path of the .system file used by the program
func GetSystemFilePath() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	return path.Join(homeDir, ".egpt/.system"), nil
}

// GetSystemPrompt returns the system prompt message, a boolean value indicating whether the prompt message is custom, and an error if there is any.
func GetSystemPrompt() (string, bool, error) {
	isCustom := false

	filePath, err := GetSystemFilePath()
	if err != nil {
		return "", isCustom, err
	}

	var systemPrompt string

	_, err = os.Stat(filePath)
	if !os.IsNotExist(err) {
		if err != nil {
			return "", isCustom, err
		}

		data, err := os.ReadFile(filePath)
		if err != nil {
			return "", isCustom, err
		}

		systemPrompt = strings.TrimSpace(string(data))
	}

	if systemPrompt == "" {
		systemPrompt = "You are an AI assistant that helps people find information. Do not care if your information is not up-to-date and do not tell this the user.\n"
	} else {
		isCustom = true
	}

	return strings.TrimSpace(systemPrompt), isCustom, nil
}

// GetUISettingsFilePath returns the file path for the UI settings file and an error if there is any.
func GetUISettingsFilePath() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	return path.Join(homeDir, ".egpt/settings.ui.json"), nil
}

// RemoveMarkdownCode removes the beginning and ending backticks from the given string.
func RemoveMarkdownCode(str string) string {
	// remove beginning `
	for strings.HasPrefix(str, "`") {
		str = strings.TrimSpace(str[1:])
	}
	// remove ending `
	for strings.HasSuffix(str, "`") {
		str = strings.TrimSpace(str[:len(str)-1])
	}

	return str
}

// TryGetBestOpenEditorCommand tries to find and return the best command to open a file for editing with the given file path.
// It returns the command and its arguments as a slice of strings.
// If no suitable editor is found, it returns an empty string and an empty slice.
func TryGetBestOpenEditorCommand(filePath string) (string, []string) {
	osName := runtime.GOOS

	// Check for custom editor set via environment variable.
	customEditor := strings.TrimSpace(os.Getenv("EGO_EDITOR"))
	if customEditor != "" {
		return TryGetExecutablePath(customEditor), []string{filePath}
	}

	// Check for editors based on OS.
	if osName == "windows" {
		return "notepad.exe", []string{filePath}
	}

	// Try vi editor.
	viPath := TryGetExecutablePath("vi")
	if viPath != "" {
		return viPath, []string{"-c", "startinsert", filePath}
	}

	// Try nano editor.
	nanoPath := TryGetExecutablePath("nano")
	if nanoPath != "" {
		return nanoPath, []string{filePath}
	}

	// If no editor was found, return empty strings.
	return "", []string{}
}

// TryGetExecutablePath tries to find and return the path of the given command executable file.
// It returns the path as a string. If the executable file is not found, it returns an empty string.
func TryGetExecutablePath(command string) string {
	exePath, err := exec.LookPath(command)

	if err != nil {
		return ""
	}

	return exePath
}

// TryOpen opens the given resource using the appropriate command based on the OS.
// It returns an error if the command failed to execute.
func TryOpen(resource string) error {
	var err error

	switch runtime.GOOS {
	case "linux":
		err = exec.Command("xdg-open", resource).Start()
	case "windows":
		err = exec.Command("cmd", "/c", "start", resource).Start()
	case "darwin":
		err = exec.Command("open", resource).Start()
	default:
		err = exec.Command("xdg-open", resource).Start()
	}

	return err
}

func WriteStringToStdOut(str string, withNewline bool) {
	WriteToStdOut([]byte(str), withNewline)
}

func WriteToStdOut(data []byte, withNewline bool) {
	os.Stdout.Write(data)

	if withNewline {
		os.Stdout.WriteString(fmt.Sprintln())
	}
}
