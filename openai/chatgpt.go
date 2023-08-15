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

package openai

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"

	egoUtils "github.com/egomobile/e-gpt/utils"
)

// ChatGPTOpenAIRequestBody represents the request body for OpenAI's chat API.
type ChatGPTOpenAIRequestBody struct {
	FrequencyPenalty float64                `json:"frequency_penalty"` // Frequency penalty
	MaxTokens        int64                  `json:"max_tokens"`        // Maximum number of tokens to generate
	Messages         []ChatGPTOpenAIMessage `json:"messages"`          // Conversation message history
	Model            string                 `json:"model"`             // ID of the model to use for generating the response
	PresencePenalty  float64                `json:"presence_penalty"`  // Presence penalty
	Temperature      float64                `json:"temperature"`       // Sampling temperature to use
	TopP             float64                `json:"top_p"`             // Top-p sampling cutoff
	Stop             *interface{}           `json:"stop"`              // Token(s) at which to stop generation
}

// ChatGPTOpenAIMessage represents a message in a conversation history.
type ChatGPTOpenAIMessage struct {
	Content string `json:"content"` // Message content
	Role    string `json:"role"`    // Role of the message sender
}

// ChatGPTOpenAIResponseBody represents the response body from OpenAI's chat API.
type ChatGPTOpenAIResponseBody struct {
	Choices []ChatGPTOpenAIResponseBodyChoice `json:"choices"` // List of generated responses
}

// ChatGPTOpenAIResponseBodyChoice represents a generated response.
type ChatGPTOpenAIResponseBodyChoice struct {
	Message ChatGPTOpenAIMessage `json:"message"` // Generated response message
}

// ChatApiRequestBody represents the request body for the chat API.
type ChatApiRequestBody struct {
	Conversation []string `json:"conversation"` // Conversation message history
	SystemPrompt string   `json:"systemPrompt"` // System prompt message
	Temperature  float64  `json:"temperature"`  // Sampling temperature to use
}

// ChatApiResponseBodyData represents the data field in the response body from the chat API.
type ChatApiResponseBodyData struct {
	Answer string `json:"answer"` // Generated response message
}

// ChatApiResponseBody represents the response body from the chat API.
type ChatApiResponseBody struct {
	Success bool                    `json:"success"` // Whether the API call was successful or not
	Data    ChatApiResponseBodyData `json:"data"`    // Response data
}

func askApiProxy(clientId string, apiUrl string, authHeader string, authValue string, systemPrompt string, temperature float64, conversation ...string) (string, error) {
	payload := ChatApiRequestBody{
		Conversation: conversation,
		SystemPrompt: systemPrompt,
		Temperature:  temperature,
	}

	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	chatRequest, err := http.NewRequest("POST", apiUrl, bytes.NewBuffer(payloadJSON))
	if err != nil {
		return "", err
	}

	// set HTTP headers
	chatRequest.Header.Set(authHeader, authValue)
	if clientId != "" {
		chatRequest.Header.Set("x-api-client", clientId)
	}

	httpClient := &http.Client{}

	chatResponse, err := httpClient.Do(chatRequest)
	if err != nil {
		// request failed
		return "", err
	}

	if chatResponse.StatusCode != 200 {
		// must be 200
		return "", fmt.Errorf("unexpected response: %v", chatResponse.StatusCode)
	}

	bodyData, err := io.ReadAll(chatResponse.Body)
	if err != nil {
		// could not read response body
		return "", err
	}

	var chatResponseBody ChatApiResponseBody
	err = json.Unmarshal(bodyData, &chatResponseBody)
	if err != nil {
		// could not parse JSON in `bodyData`
		return "", err
	}

	return chatResponseBody.Data.Answer, nil
}

