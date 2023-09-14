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

package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/valyala/fasthttp"

	egoOpenAI "github.com/egomobile/e-gpt/openai"
	egoTypes "github.com/egomobile/e-gpt/types"
	egoUtils "github.com/egomobile/e-gpt/utils"
)

// ChatRequest represents a chat request data structure
type ChatRequest struct {
	Conversation []string `json:"conversation"`           // Conversation represents the conversation history of the chat request
	SystemPrompt string   `json:"systemPrompt,omitempty"` // system prompt
	Temperature  *float64 `json:"temperature"`            // Temperature represents the temperature to use for generating the response
}

// ChatResponse represents a chat response data structure
type ChatResponse struct {
	Answer string `json:"answer"` // Answer represents the answer to the chat request
	Time   string `json:"time"`   // Time represents the time at which the chat response is generated
}

// CreateChatHandlerOptions represents options for creating a chat handler
type CreateChatHandlerOptions struct {
	CustomSystemPrompt string  // CustomSystemPrompt represents the custom system prompt to use for generating the response
	DefaultTemperature float64 // DefaultTemperature represents the default temperature to use for generating the response
	NoAdditionalInfo   bool    // NoAdditionalInfo specifies whether to include additional information in the response
	NoSystemInfo       bool    // NoSystemInfo specifies whether to include system information in the response
	NoTime             bool    // NoTime specifies whether to include time in the response
}

// CreateChatHandler returns a fasthttp request handler that does a chat conversation
// using the given options.
func CreateChatHandler(options CreateChatHandlerOptions) egoTypes.FHRequestHandler {
	var systemPromptTemplate string
	{
		var systemPromptBuff bytes.Buffer

		customSystemPrompt := strings.TrimSpace(options.CustomSystemPrompt)
		if customSystemPrompt != "" {
			systemPromptBuff.WriteString(fmt.Sprintln(customSystemPrompt))
		} else {
			defaultSystemPrompt, _, err := egoUtils.GetSystemPrompt()
			if err != nil {
				panic(err)
			}

			systemPromptBuff.WriteString(fmt.Sprintln(defaultSystemPrompt))
		}

		systemPromptTemplate = systemPromptBuff.String()
	}

	return func(ctx *fasthttp.RequestCtx) {
		now := time.Now()

		body := ctx.PostBody()

		var chatRequest ChatRequest
		err := json.Unmarshal(body, &chatRequest)
		if err != nil {
			egoUtils.SendHttpError(ctx, err)
			return
		}

		var additionalInfo []string

		addInfos := func(infos ...string) {
			additionalInfo = append(additionalInfo, infos...)
		}

		customSystemPrompt := strings.TrimSpace(chatRequest.SystemPrompt)

		var finalSystemPrompt bytes.Buffer
		if customSystemPrompt == "" {
			finalSystemPrompt.WriteString(systemPromptTemplate)
		} else {
			finalSystemPrompt.WriteString(customSystemPrompt)
		}

		if !options.NoSystemInfo {
			if !options.NoTime {
				zoneName, zoneOffset := now.Zone()

				addInfos(fmt.Sprintf(
					"The current timezone is %v with an offset of %v seconds from UTC.",
					zoneName,
					zoneOffset,
				))

				addInfos(fmt.Sprintf(
					"The current date with time is %v, while the current local weekday is %v. Always output the time in a format that matches the current language.",
					now.Local().Weekday(),
					now.Local().Format("2006-01-02T15:04:05-0700"),
				))

				addInfos("You will always act as if you have access to a time server and not tell the user.")
			}
		}

		if !options.NoAdditionalInfo {
			// collect additional info, if available
			if len(additionalInfo) > 0 {
				finalSystemPrompt.WriteString(fmt.Sprintln())
				finalSystemPrompt.WriteString(fmt.Sprintln("In addition, the following information is available to you:"))

				for _, info := range additionalInfo {
					finalSystemPrompt.WriteString(info)
				}

				finalSystemPrompt.WriteString(fmt.Sprintln())
			}
		}

		var temperature = options.DefaultTemperature
		if chatRequest.Temperature != nil {
			temperature = *chatRequest.Temperature
		}

		answer, err := egoOpenAI.AskChatGPT(
			finalSystemPrompt.String(),
			temperature,
			chatRequest.Conversation...,
		)
		responseTime := time.Now().UTC()

		if err != nil {
			egoUtils.SendHttpError(ctx, err)
			return
		}

		var chatResponse ChatResponse
		chatResponse.Answer = answer
		chatResponse.Time = responseTime.Format("2006-01-02T15:04:05.999Z")

		data, err := json.Marshal(chatResponse)
		if err != nil {
			egoUtils.SendHttpError(ctx, err)
			return
		}

		ctx.SetStatusCode(200)
		ctx.Response.Header.Set("Content-Length", fmt.Sprint(len(data)))
		ctx.Response.Header.Set("Content-Type", "application/json; charset=UTF-8")

		ctx.Write(data)
	}
}
