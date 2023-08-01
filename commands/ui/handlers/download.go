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
	"strings"

	"github.com/valyala/fasthttp"

	egoTypes "github.com/egomobile/e-gpt/types"
	egoUtils "github.com/egomobile/e-gpt/utils"
)

func CreateDownloadHandler() egoTypes.FHRequestHandler {
	return func(ctx *fasthttp.RequestCtx) {
		downloadUrl := strings.TrimSpace(
			string(ctx.QueryArgs().Peek("u")),
		)

		if !strings.HasPrefix(downloadUrl, "http") {
			downloadUrl = fmt.Sprintf("https://%v", downloadUrl)
		}

		req := fasthttp.AcquireRequest()
		req.SetRequestURI(downloadUrl)
		req.Header.SetMethod("GET")

		client := &fasthttp.Client{}

		resp := fasthttp.AcquireResponse()
		err := client.Do(req, resp)
		if err != nil {
			egoUtils.SendHttpError(ctx, err)
			return
		}

		defer fasthttp.ReleaseResponse(resp)

		// copy status code
		ctx.Response.SetStatusCode(resp.StatusCode())

		// copy headers
		resp.Header.VisitAll(func(key []byte, value []byte) {
			ctx.Response.Header.Set(string(key), string(value))
		})

		// copy body
		ctx.Response.SetBody(resp.Body())
	}
}
