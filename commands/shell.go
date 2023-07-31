package commands

import (
	"bufio"
	"bytes"
	"fmt"
	"log"
	"os"
	"strings"
	"syscall"
	"time"

	"github.com/spf13/cobra"

	egoOpenAI "github.com/egomobile/e-gpt/openai"
	egoUtils "github.com/egomobile/e-gpt/utils"
)

func Init_shell_Command(rootCmd *cobra.Command) {
	var openEditor bool
	var temperature float64
	var withExitCode bool

	shellCmd := &cobra.Command{
		Use:     "shell",
		Short:   `Generate command for shell`,
		Long:    `Generate command for shell from a human language query`,
		Aliases: []string{"s"},

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
				fmt.Sprintf(`Provide only %v commands for %v without any description.
If there is a lack of details, provide most logical solution.
Ensure the output is a valid shell command.
If multiple steps required try to combine them together.
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

			os.Stdout.WriteString(fmt.Sprintln(answer))
			os.Stdout.WriteString("[E]xecute, [a]bort ")

			for {
				os.Stdout.WriteString("> ")

				reader := bufio.NewReader(os.Stdin)
				input, err := reader.ReadString('\n')

				if err != nil {
					log.Println("[ERROR]", err.Error())
					continue
				}

				input = strings.TrimSpace(strings.ToLower(input))
				if input == "" || input == "e" {
					cmd, err := egoUtils.ExecuteCommand(answer)

					if withExitCode {
						if status, ok := cmd.ProcessState.Sys().(syscall.WaitStatus); ok {
							os.Exit(status.ExitStatus())
						} else {
							if err != nil {
								os.Exit(1)
							} else {
								os.Exit(0)
							}
						}
					} else {
						break
					}
				} else if input == "a" {
					break
				} else {
					log.Printf("%v not supported", input)
				}
			}
		},
	}

	shellCmd.Flags().BoolVarP(&openEditor, "editor", "e", false, "Open editor for input")
	shellCmd.Flags().BoolVarP(&withExitCode, "exit-code", "", false, "Also return exit code from execution")
	shellCmd.Flags().BoolVarP(&withExitCode, "ec", "", false, "Also return exit code from execution")
	shellCmd.Flags().Float64VarP(&temperature, "temperature", "t", getDefaultTemperature(), "Custom temperature between 0 and 2")

	rootCmd.AddCommand(shellCmd)
}
