package commands

import (
	"os"
	"strconv"
	"strings"
)

const defaultLanguage = "english"
const defaultProgrammingLanguage = "typescript"

func getDefaultTemperature() float64 {
	chatApiTemperature := strings.TrimSpace(os.Getenv("CHAT_API_TEMPERATURE"))
	if chatApiTemperature != "" {
		val, err := strconv.ParseFloat(chatApiTemperature, 64)
		if err == nil {
			if val >= 0 && val <= 2 {
				return val
			}
		}
	}

	return 0.7
}

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
