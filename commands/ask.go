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
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/alecthomas/chroma/quick"
	"github.com/spf13/cobra"

	egoOpenAI "github.com/egomobile/e-gpt/openai"
	egoUtils "github.com/egomobile/e-gpt/utils"
)

func Init_ask_Command(rootCmd *cobra.Command) {
	var noAdditionalInfo bool
	var noSysInfo bool
	var noTime bool
	var openEditor bool
	var shouldOutputAsPlainText bool
	var system string

	askCmd := &cobra.Command{
		Use:     "ask",
		Short:   `Chats with ChatGPT`,
		Long:    `Chats with ChatGPT or a similar API`,
		Aliases: []string{"a"},

		Run: func(cmd *cobra.Command, args []string) {
			now := time.Now()

			question := egoUtils.GetAndCheckInput(args, openEditor)

			var additionalInfo []string
			var systemPrompt bytes.Buffer

			addInfos := func(infos ...string) {
				additionalInfo = append(additionalInfo, infos...)
			}

			customSystemPrompt := strings.TrimSpace(system)
			if customSystemPrompt != "" {
				systemPrompt.WriteString(fmt.Sprintln(customSystemPrompt))
			} else {
				defaultSystemPrompt, _, err := egoUtils.GetSystemPrompt()
				if err != nil {
					panic(err)
				}

				systemPrompt.WriteString(fmt.Sprintln(defaultSystemPrompt))
			}

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
					systemPrompt.WriteString(fmt.Sprintln())
					systemPrompt.WriteString(fmt.Sprintln("In addition, the following information is available to you:"))

					for _, info := range additionalInfo {
						systemPrompt.WriteString(info)
					}

					systemPrompt.WriteString(fmt.Sprintln())
				}
			}

			answer, err := egoOpenAI.AskChatGPT(
				strings.TrimSpace(systemPrompt.String()),
				question,
			)
			if err != nil {
				panic(err)
			}

			outputPlain := func() {
				os.Stdout.Write([]byte(answer))
			}

			if shouldOutputAsPlainText {
				outputPlain()
			} else {
				err = quick.Highlight(os.Stdout, answer, "", "", "monokai")
				if err != nil {
					outputPlain()
				}
			}
		},
	}

	askCmd.Flags().StringVarP(&system, "system", "s", "", "Custom system prompt")
	askCmd.Flags().BoolVarP(&noTime, "no-time", "", false, "Do not add current time to system prompt")
	askCmd.Flags().BoolVarP(&noTime, "nt", "", false, "Do not add current time to system prompt")
	askCmd.Flags().BoolVarP(&noSysInfo, "no-sys-info", "", false, "Do not add information about the system at all")
	askCmd.Flags().BoolVarP(&noSysInfo, "nsi", "", false, "Do not add information about the system at all")
	askCmd.Flags().BoolVarP(&noAdditionalInfo, "no-additional-info", "", false, "Do not add additional info to system prompt at all")
	askCmd.Flags().BoolVarP(&noAdditionalInfo, "nai", "", false, "Do not add additional info to system prompt at all")
	askCmd.Flags().BoolVarP(&shouldOutputAsPlainText, "plain-text", "", false, "Output as plain text")
	askCmd.Flags().BoolVarP(&shouldOutputAsPlainText, "pt", "", false, "Output as plain text")
	askCmd.Flags().BoolVarP(&openEditor, "editor", "e", false, "Open editor for input")

	rootCmd.AddCommand(askCmd)
}
