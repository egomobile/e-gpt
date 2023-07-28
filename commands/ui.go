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
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path"
	"strings"
	"time"

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
	Time   string `json:"time"`
}

func Init_ui_Command(rootCmd *cobra.Command) {
	var apiListenerAddr = "127.0.0.1"
	var apiPort int32 = 8181
	var noAdditionalInfo bool
	var noSysInfo bool
	var noTime bool
	shouldNotOpenBrowser := false
	var system string
	var uiListenerAddr = "127.0.0.1"
	var uiPort int32 = 8080

	uiCmd := &cobra.Command{
		Use:     "ui",
		Short:   `Start local UI`,
		Long:    `Starts a local web server with a local UI`,
		Aliases: []string{"u"},

		Run: func(cmd *cobra.Command, args []string) {
			go egoUI.StartUI(uiListenerAddr, uiPort, apiListenerAddr, apiPort, !shouldNotOpenBrowser)

			var additionalInfo []string
			var systemPromptBuff bytes.Buffer

			addInfos := func(infos ...string) {
				additionalInfo = append(additionalInfo, infos...)
			}

			customSystemPrompt := strings.TrimSpace(system)
			if customSystemPrompt != "" {
				systemPromptBuff.WriteString(fmt.Sprintln(customSystemPrompt))
			} else {
				defaultSystemPrompt, _, err := egoUtils.GetSystemPrompt()
				if err != nil {
					panic(err)
				}

				systemPromptBuff.WriteString(fmt.Sprintln(defaultSystemPrompt))
			}

			systemPromptTemplate := systemPromptBuff.String()

			sendError := func(ctx *fasthttp.RequestCtx, err error) {
				ctx.SetStatusCode(500)
				ctx.Write([]byte(err.Error()))
			}

			router := router.New()
			router.HandleOPTIONS = true

			cors := func(ctx *fasthttp.RequestCtx) {
				ctx.Response.Header.Set("Access-Control-Allow-Credentials", "true")
				ctx.Response.Header.Set("Access-Control-Allow-Headers", "*")
				ctx.Response.Header.Set("Access-Control-Allow-Methods", "HEAD,GET,POST,PUT,DELETE,OPTIONS")
				ctx.Response.Header.Set("Access-Control-Allow-Origin", "*")
			}

			// CORS
			{
				corsHandler := func(ctx *fasthttp.RequestCtx) {
					cors(ctx)

					ctx.SetStatusCode(204)
				}

				router.OPTIONS("/api/chat", corsHandler)
				router.OPTIONS("/api/settings", corsHandler)
			}

			// chat
			router.POST("/api/chat", func(ctx *fasthttp.RequestCtx) {
				cors(ctx)

				now := time.Now()

				body := ctx.PostBody()

				var chatRequest ChatRequest
				err := json.Unmarshal(body, &chatRequest)
				if err != nil {
					sendError(ctx, err)
					return
				}

				var finalSystemPrompt bytes.Buffer
				finalSystemPrompt.WriteString(systemPromptTemplate)

				if !noSysInfo {
					if !noTime {
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

				if !noAdditionalInfo {
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

				answer, err := egoOpenAI.AskChatGPT(
					finalSystemPrompt.String(),
					chatRequest.Conversation...,
				)
				responseTime := time.Now().UTC()

				if err != nil {
					sendError(ctx, err)
					return
				}

				var chatResponse ChatResponse
				chatResponse.Answer = answer
				chatResponse.Time = responseTime.Format("2006-01-02T15:04:05.999Z")

				data, err := json.Marshal(chatResponse)
				if err != nil {
					sendError(ctx, err)
					return
				}

				ctx.Write(data)
			})

			// get settings
			router.GET("/api/settings", func(ctx *fasthttp.RequestCtx) {
				cors(ctx)

				filePath, err := egoUtils.GetUISettingsFilePath()
				if err != nil {
					sendError(ctx, err)
					return
				}

				_, err = os.Stat(filePath)
				if err != nil {
					if os.IsNotExist(err) {
						ctx.SetStatusCode(404)
					} else {
						sendError(ctx, err)
					}
				} else {
					data, err := os.ReadFile(filePath)
					if err != nil {
						sendError(ctx, err)
					} else {
						ctx.Response.Header.Set("Content-Length", fmt.Sprint(len(data)))

						ctx.Write(data)
					}
				}
			})

			// update settings
			router.PUT("/api/settings", func(ctx *fasthttp.RequestCtx) {
				cors(ctx)

				body := ctx.PostBody()

				settingsFilePath, err := egoUtils.GetUISettingsFilePath()
				if err != nil {
					sendError(ctx, err)
					return
				}

				_, err = egoUtils.EnsureDir(
					path.Dir(settingsFilePath),
				)
				if err != nil {
					sendError(ctx, err)
					return
				}

				err = os.WriteFile(settingsFilePath, body, 0700)
				if err != nil {
					sendError(ctx, err)
				} else {
					ctx.SetStatusCode(204)
				}
			})

			log.Println(fmt.Sprintf("Chat backend will listen on %v:%v ...", apiListenerAddr, apiPort))
			log.Fatal(fasthttp.ListenAndServe(fmt.Sprintf("%v:%v", apiListenerAddr, apiPort), router.Handler))
		},
	}

	uiCmd.Flags().StringVarP(&uiListenerAddr, "address", "a", "127.0.0.1", "Custom UI listener address")
	uiCmd.Flags().StringVarP(&apiListenerAddr, "api-address", "", "127.0.0.1", "Custom API listener address")
	uiCmd.Flags().StringVarP(&apiListenerAddr, "aa", "", "127.0.0.1", "Custom API listener address")
	uiCmd.Flags().Int32VarP(&apiPort, "api-port", "", 8181, "Custom API port")
	uiCmd.Flags().Int32VarP(&apiPort, "ap", "", 8181, "Custom API port")
	uiCmd.Flags().BoolVarP(&noTime, "no-time", "", false, "Do not add current time to system prompt")
	uiCmd.Flags().BoolVarP(&noTime, "nt", "", false, "Do not add current time to system prompt")
	uiCmd.Flags().BoolVarP(&noSysInfo, "no-sys-info", "", false, "Do not add information about the system at all")
	uiCmd.Flags().BoolVarP(&noSysInfo, "nsi", "", false, "Do not add information about the system at all")
	uiCmd.Flags().BoolVarP(&noAdditionalInfo, "no-additional-info", "", false, "Do not add additional info to system prompt at all")
	uiCmd.Flags().BoolVarP(&noAdditionalInfo, "nai", "", false, "Do not add additional info to system prompt at all")
	uiCmd.Flags().BoolVarP(&shouldNotOpenBrowser, "do-not-open", "", false, "Do not open browser after start")
	uiCmd.Flags().BoolVarP(&shouldNotOpenBrowser, "dno", "", false, "Do not open browser after start")
	uiCmd.Flags().StringVarP(&system, "system", "s", "", "Custom system prompt")
	uiCmd.Flags().Int32VarP(&uiPort, "port", "p", 8080, "Custom UI port")

	rootCmd.AddCommand(uiCmd)
}
