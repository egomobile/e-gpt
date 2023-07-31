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

package handlers

import (
	"encoding/json"
	"fmt"
	"os"
	"path"

	"github.com/valyala/fasthttp"

	egoTypes "github.com/egomobile/e-gpt/types"
	egoUtils "github.com/egomobile/e-gpt/utils"
)

type GetApiKeySettingsResponse struct {
	AccessType string `json:"accessType"` // Access type
	Error      string `json:"error"`      // Error message, which detecting `AccessType`
}

// CreateGetApiKeySettingsHandler returns a handler function for getting API key settings.
func CreateGetApiKeySettingsHandler() egoTypes.FHRequestHandler {
	return func(ctx *fasthttp.RequestCtx) {
		var response GetApiKeySettingsResponse

		// Get the API access type
		accessType, err := egoUtils.GetApiAccessType()
		if err != nil {
			response.Error = err.Error()
		} else {
			response.AccessType = accessType
		}

		// Marshal the response into JSON format
		data, err := json.Marshal(response)
		if err != nil {
			egoUtils.SendHttpError(ctx, err)
			return
		}

		// Set the response headers
		ctx.SetStatusCode(200)
		ctx.Response.Header.Set("Content-Length", fmt.Sprint(len(data)))
		ctx.Response.Header.Set("Content-Type", "application/json; charset=UTF-8")

		// Write the response data to the response body
		ctx.Write(data)
	}
}

// CreateGetSettingsHandler returns a fasthttp request handler that retrieves the UI settings file.
func CreateGetSettingsHandler() egoTypes.FHRequestHandler {
	return func(ctx *fasthttp.RequestCtx) {
		// Get the file path of the UI settings file.
		filePath, err := egoUtils.GetUISettingsFilePath()
		if err != nil {
			egoUtils.SendHttpError(ctx, err)
			return
		}

		// Check if the file exists.
		_, err = os.Stat(filePath)
		if err != nil {
			if os.IsNotExist(err) {
				ctx.SetStatusCode(404)
			} else {
				egoUtils.SendHttpError(ctx, err)
			}
		} else {
			// Read the file and send it in the response body.
			data, err := os.ReadFile(filePath)
			if err != nil {
				egoUtils.SendHttpError(ctx, err)
			} else {
				ctx.Response.Header.Set("Content-Length", fmt.Sprint(len(data)))

				ctx.Write(data)
			}
		}
	}
}

// CreateUpdateSettingsHandler returns a fasthttp request handler that updates the UI settings file.
func CreateUpdateSettingsHandler() egoTypes.FHRequestHandler {
	return func(ctx *fasthttp.RequestCtx) {
		// Get the request body.
		body := ctx.PostBody()

		// Get the file path of the UI settings file.
		settingsFilePath, err := egoUtils.GetUISettingsFilePath()
		if err != nil {
			egoUtils.SendHttpError(ctx, err)
			return
		}

		// Ensure that the directory of the file exists.
		_, err = egoUtils.EnsureDir(
			path.Dir(settingsFilePath),
		)
		if err != nil {
			egoUtils.SendHttpError(ctx, err)
			return
		}

		// Write the request body to the file.
		err = os.WriteFile(settingsFilePath, body, 0700)
		if err != nil {
			egoUtils.SendHttpError(ctx, err)
		} else {
			ctx.SetStatusCode(204)
		}
	}
}
