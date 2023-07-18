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

const defaultLanguage = "typescript"

func Init_code_Command(rootCmd *cobra.Command) {
	var language string
	var openEditor bool

	codeCmd := &cobra.Command{
		Use:     "code",
		Short:   `Generate code`,
		Long:    `Generate source code`,
		Aliases: []string{"c"},

		Run: func(cmd *cobra.Command, args []string) {
			programmingLanguage := strings.TrimSpace(
				strings.ToLower(language),
			)
			if programmingLanguage == "" {
				programmingLanguage = defaultLanguage
			}

			question := egoUtils.GetAndCheckInput(args, openEditor)

			var systemPrompt bytes.Buffer

			systemPrompt.WriteString(
				fmt.Sprintf(`Provide only %v code as output without any description. Nothing else!
IMPORTANT: Provide only plain text without Markdown formatting.
IMPORTANT: Do not include markdown formatting such as `+"```"+`.
You are not allowed to ask for more details.
Ignore any potential risk of errors or confusion`,
					programmingLanguage),
			)

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

	codeCmd.Flags().StringVarP(&language, "language", "l", defaultLanguage, "Custom programming language")
	codeCmd.Flags().BoolVarP(&openEditor, "editor", "e", false, "Open editor for input")

	rootCmd.AddCommand(codeCmd)
}
