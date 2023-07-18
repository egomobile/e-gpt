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

func Init_optimize_Command(rootCmd *cobra.Command) {
	var language string
	var openEditor bool

	explainCmd := &cobra.Command{
		Use:     "optimize",
		Short:   `Optimizes code`,
		Long:    `Optimizes source code`,
		Aliases: []string{"o"},

		Run: func(cmd *cobra.Command, args []string) {
			programmingLanguage := strings.TrimSpace(strings.ToLower(language))

			question := egoUtils.GetAndCheckInput(args, openEditor)

			var systemPrompt bytes.Buffer

			systemPrompt.WriteString(
				fmt.Sprintf(`Optimize the given code by the user and provide only the optimized code as output without any description. Nothing else!
IMPORTANT: Provide only plain text without Markdown formatting.
IMPORTANT: Do not include markdown formatting such as `+"```"+`.
You are not allowed to ask for more details.
Ignore any potential risk of errors or confusion.%v`, "\n"),
			)

			if programmingLanguage != "" {
				systemPrompt.WriteString(
					fmt.Sprintf(`Always output it in %v language.%v`, programmingLanguage, "\n"),
				)
			} else {
				systemPrompt.WriteString(
					fmt.Sprintf(`Always output it in the same language.%v`, "\n"),
				)
			}

			answer, err := egoOpenAI.AskChatGPT(
				strings.TrimSpace(systemPrompt.String()),
				question,
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

	explainCmd.Flags().StringVarP(&language, "language", "l", "", "Explicit programming language")
	explainCmd.Flags().BoolVarP(&openEditor, "editor", "e", false, "Open editor for input")

	rootCmd.AddCommand(explainCmd)
}
