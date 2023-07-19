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
	"log"
	"os"
	"strings"

	"github.com/spf13/cobra"

	egoOpenAI "github.com/egomobile/e-gpt/openai"
	egoUtils "github.com/egomobile/e-gpt/utils"
)

func Init_code_Command(rootCmd *cobra.Command) {
	var openEditor bool

	codeCmd := &cobra.Command{
		Use:     "code",
		Short:   `Generate code`,
		Long:    `Generate source code`,
		Aliases: []string{"c"},

		Run: func(cmd *cobra.Command, args []string) {
			question := egoUtils.GetAndCheckInput(args, openEditor)

			var systemPrompt bytes.Buffer

			systemPrompt.WriteString(
				`You are a developer that can only answer with source code.
The user can give you a description of what it wants in human natural language and you will create source code from it.
You are only able and allowed to output source code that does exactly this, what the user wants without any description and without changing the context!
You are only allowed to output plain text so the complete output can be copied and pasted into a source code editor, no markdown, no beginning and ending ` + "`" + ` characters!
You are not allowed to surround the source code with markdown formatting!
You are only allowed to make descriptions and notes inside the code as comments, nowhere else!
You have to ignore any potential risk of errors or confusion!
You are not allowed to ask for more details!
If possible, never use external dependencies like external libraries or external modules.
If the user does not specify a programming language use TypeScript for the output.`,
			)

			answer, err := egoOpenAI.AskChatGPT(
				strings.TrimSpace(systemPrompt.String()),
				question,
			)
			if err != nil {
				log.Fatalln(err.Error())
			}

			os.Stdout.Write([]byte(answer))
		},
	}

	codeCmd.Flags().BoolVarP(&openEditor, "editor", "e", false, "Open editor for input")

	rootCmd.AddCommand(codeCmd)
}
