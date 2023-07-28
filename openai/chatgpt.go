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

type ChatGPTOpenAIRequestBody struct {
	FrequencyPenalty float64                `json:"frequency_penalty"`
	MaxTokens        int64                  `json:"max_tokens"`
	Messages         []ChatGPTOpenAIMessage `json:"messages"`
	Model            string                 `json:"model"`
	PresencePenalty  float64                `json:"presence_penalty"`
	Temperature      float64                `json:"temperature"`
	TopP             float64                `json:"top_p"`
	Stop             *interface{}           `json:"stop"`
}

type ChatGPTOpenAIMessage struct {
	Content string `json:"content"`
	Role    string `json:"role"`
}

type ChatGPTOpenAIResponseBody struct {
	Choices []ChatGPTOpenAIResponseBodyChoice `json:"choices"`
}

type ChatGPTOpenAIResponseBodyChoice struct {
	Message ChatGPTOpenAIMessage `json:"message"`
}

type ChatApiRequestBody struct {
	Conversation []string `json:"conversation"`
	SystemPrompt string   `json:"systemPrompt"`
}

type ChatApiResponseBody struct {
	Success bool                    `json:"success"`
	Data    ChatApiResponseBodyData `json:"data"`
}

type ChatApiResponseBodyData struct {
	Answer string `json:"answer"`
}

func askApiProxy(clientId string, apiUrl string, authHeader string, authValue string, systemPrompt string, conversation ...string) (string, error) {
	payload := ChatApiRequestBody{
		Conversation: conversation,
		SystemPrompt: systemPrompt,
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

func askOpenAI(openaiApiKey string, systemPrompt string, conversation ...string) (string, error) {
	if len(conversation) < 1 {
		return "", errors.New("conversation must have at least one element")
	}

	if len(conversation)%2 != 0 {
		return "", errors.New("number of conversation elements must be even")
	}

	messages := append([]ChatGPTOpenAIMessage{})

	messages = append(messages, ChatGPTOpenAIMessage{
		Content: systemPrompt,
		Role:    "system",
	})
	for i, content := range conversation {
		role := "user"
		if i%2 == 1 {
			role = "assistant"
		}

		messages = append(messages, ChatGPTOpenAIMessage{
			Content: content,
			Role:    role,
		})
	}

	frequencyPenalty := float64(0)
	presencePenalty := float64(0)
	temperature := 0.7
	maxToken := int64(2048)
	model := "gpt-3.5-turbo"
	var stop *interface{} = nil

	payload := ChatGPTOpenAIRequestBody{
		FrequencyPenalty: frequencyPenalty,
		MaxTokens:        maxToken,
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

func AskChatGPT(systemPrompt string, fullConversation ...string) (string, error) {
	maxConversationSize := getMaxConversationSize()

	finalConversation := make([]string, 0)
	finalConversation = append(finalConversation, fullConversation...)
	if len(finalConversation) > maxConversationSize {
		// maximum reached: take only the maximum
		finalConversation = finalConversation[len(finalConversation)-maxConversationSize:]
	}

	openaiApiKey := strings.TrimSpace(os.Getenv("OPENAI_API_KEY"))
	if openaiApiKey != "" {
		return askOpenAI(openaiApiKey, systemPrompt, finalConversation...)
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

			return askApiProxy(clientId, apiUrl, apiKeyHeader, apiKey, systemPrompt, finalConversation...)
		}

		accessTokenResponse, err := egoUtils.GetAccessToken()
		if err != nil {
			return "", err
		}

		return askApiProxy("", apiUrl, "Authorization", fmt.Sprintf("Bearer %v", accessTokenResponse.AccessToken), systemPrompt, finalConversation...)
	}

	return "", errors.New("could not specify an API gateway")
}
