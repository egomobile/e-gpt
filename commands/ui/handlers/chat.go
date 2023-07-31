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

type ChatRequest struct {
	Conversation []string `json:"conversation"`
	Temperature  *float32 `json:"temperature"`
}

type ChatResponse struct {
	Answer string `json:"answer"`
	Time   string `json:"time"`
}

type CreateChatHandlerOptions struct {
	CustomSystemPrompt string
	DefaultTemperature float32
	NoAdditionalInfo   bool
	NoSystemInfo       bool
	NoTime             bool
}

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
		egoUtils.SetupCorsHeaders(ctx)

		now := time.Now()

		body := ctx.PostBody()

		var chatRequest ChatRequest
		err := json.Unmarshal(body, &chatRequest)
		if err != nil {
			egoUtils.SendHttpError(ctx, err)
			return
		}

		var additionalInfo []string
		var systemPromptBuff bytes.Buffer

		addInfos := func(infos ...string) {
			additionalInfo = append(additionalInfo, infos...)
		}

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

		var finalSystemPrompt bytes.Buffer
		finalSystemPrompt.WriteString(systemPromptTemplate)

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