func askOpenAI(openaiApiKey string, systemPrompt string, temperature float64, conversation ...string) (string, error) {
	if len(conversation) < 1 {
		return "", errors.New("conversation must have at least one element")
	}

	if len(conversation)%2 == 0 {
		return "", errors.New("number of conversation elements must be odd")
	}

	messages := make([]ChatGPTOpenAIMessage, 0)

	messages = append(messages, ChatGPTOpenAIMessage{
		Content: systemPrompt,
		Role:    "system",
	})
	for i, content := range conversation {
		var role string
		if i%2 == 1 {
			role = "assistant"
		} else {
			role = "user"
		}

		messages = append(messages, ChatGPTOpenAIMessage{
			Content: content,
			Role:    role,
		})
	}

	frequencyPenalty := float64(0)
	presencePenalty := float64(0)
	maxToken := int64(2048)
	model := "gpt-3.5-turbo"
	var stop *interface{} = nil

	payload := ChatGPTOpenAIRequestBody{
		FrequencyPenalty: frequencyPenalty,
		MaxTokens:        maxToken,
		Messages:         messages,
		Model:            model,
		PresencePenalty:  presencePenalty,
		Stop:             stop,
		Temperature:      temperature,
	}

	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	url := "https://api.openai.com/v1/chat/completions"

	chatRequest, err := http.NewRequest("POST", url, bytes.NewBuffer(payloadJSON))
	if err != nil {
		return "", err
	}

	chatRequest.Header.Set("Authorization", fmt.Sprintf("Bearer %v", openaiApiKey))
	chatRequest.Header.Set("Content-Type", "application/json; CHARSET=UTF-8")

	httpClient := &http.Client{}

	chatResponse, err := httpClient.Do(chatRequest)
	if err != nil {
		return "", err
	}

	if chatResponse.StatusCode != 200 {
		return "", fmt.Errorf("unexpected response: %v", chatResponse.StatusCode)
	}

	bodyData, err := io.ReadAll(chatResponse.Body)
	if err != nil {
		return "", err
	}

	var chatResponseBody ChatGPTOpenAIResponseBody
	err = json.Unmarshal(bodyData, &chatResponseBody)
	if err != nil {
		return "", err
	}

	if len(chatResponseBody.Choices) < 1 {
		return "", nil
	}

	return chatResponseBody.Choices[0].Message.Content, nil
}

func getMaxConversationSize() int {
	str := strings.TrimSpace(os.Getenv("CHAT_MAX_CONVERSATION_SIZE"))
	val, err := strconv.Atoi(str)
	if err == nil {
		if val >= 2 {
			return val
		}

		return 2 // a single conversation
	}

	return 40 // default / fallback
}

// AskChatGPT function returns the response from the API
// Parameters:
// - systemPrompt: the system prompt to be sent to the API
// - temperature: the temperature to be used by the API
// - fullConversation: the conversation history to be sent to the API
// Returns:
// - string: the response from the API
// - error: an error, if any, encountered during the API call
func AskChatGPT(systemPrompt string, temperature float64, fullConversation ...string) (string, error) {
	maxConversationSize := getMaxConversationSize()

	finalConversation := make([]string, 0)
	finalConversation = append(finalConversation, fullConversation...)
	if len(finalConversation) > maxConversationSize {
		// maximum reached: take only the maximum
		finalConversation = finalConversation[len(finalConversation)-maxConversationSize:]
	}

	openaiApiKey := strings.TrimSpace(os.Getenv("OPENAI_API_KEY"))
	if openaiApiKey != "" {
		return askOpenAI(openaiApiKey, systemPrompt, temperature, finalConversation...)
	}

	clientId := strings.TrimSpace(os.Getenv("CHAT_API_CLIENT_ID"))
	if clientId != "" {
		apiUrl := strings.TrimSpace(os.Getenv("CHAT_API_URL"))
		if apiUrl == "" {
			return "", errors.New("no API url defined")
		}

		apiKey := strings.TrimSpace(os.Getenv("CHAT_API_KEY"))
		if apiKey != "" {
			apiKeyHeader := strings.TrimSpace(os.Getenv("CHAT_API_KEY_HEADER"))
			if apiKeyHeader == "" {
				apiKeyHeader = "x-api-key"
			}

			return askApiProxy(clientId, apiUrl, apiKeyHeader, apiKey, systemPrompt, temperature, finalConversation...)
		}

		accessTokenResponse, err := egoUtils.GetAccessToken()
		if err != nil {
			return "", err
		}

		return askApiProxy("", apiUrl, "Authorization", fmt.Sprintf("Bearer %v", accessTokenResponse.AccessToken), systemPrompt, temperature, finalConversation...)
	}

	return "", errors.New("could not specify an API gateway")
}
