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

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App/App';
import axios from "axios";

const params = new URLSearchParams(window.location.search || '');

let backendPort = parseInt(params.get('port')?.trim() || '');
if (Number.isNaN(backendPort)) {
  backendPort = 8181;
}

let backendAddress = params.get('address')?.trim() || '';
if (!backendAddress) {
  backendAddress = "127.0.0.1";
}

axios.defaults.baseURL = `http://${backendAddress}:${backendPort}/api`;

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
