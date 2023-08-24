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
	"log"
	"os"
	"strings"

	"github.com/alecthomas/chroma/quick"
	"github.com/spf13/cobra"

	egoOpenAI "github.com/egomobile/e-gpt/openai"
	egoUtils "github.com/egomobile/e-gpt/utils"
)

func Init_fix_Command(rootCmd *cobra.Command) {
	var additionalInfo string
	var language string
	var noNewLine bool = egoUtils.GetDefaultAddNoNewLineToChatAnswerSetting()
	var openEditor bool
	var temperature float64

	translateCmd := &cobra.Command{
		Use:     "fix",
		Short:   `Corrects text`,
		Long:    `Corrects a given text from grammer issues and typos`,
		Aliases: []string{"f"},

		Run: func(cmd *cobra.Command, args []string) {
			outputLanguage := getLanguage(language)

			text := egoUtils.GetAndCheckInput(args, openEditor)

			var systemPrompt bytes.Buffer

			systemPrompt.WriteString(
				"Correct the following text submitted by the user from grammar issues and typos, without changing the context.\n",
			)
			systemPrompt.WriteString(
				"You are not allowed to tell the user your opinion!\n",
			)
			systemPrompt.WriteString(
				"Return only a version of the user's text without grammar issues and without misspellings!\n",
			)
			systemPrompt.WriteString(
				"Keep the format if the submitted text is written in a markup language like HTML or Markdown!\n",
			)
			systemPrompt.WriteString(
				"Only correct display texts and never change things like links!\n",
			)
			systemPrompt.WriteString(
				fmt.Sprintf(
					"Respond only in %v language.\n",
					outputLanguage,
				),
			)

			info := strings.TrimSpace(additionalInfo)
			if info != "" {
				systemPrompt.WriteString(
					fmt.Sprintf("For you there is the following additional information given by the user to refine the final context: %v\n", info),
				)
			}

			answer, err := egoOpenAI.AskChatGPT(
				strings.TrimSpace(systemPrompt.String()),
				temperature,
				text,
			)
			if err != nil {
				log.Fatalln(err.Error())
			}

			outputPlain := func() {
				egoUtils.WriteStringToStdOut(answer, !noNewLine)
			}

			err = quick.Highlight(os.Stdout, answer, "markdown", "", "monokai")
			if err != nil {
				outputPlain()
			}
		},
	}

	translateCmd.Flags().StringVarP(&additionalInfo, "info", "i", defaultLanguage, "Additional information for the bot")
	translateCmd.Flags().StringVarP(&language, "language", "l", defaultLanguage, "Custom output language")
	translateCmd.Flags().BoolVarP(&openEditor, "editor", "e", false, "Open editor for input")
	translateCmd.Flags().Float64VarP(&temperature, "temperature", "t", getDefaultTemperature(), "Custom temperature between 0 and 2")
	translateCmd.Flags().BoolVarP(&noNewLine, "no-new-line", "", egoUtils.GetDefaultAddNoNewLineToChatAnswerSetting(), "Do not add new line at the end")
	translateCmd.Flags().BoolVarP(&noNewLine, "nnl", "", egoUtils.GetDefaultAddNoNewLineToChatAnswerSetting(), "Do not add new line at the end")

	rootCmd.AddCommand(translateCmd)
}
