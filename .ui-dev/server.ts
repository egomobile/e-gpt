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

import _ from 'lodash';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { createServer, json } from '@egomobile/http-server';

interface IChatBody {
    conversation: string[];
}

async function ensureTempDir() {
    const tempDir = path.join(process.cwd(), '.temp');

    if (!fs.existsSync(tempDir)) {
        await fs.promises.mkdir(tempDir, { recursive: true });
    }

    const stat = await fs.promises.stat(tempDir);
    if (!stat.isDirectory()) {
        throw new Error(`${tempDir} is no directory!`);
    }

    return tempDir;
}

async function main() {
    const tempDir = await ensureTempDir();
    const settingsFile = path.join(tempDir, 'settings.json');

    const app = createServer();

    // CORS
    app.use(cors());
    app.options(() => true, (request, response) => {
        response.writeHead(204, {
            'Content-Length': '0'
        });
        response.end();
    });

    app.post('/api/chat', [json()], async (request, response) => {
        const body = request.body as IChatBody;

        const lastUserMessage = _(body.conversation)
            .filter((message, messageIndex) => {
                return messageIndex % 2 === 1;
            })
            .last();

        try {
            response.write(JSON.stringify({
                answer: 'Your prompt: ' + lastUserMessage
            }));

            response.end();
        } catch (error) {
            console.error('[ERROR]', '/api/chat', error);
        }
    });

    // get settings
    app.get('/api/settings', [json()], async (request, response) => {
        if (fs.existsSync(settingsFile)) {
            const data = await fs.promises.readFile(settingsFile);

            response.writeHead(200, {
                'Content-Length': String(data.length)
            });
            response.write(data);
        } else {
            response.writeHead(404, {
                'Content-Length': '0'
            });
        }
    });

    // save settings
    app.put('/api/settings', [json()], async (request, response) => {
        const data = Buffer.from(
            JSON.stringify(request.body, null, 2)
        );
        await fs.writeFileSync(settingsFile, data);

        response.writeHead(204, {
            'Content-Length': '0'
        });
    });

    await app.listen(8181);

    console.log('ℹ️ Mock server now running on port', app.port);
}

main().catch(console.error);
