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
	"net/url"
	"time"

	"github.com/fasthttp/router"
	"github.com/spf13/cobra"
	"github.com/valyala/fasthttp"

	egoUIHandlers "github.com/egomobile/e-gpt/commands/ui/handlers"
	egoUtils "github.com/egomobile/e-gpt/utils"
)

//go:embed all:build
var assets embed.FS

func getAssets() (fs.FS, error) {
	return fs.Sub(assets, "build")
}

// StartUI starts the user interface and serves the frontend assets.
// The UI listens on the given address and port.
// The backend address and port are used to construct the URL for the browser.
// The shouldOpenBrowser parameter controls if the browser is opened automatically or not.
func StartUI(addr string, port int32, backendAddr string, backendPort int32, shouldOpenBrowser bool) {
	// get the frontend assets
	assets, _ := getAssets()

	// serve the frontend assets
	fs := http.FileServer(http.FS(assets))
	http.Handle("/", http.StripPrefix("/", fs))

	// log the listening address and port
	log.Println(fmt.Sprintf("UI will listen on %v:%v ...", addr, port))

	if shouldOpenBrowser {
		// open the browser if shouldOpenBrowser is true
		go func() {
			browserUrl := fmt.Sprintf(
				"http://%v:%v?address=%v&port=%v",
				addr, port,
				url.QueryEscape(backendAddr),
				url.QueryEscape(fmt.Sprintf("%v", backendPort)),
			)

			// print a message before opening the browser
			fmt.Println("Will open browser at", browserUrl, "in 1 second ...")

			// wait for 1 second before opening the browser
			time.Sleep(time.Second)

			// try to open the browser URL
			err := egoUtils.TryOpen(browserUrl)
			if err != nil {
				log.Println("[WARN]", "Could not open browser url", browserUrl, ":", err)
			}
		}()
	}

	// start the http server
	err := http.ListenAndServe(fmt.Sprintf("%v:%v", addr, port), nil)
	if err != nil {
		panic(err)
	}
}

func Init_ui_Command(rootCmd *cobra.Command) {
	var apiListenerAddr = "127.0.0.1"
	var apiPort int32 = 8181
	var defaultTemperature float64
	var noAdditionalInfo bool
	var noSysInfo bool
	var noTime bool
	var shouldNotOpenBrowser bool
	var system string
	var uiListenerAddr = "127.0.0.1"
	var uiPort int32 = 8080

	uiCmd := &cobra.Command{
		Use:     "ui",
		Short:   `Start local UI`,
		Long:    `Starts a local web server with a local UI`,
		Aliases: []string{"u"},

		Run: func(cmd *cobra.Command, args []string) {
			go StartUI(uiListenerAddr, uiPort, apiListenerAddr, apiPort, !shouldNotOpenBrowser)

			router := router.New()
			router.HandleOPTIONS = true

			// chat
			{
				var options egoUIHandlers.CreateChatHandlerOptions
				options.CustomSystemPrompt = system
				options.DefaultTemperature = defaultTemperature
				options.NoAdditionalInfo = noAdditionalInfo
				options.NoSystemInfo = noSysInfo
				options.NoTime = noTime

				egoUtils.AppendCorsRoute(router, "POST", "/api/chat", egoUIHandlers.CreateChatHandler(options), false)
			}

			// get settings
			egoUtils.AppendCorsRoute(router, "GET", "/api/settings", egoUIHandlers.CreateGetSettingsHandler(), false)
			egoUtils.AppendCorsRoute(router, "PUT", "/api/settings", egoUIHandlers.CreateUpdateSettingsHandler(), true)
			egoUtils.AppendCorsRoute(router, "GET", "/api/settings/keys/current", egoUIHandlers.CreateGetApiKeySettingsHandler(), false)

			log.Println(fmt.Sprintf("Chat backend will listen on %v:%v ...", apiListenerAddr, apiPort))
			log.Fatal(fasthttp.ListenAndServe(fmt.Sprintf("%v:%v", apiListenerAddr, apiPort), router.Handler))
		},
	}

	uiCmd.Flags().StringVarP(&uiListenerAddr, "address", "a", "127.0.0.1", "Custom UI listener address")
	uiCmd.Flags().StringVarP(&apiListenerAddr, "api-address", "", "127.0.0.1", "Custom API listener address")
	uiCmd.Flags().StringVarP(&apiListenerAddr, "aa", "", "127.0.0.1", "Custom API listener address")
	uiCmd.Flags().Int32VarP(&apiPort, "api-port", "", 8181, "Custom API port")
	uiCmd.Flags().Int32VarP(&apiPort, "ap", "", 8181, "Custom API port")
	uiCmd.Flags().BoolVarP(&noTime, "no-time", "", false, "Do not add current time to system prompt")
	uiCmd.Flags().BoolVarP(&noTime, "nt", "", false, "Do not add current time to system prompt")
	uiCmd.Flags().BoolVarP(&noSysInfo, "no-sys-info", "", false, "Do not add information about the system at all")
	uiCmd.Flags().BoolVarP(&noSysInfo, "nsi", "", false, "Do not add information about the system at all")
	uiCmd.Flags().BoolVarP(&noAdditionalInfo, "no-additional-info", "", false, "Do not add additional info to system prompt at all")
	uiCmd.Flags().BoolVarP(&noAdditionalInfo, "nai", "", false, "Do not add additional info to system prompt at all")
	uiCmd.Flags().BoolVarP(&shouldNotOpenBrowser, "do-not-open", "", false, "Do not open browser after start")
	uiCmd.Flags().BoolVarP(&shouldNotOpenBrowser, "dno", "", false, "Do not open browser after start")
	uiCmd.Flags().StringVarP(&system, "system", "s", "", "Custom system prompt")
	uiCmd.Flags().Int32VarP(&uiPort, "port", "p", 8080, "Custom UI port")
	uiCmd.Flags().Float64VarP(&defaultTemperature, "temperature", "t", 1, "Custom temperature between 0 and 2")

	rootCmd.AddCommand(uiCmd)
}
