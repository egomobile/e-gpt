const cors = require('cors');
const { createServer, json } = require('@egomobile/http-server');

async function main() {
    const app = createServer();

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

    await app.listen(3001);

    console.log('ℹ️ Mock server now running on port', app.port);
}

main().catch(console.error);
