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

package ui

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"time"

	egoUtils "github.com/egomobile/e-gpt/utils"
)

//go:embed all:build
var assets embed.FS

func getAssets() (fs.FS, error) {
	return fs.Sub(assets, "build")
}

func StartUI(addr string, port int32, shouldOpenBrowser bool) {
	assets, _ := getAssets()

	fs := http.FileServer(http.FS(assets))
	http.Handle("/", http.StripPrefix("/", fs))

	log.Println(fmt.Sprintf("UI will listen on %v:%v ...", addr, port))

	if shouldOpenBrowser {
		go func() {
			browserUrl := fmt.Sprintf("http://%v:%v", addr, port)

			fmt.Println("Will open browser at", browserUrl, "in 1 second ...")

			time.Sleep(time.Second)

			err := egoUtils.TryOpen(browserUrl)
			if err != nil {
				log.Println("[WARN]", "Could not open browser:", err)
			}
		}()
	}

	err := http.ListenAndServe(fmt.Sprintf("%v:%v", addr, port), nil)
	if err != nil {
		panic(err)
	}
}
