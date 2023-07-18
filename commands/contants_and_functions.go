package commands

import "strings"

const defaultProgrammingLanguage = "typescript"

func getProgrammingLanguage(language string) string {
	programmingLanguage := strings.TrimSpace(
		strings.ToLower(language),
	)
	if programmingLanguage == "" {
		programmingLanguage = defaultProgrammingLanguage
	}

	return programmingLanguage
}
