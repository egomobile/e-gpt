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
	"time"

	"github.com/alecthomas/chroma/quick"
	"github.com/spf13/cobra"

	egoOpenAI "github.com/egomobile/e-gpt/openai"
	egoUtils "github.com/egomobile/e-gpt/utils"
)

func Init_describe_Command(rootCmd *cobra.Command) {
	var openEditor bool
	var temperature float64

	describeCmd := &cobra.Command{
		Use:     "describe",
		Short:   `Describe shell command`,
		Long:    `Describes a shell command as humand language`,
		Aliases: []string{"d"},

		Run: func(cmd *cobra.Command, args []string) {
			now := time.Now()
			zoneName, zoneOffset := now.Zone()

			question := egoUtils.GetAndCheckInput(args, openEditor)

			var additionalInfo []string
			var systemPrompt bytes.Buffer

			addInfos := func(infos ...string) {
				additionalInfo = append(additionalInfo, infos...)
			}

			// s. https://github.com/TheR1D/shell_gpt/blob/4aed53b968097dfd7cba3c4a7b1a911ddf8248c2/sgpt/role.py
			systemPrompt.WriteString(
				fmt.Sprintf(`You are %v for %v.
Provide a terse, single sentence description of the given shell command.
Do not show any warnings or information regarding your capabilities.
If you need to store any data, assume it will be stored in the chat.
`, egoUtils.GetShellName(), egoUtils.GetOperatingSystemName()),
			)

			// time information
			{
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

			// collect additional info, if available
			if len(additionalInfo) > 0 {
				systemPrompt.WriteString(fmt.Sprintln())
				systemPrompt.WriteString(fmt.Sprintln("In addition, the following information is available to you:"))

				for _, info := range additionalInfo {
					systemPrompt.WriteString(info)
				}

				systemPrompt.WriteString(fmt.Sprintln())
			}

			answer, err := egoOpenAI.AskChatGPT(
				strings.TrimSpace(systemPrompt.String()),
				temperature,
				question,
			)
			if err != nil {
				log.Fatalln(err.Error())
			}

			err = quick.Highlight(os.Stdout, answer, "markdown", "", "monokai")
			if err != nil {
				os.Stdout.WriteString(fmt.Sprintln(answer))
			}
		},
	}

	describeCmd.Flags().BoolVarP(&openEditor, "editor", "e", false, "Open editor for input")
	describeCmd.Flags().Float64VarP(&temperature, "temperature", "t", getDefaultTemperature(), "Custom temperature between 0 and 2")

	rootCmd.AddCommand(describeCmd)
}
