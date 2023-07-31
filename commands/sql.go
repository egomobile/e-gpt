package commands

import (
	"bufio"
	"bytes"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"reflect"
	"strings"
	"time"

	"github.com/jedib0t/go-pretty/v6/table"
	"github.com/spf13/cobra"

	egoOpenAI "github.com/egomobile/e-gpt/openai"
	egoUtils "github.com/egomobile/e-gpt/utils"
)

type GetTablesFunc func() ([]string, error)

func getPostgresTables(db *sql.DB) ([]string, error) {
	query := `SELECT t.table_name, c.column_name::text, c.data_type, c.is_nullable
FROM information_schema.tables t
INNER JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' AND t.table_type= 'BASE TABLE' AND c.table_schema = 'public';`

	rows, err := db.Query(query)
	if err != nil {
		return []string{}, err
	}

	defer rows.Close()

	allTablesAndColumns := make(map[string][]string)

	for rows.Next() {
		var tableName string
		var columnName string
		var dataType string
		var isNullable string

		err := rows.Scan(&tableName, &columnName, &dataType, &isNullable)
		if err != nil {
			return []string{}, err
		}

		tableCols, ok := allTablesAndColumns[tableName]
		if !ok {
			allTablesAndColumns[tableName] = []string{}
		}

		notNull := ""
		if isNullable == "YES" {
			notNull = "NOT NULL"
		}

		stmt := fmt.Sprintf(
			`"%v" %v %v`,
			columnName, dataType, notNull,
		)

		allTablesAndColumns[tableName] = append(
			tableCols,
			strings.TrimSpace(stmt),
		)
	}

	var createStmts []string

	for tableName, tableCols := range allTablesAndColumns {
		stmt := fmt.Sprintf(
			`CREATE TABLE public.%v (%v);`,
			tableName,
			strings.Join(tableCols, ","),
		)

		createStmts = append(
			createStmts,
			strings.TrimSpace(stmt),
		)
	}

	return createStmts, nil
}

func Init_sql_Command(rootCmd *cobra.Command) {
	var asCSV bool
	var connectionStr string
	var openEditor bool
	var temperature float64

	sqlCmd := &cobra.Command{
		Use:   "sql",
		Short: `Executes SQL`,
		Long:  `Executes SQL statement from a human language query`,

		Run: func(cmd *cobra.Command, args []string) {
			question := egoUtils.GetAndCheckInput(args, openEditor)

			db, dbName, err := egoUtils.OpenSQLConnection(connectionStr)
			if err != nil {
				panic(err)
			}

			defer db.Close()

			var getTables GetTablesFunc = func() ([]string, error) {
				return []string{}, errors.New("not implemented yet")
			}

			if dbName == "PostgreSQL" {
				getTables = func() ([]string, error) {
					return getPostgresTables(db)
				}
			}

			tableStructures, err := getTables()
			if err != nil {
				panic(err)
			}

			if len(tableStructures) < 1 {
				panic(fmt.Errorf("no tables found in %v database", dbName))
			}

			now := time.Now()
			zoneName, zoneOffset := now.Zone()

			var additionalInfo []string
			var systemPrompt bytes.Buffer

			addInfos := func(infos ...string) {
				additionalInfo = append(additionalInfo, infos...)
			}

			systemPrompt.WriteString(
				fmt.Sprintf(`You are a developer of a %v database.
Users have access to one of your database with the following structure:
%v

Users are only able to submit queries as natural human language. Users are also able to send a list of natural human language queries.
You will only return valid SQL queries based on the given database schema without any explanation. Only SELECT statements. Nothing else.
A query from a user can also result in multiple SQL queries. So wrap each SQL string into a single and valid JSON array without anything else.
Make sure that a user gets back a maximum of 1000 rows per SQL query.
You will never change the case of the entries and you will never work with entities which are not in the given list.
Keep sure that you search strings case insensitive and ignore leading and ending whitespace values.
You are not allowed to ask for more details.
You are not allowed to explain anything.
You are not allowed to give your opinion.
You are not allowed to tell about any kind of limitations.`,
					dbName,
					strings.Join(tableStructures, "\n"),
				),
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
				panic(err)
			}

			var sqlStmts []string
			err = json.Unmarshal([]byte(answer), &sqlStmts)
			if err != nil {
				panic(err)
			}

			if len(sqlStmts) < 1 {
				fmt.Println("no SQL statements returned")

				os.Exit(2)
			}

			fmt.Println("The following statements will be executed:")
			for _, stmt := range sqlStmts {
				fmt.Println("- " + stmt)
			}
			os.Stdout.WriteString(fmt.Sprintln())
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
					break
				} else if input == "a" {
					os.Exit(3)
				} else {
					log.Printf("%v not supported", input)
				}
			}

			for _, stmt := range sqlStmts {
				func() {
					rows, err := db.Query(stmt)
					if err != nil {
						return
					}

					defer rows.Close()

					columns, err := rows.Columns()
					if err != nil {
						return
					}

					header := make([]interface{}, len(columns))
					for i := range columns {
						header[i] = columns[i]
					}

					t := table.NewWriter()
					t.SetOutputMirror(os.Stdout)
					t.AppendHeader(header)

					for rows.Next() {
						vals := make([]interface{}, len(columns))
						for i := range columns {
							vals[i] = new(sql.RawBytes)
						}

						rows.Scan(vals...)

						strVals := make([]interface{}, len(columns))
						for i, val := range vals {
							content := reflect.ValueOf(val).Interface().(*sql.RawBytes)

							strVals[i] = string(*content)
						}
						t.AppendRow(strVals)
					}

					if asCSV {
						t.RenderCSV()
					} else {
						t.Render()
					}
				}()
			}
		},
	}

	sqlCmd.Flags().BoolVarP(&asCSV, "csv", "", false, "Output as CSV")
	sqlCmd.Flags().BoolVarP(&openEditor, "editor", "e", false, "Open editor for input")
	sqlCmd.Flags().StringVarP(&connectionStr, "connection", "c", "", "Open editor for input")
	sqlCmd.Flags().Float64VarP(&temperature, "temperature", "t", 1, "Custom temperature between 0 and 2")

	rootCmd.AddCommand(sqlCmd)
}
