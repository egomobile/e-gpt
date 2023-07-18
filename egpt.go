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

package main

import (
	"fmt"
	"log"
	"os"
	"path"

	"github.com/joho/godotenv"
	"github.com/spf13/cobra"

	egoCommands "github.com/egomobile/e-gpt/commands"
)

var rootCmd = &cobra.Command{
	Use:   "egpt",
	Short: `e.GPT is a command line tool running with ChatGPT.`,
	Long:  `e.GPT is a command line tool running with ChatGPT.`,
	// Uncomment the following line if your bare application
	// has an action associated with it:
	// Run: func(cmd *cobra.Command, args []string) { },
}

func initCommands() {
	egoCommands.Init_ask_Command(rootCmd)
	egoCommands.Init_code_Command(rootCmd)
	egoCommands.Init_describe_Command(rootCmd)
	egoCommands.Init_explain_Command(rootCmd)
	egoCommands.Init_shell_Command(rootCmd)
	egoCommands.Init_summarize_Command(rootCmd)
	egoCommands.Init_translate_Command(rootCmd)
}

func main() {
	// try to load .env file from
	// ${HOME}/.egpt
	homeDir, err := os.UserHomeDir()
	if err == nil {
		egptEnv := path.Join(homeDir, ".egpt/.env")

		if _, err := os.Stat(egptEnv); err == nil {
			err := godotenv.Load(egptEnv)
			if err != nil {
				log.Fatalf("Error loading .egpt/.env file: %v", err.Error())
			}
		}
	} else {
		log.Println("[WARN]", fmt.Sprintf("Could not detect home directory: %v", err.Error()))
	}

	// try to load .env from current working directory
	if _, err := os.Stat(".env"); err == nil {
		err := godotenv.Load(".env")
		if err != nil {
			log.Fatalf("Error loading .env file: %v", err.Error())
		}
	}

	initCommands()

	err = rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}
