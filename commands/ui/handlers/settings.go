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
	"fmt"
	"os"
	"path"

	"github.com/valyala/fasthttp"

	egoTypes "github.com/egomobile/e-gpt/types"
	egoUtils "github.com/egomobile/e-gpt/utils"
)

func CreateGetSettingsHandler() egoTypes.FHRequestHandler {
	return func(ctx *fasthttp.RequestCtx) {
		egoUtils.SetupCorsHeaders(ctx)

		filePath, err := egoUtils.GetUISettingsFilePath()
		if err != nil {
			egoUtils.SendHttpError(ctx, err)
			return
		}

		_, err = os.Stat(filePath)
		if err != nil {
			if os.IsNotExist(err) {
				ctx.SetStatusCode(404)
			} else {
				egoUtils.SendHttpError(ctx, err)
			}
		} else {
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

func CreateUpdateSettingsHandler() egoTypes.FHRequestHandler {
	return func(ctx *fasthttp.RequestCtx) {
		egoUtils.SetupCorsHeaders(ctx)

		body := ctx.PostBody()

		settingsFilePath, err := egoUtils.GetUISettingsFilePath()
		if err != nil {
			egoUtils.SendHttpError(ctx, err)
			return
		}

		_, err = egoUtils.EnsureDir(
			path.Dir(settingsFilePath),
		)
		if err != nil {
			egoUtils.SendHttpError(ctx, err)
			return
		}

		err = os.WriteFile(settingsFilePath, body, 0700)
		if err != nil {
			egoUtils.SendHttpError(ctx, err)
		} else {
			ctx.SetStatusCode(204)
		}
	}
}
