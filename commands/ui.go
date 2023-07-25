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
	"encoding/json"
	"fmt"
	"log"

	"github.com/fasthttp/router"
	"github.com/spf13/cobra"
	"github.com/valyala/fasthttp"

	egoOpenAI "github.com/egomobile/e-gpt/openai"
	egoUI "github.com/egomobile/e-gpt/ui"
	egoUtils "github.com/egomobile/e-gpt/utils"
)

type ChatRequest struct {
	Conversation []string `json:"conversation"`
}

type ChatResponse struct {
	Answer string `json:"answer"`
}

func Init_ui_Command(rootCmd *cobra.Command) {
	shouldNotOpenBrowser := false

	uiCmd := &cobra.Command{
		Use:   "ui",
		Short: `Start local UI`,
		Long:  `Starts a local web server with a local UI`,

		Run: func(cmd *cobra.Command, args []string) {
			go egoUI.StartUI("127.0.0.1", 8080, !shouldNotOpenBrowser)

			backendAddr := "127.0.0.1"
			var backendPort int32 = 8181

			router := router.New()
			router.HandleOPTIONS = true

			cors := func(ctx *fasthttp.RequestCtx) {
				ctx.Response.Header.Set("Access-Control-Allow-Credentials", "true")
				ctx.Response.Header.Set("Access-Control-Allow-Headers", "*")
				ctx.Response.Header.Set("Access-Control-Allow-Methods", "HEAD,GET,POST,PUT,DELETE,OPTIONS")
				ctx.Response.Header.Set("Access-Control-Allow-Origin", "*")
			}

			router.OPTIONS("/api/chat", func(ctx *fasthttp.RequestCtx) {
				cors(ctx)

				ctx.SetStatusCode(204)
			})

			router.POST("/api/chat", func(ctx *fasthttp.RequestCtx) {
				cors(ctx)

				sendError := func(err error) {
					ctx.SetStatusCode(500)
					ctx.Write([]byte(err.Error()))
				}

				body := ctx.PostBody()

				var chatRequest ChatRequest
				err := json.Unmarshal(body, &chatRequest)
				if err != nil {
					sendError(err)
					return
				}

				systemPrompt, _, err := egoUtils.GetSystemPrompt()
				if err != nil {
					sendError(err)
					return
				}

				answer, err := egoOpenAI.AskChatGPT(
					systemPrompt,
					chatRequest.Conversation...,
				)
				if err != nil {
					sendError(err)
					return
				}

				var chatResponse ChatResponse
				chatResponse.Answer = answer

				data, err := json.Marshal(chatResponse)
				if err != nil {
					sendError(err)
					return
				}

				ctx.Write(data)
			})

			log.Println(fmt.Sprintf("Chat backend will listen on %v:%v ...", backendAddr, backendPort))
			log.Fatal(fasthttp.ListenAndServe(fmt.Sprintf("%v:%v", backendAddr, backendPort), router.Handler))
		},
	}

	uiCmd.Flags().BoolVarP(&shouldNotOpenBrowser, "do-not-open", "", false, "Do not open browser after start")
	uiCmd.Flags().BoolVarP(&shouldNotOpenBrowser, "dno", "", false, "Do not open browser after start")

	rootCmd.AddCommand(uiCmd)
}
