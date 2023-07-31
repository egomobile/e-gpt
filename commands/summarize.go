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

func Init_summarize_Command(rootCmd *cobra.Command) {
	var language string
	var maxSize int32
	var openEditor bool
	var temperature float64

	summarizeCmd := &cobra.Command{
		Use:     "summarize",
		Short:   `Summarize text`,
		Long:    `Summarize a long text into a shorter version`,
		Aliases: []string{"su"},

		Run: func(cmd *cobra.Command, args []string) {
			outputLanguage := getLanguage(language)

			text := egoUtils.GetAndCheckInput(args, openEditor)

			var systemPrompt bytes.Buffer

			systemPrompt.WriteString(
				fmt.Sprintf(
					"Summarize the text submitted by the user in maximum %v characters.\n",
					maxSize,
				),
			)
			systemPrompt.WriteString(
				"You are not allowed to tell the user your opinion!\n",
			)
			systemPrompt.WriteString(
				fmt.Sprintf(
					"Output summary only in %v language.\n",
					outputLanguage,
				),
			)

			answer, err := egoOpenAI.AskChatGPT(
				strings.TrimSpace(systemPrompt.String()),
				temperature,
				text,
			)
			if err != nil {
				log.Fatalln(err.Error())
			}

			outputPlain := func() {
				os.Stdout.Write([]byte(answer))
			}

			err = quick.Highlight(os.Stdout, answer, "markdown", "", "monokai")
			if err != nil {
				outputPlain()
			}
		},
	}

	summarizeCmd.Flags().StringVarP(&language, "language", "l", defaultLanguage, "Custom output language")
	summarizeCmd.Flags().Int32VarP(&maxSize, "max-length", "", 1000, "Maximum number of characters")
	summarizeCmd.Flags().Int32VarP(&maxSize, "ml", "", 1000, "Maximum number of characters")
	summarizeCmd.Flags().BoolVarP(&openEditor, "editor", "e", false, "Open editor for input")
	summarizeCmd.Flags().Float64VarP(&temperature, "temperature", "t", 1, "Custom temperature between 0 and 2")

	rootCmd.AddCommand(summarizeCmd)
}
