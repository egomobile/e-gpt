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
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path"

	"github.com/spf13/cobra"

	egoUtils "github.com/egomobile/e-gpt/utils"
)

func Init_environment_Command(rootCmd *cobra.Command) {
	var shouldEditEnvFile bool

	environmentCmd := &cobra.Command{
		Use:     "environment",
		Short:   `Handle .env file`,
		Long:    `Shows or edits applications own .env file`,
		Aliases: []string{"env"},

		Run: func(cmd *cobra.Command, args []string) {
			egptEnvFile, err := egoUtils.GetEnvFilePath()
			if err != nil {
				panic(err)
			}

			egptEnvFileDir := path.Dir(egptEnvFile)

			if shouldEditEnvFile {
				// edit mode

				editorPath, editorArgs := egoUtils.TryGetBestOpenEditorCommand(egptEnvFile)
				if editorPath == "" {
					panic(errors.New("no matching editor found"))
				}

				if _, err := os.Stat(egptEnvFileDir); os.IsNotExist(err) {
					err := os.MkdirAll(egptEnvFileDir, 0700)
					if err != nil {
						panic(err)
					}
				}

				cmd := exec.Command(editorPath, editorArgs...)

				cmd.Stdin = os.Stdin
				cmd.Stdout = os.Stdout
				cmd.Stderr = os.Stderr
				cmd.Dir = path.Dir(egptEnvFileDir)

				cmd.Run()
			} else {
				// output to STDOUT

				if _, err := os.Stat(egptEnvFile); os.IsNotExist(err) {
					panic(fmt.Errorf("%v file does not exist", egptEnvFile))
				}

				file, err := os.Open(egptEnvFile)
				if err != nil {
					panic(err)
				}

				defer file.Close()

				_, err = io.Copy(os.Stdout, file)
				if err != nil {
					panic(err)
				}
			}
		},
	}

	environmentCmd.Flags().BoolVarP(&shouldEditEnvFile, "editor", "e", false, "Open editor for .env file")

	rootCmd.AddCommand(environmentCmd)
}
