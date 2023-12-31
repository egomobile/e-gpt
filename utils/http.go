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
	"fmt"

	"github.com/fasthttp/router"
	"github.com/valyala/fasthttp"

	egoTypes "github.com/egomobile/e-gpt/types"
)

// AppendRoute adds a route with CORS headers.
func AppendCorsRoute(r *router.Router, method string, route string, handler egoTypes.FHRequestHandler, noOptionsRoute bool) {
	if !noOptionsRoute {
		r.OPTIONS(route, SetupCorsHeaders)
	}

	r.Handle(method, route, func(ctx *fasthttp.RequestCtx) {
		SetupCorsHeaders(ctx)

		handler(ctx)
	})
}

// SendHttpError sends an HTTP 500 error with the given error message.
func SendHttpError(ctx *fasthttp.RequestCtx, err error) {
	var data = []byte(err.Error())

	ctx.SetStatusCode(500)
	ctx.Response.Header.Set("Content-Length", fmt.Sprint(len(data)))
	ctx.Response.Header.Set("Content-Type", "text/plain; charset=UTF-8")

	ctx.Write(data)
}

// SetupCorsHeaders sets the necessary headers to enable CORS on an HTTP response.
func SetupCorsHeaders(ctx *fasthttp.RequestCtx) {
	ctx.Response.Header.Set("Access-Control-Allow-Credentials", "true")
	ctx.Response.Header.Set("Access-Control-Allow-Headers", "*")
	ctx.Response.Header.Set("Access-Control-Allow-Methods", "HEAD,GET,POST,PUT,DELETE,OPTIONS")
	ctx.Response.Header.Set("Access-Control-Allow-Origin", "*")
}
