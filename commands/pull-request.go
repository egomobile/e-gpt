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
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"os/exec"
	"strings"

	"github.com/spf13/cobra"

	egoOpenAI "github.com/egomobile/e-gpt/openai"
	egoUtils "github.com/egomobile/e-gpt/utils"
)

type StagedGitFile struct {
	ChangeType string
	FileName   string
}

type FileForGitCommit struct {
	ChangeType string `json:"change_type"`
	Diff       string `json:"diff"`
	FileName   string `json:"filename"`
	// HeadContent string `json:"head_content"`
}

type PullRequest struct {
	Files []FileForGitCommit `json:"files"`
}

func listGitStages() ([]StagedGitFile, error) {
	files := make([]StagedGitFile, 0)

	cmd := exec.Command("git", "diff", "--name-status", "--cached")
	output, err := cmd.Output()
	if err != nil {
		return files, err
	}

	for _, line := range strings.Split(string(output), "\n") {
		if line == "" {
			continue
		}

		parts := strings.Split(line, "\t")
		files = append(files, StagedGitFile{
			ChangeType: parts[0],
			FileName:   parts[1],
		})
	}

	return files, nil
}

func getFileDiff(file StagedGitFile) (string, error) {
	cmd := exec.Command("git", "diff", "--staged", file.FileName)
	output, err := cmd.Output()

	return string(output), err
}

func getHeadContent(file StagedGitFile) (string, error) {
	cmd := exec.Command("git", "show", fmt.Sprintf("HEAD:%v", file.FileName))
	output, err := cmd.Output()

	return string(output), err
}

func Init_git_Command(rootCmd *cobra.Command) {
	var shouldCountTokens bool
	var temperature float64

	gitCmd := &cobra.Command{
		Use:     "pull-request",
		Short:   `Generate PR messages`,
		Long:    `Generate messages for git pull requests`,
		Aliases: []string{"pr"},

		Run: func(cmd *cobra.Command, args []string) {
			var systemPrompt bytes.Buffer

			files, err := listGitStages()
			if err != nil {
				panic(err)
			}

			gitFiles := make([]FileForGitCommit, 0)
			for _, file := range files {
				diff, err := getFileDiff(file)
				if err != nil {
					panic(err)
				}

				newGitFile := FileForGitCommit{}
				newGitFile.FileName = file.FileName
				newGitFile.ChangeType = file.ChangeType
				newGitFile.Diff = diff

				// headContent, err := getHeadContent(file)
				// if err == nil {
				// 	newGitFile.HeadContent = headContent
				// }

				gitFiles = append(gitFiles, newGitFile)
			}

			if len(gitFiles) < 1 {
				panic(errors.New("no staged changes"))
			}

			pr := PullRequest{}
			pr.Files = gitFiles

			jsonData, err := json.Marshal(pr)
			if err != nil {
				panic(err)
			}

			systemPrompt.WriteString(`You are a software developer and resposible for the quality of pull requests.

From users you will only get JSON strings which stores data for an upcoming Pull Request, described by the following TypeScript interface:

	interface PullRequestInterface {
		// array of staged files
		files: {
			// relative path of the file in stage
			// same value as executing "git diff --name-status --cached" from terminal
			filename: string;

			// the change type, like 'M' or 'A'
			// same value as executing "git diff --name-status --cached" from terminal
			change_type_ string;
			
			// "diff" is the diff between staged version and content in "head_content"
			// same as executing "git diff --staged <filename>" from terminal
			diff: string;
		}[];
	}

Answer in 2 parts:
1. with a short git commit message with max. 50 characters (only plain text, no markdown)
2. with longer description with maximum 2000 characters and using Markdown

You are not allowed to ask for more details.
Ignore any potential risk of errors or confusion.
Do not show any warnings or information regarding your capabilities.

User's input JSON:`)

			if shouldCountTokens {
				tokenCount, err := egoUtils.CountTokens(
					systemPrompt.String() + string(jsonData),
				)

				if err != nil {
					panic(err)
				}

				fmt.Print(tokenCount)
			} else {
				answer, err := egoOpenAI.AskChatGPT(
					strings.TrimSpace(systemPrompt.String()),
					temperature,
					string(jsonData),
				)
				if err != nil {
					log.Fatalln(err.Error())
				}

				os.Stdout.Write([]byte(answer))
			}
		},
	}

	gitCmd.Flags().BoolVarP(&shouldCountTokens, "count", "c", false, "Count possible input tokens instead calling API")
	gitCmd.Flags().Float64VarP(&temperature, "temperature", "t", getDefaultTemperature(), "Custom temperature between 0 and 2")

	rootCmd.AddCommand(gitCmd)
}
