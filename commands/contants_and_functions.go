package commands

import "strings"

const defaultLanguage = "english"
const defaultProgrammingLanguage = "typescript"

func getLanguage(language string) string {
	lang := strings.TrimSpace(
		strings.ToLower(language),
	)
	if lang == "" {
		lang = defaultLanguage
	}

	return lang
}

func getProgrammingLanguage(language string) string {
	programmingLanguage := strings.TrimSpace(
		strings.ToLower(language),
	)
	if programmingLanguage == "" {
		programmingLanguage = defaultProgrammingLanguage
	}

	return programmingLanguage
}
