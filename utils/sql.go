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

package utils

import (
	"database/sql"
	"errors"
	"fmt"
	"net/url"
	"os"
	"strings"

	_ "github.com/lib/pq"
)

// OpenSQLConnection opens a connection to a SQL database and returns the database object, the display name of the database provider, and an error, if any.
func OpenSQLConnection(connectionStr string) (*sql.DB, string, error) {
	connectionStr = strings.TrimSpace(connectionStr)
	if connectionStr == "" {
		connectionStr = strings.TrimSpace(os.Getenv("DATABASE_URL"))
	}

	if connectionStr == "" {
		return nil, "", errors.New("no connection string defined")
	}

	u, err := url.Parse(connectionStr)
	if err != nil {
		return nil, "", err
	}

	scheme := strings.TrimSpace(strings.ToLower(u.Scheme))
	var dbName string
	switch scheme {
	case "postgres":
		dbName = "PostgreSQL"
	default:
		return nil, scheme, fmt.Errorf("unknown URL scheme %v", scheme)
	}

	db, err := sql.Open(scheme, connectionStr)
	if err != nil {
		return nil, scheme, err
	}

	return db, dbName, nil
}
