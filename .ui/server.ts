import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { createServer, json } from '@egomobile/http-server';

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
        const { body } = request;

        try {
            response.write(JSON.stringify({
                answer: 'Your prompt: ' + body.prompt
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
            JSON.stringify(request.body)
        );
        await fs.promises.writeFile(settingsFile, data);

        response.writeHead(204, {
            'Content-Length': '0'
        });
    });

    await app.listen(8181);

    console.log('ℹ️ Mock server now running on port', app.port);
}

main().catch(console.error);
