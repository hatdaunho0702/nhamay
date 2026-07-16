import http from 'http';

const getJSON = (url) => {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
};

async function main() {
    try {
        const targets = await getJSON('http://localhost:9222/json');
        const target = targets.find(t => t.type === 'page' && t.url.includes('localhost:5173'));
        if (!target) {
            console.log("No page target found for localhost:5173. Targets:", targets);
            return;
        }

        console.log("Connecting to:", target.webSocketDebuggerUrl);
        const ws = new WebSocket(target.webSocketDebuggerUrl);

        ws.onopen = () => {
            console.log("Connected to Chrome!");
            ws.send(JSON.stringify({ id: 1, method: "Runtime.enable" }));
            ws.send(JSON.stringify({ id: 2, method: "Log.enable" }));
            ws.send(JSON.stringify({ id: 3, method: "Page.enable" }));
            // Wait 500ms then reload
            setTimeout(() => {
                console.log("Reloading page...");
                ws.send(JSON.stringify({ id: 4, method: "Page.reload" }));
            }, 500);
        };

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.method === "Runtime.consoleAPICalled") {
                const args = msg.params.args.map(a => a.value || a.description || JSON.stringify(a));
                console.log(`[Console ${msg.params.type}]`, ...args);
            } else if (msg.method === "Log.entryAdded") {
                console.log(`[Log]`, msg.params.entry.text);
            } else if (msg.method === "Runtime.exceptionThrown") {
                console.error(`[Exception]`, msg.params.exceptionDetails.exception.description || msg.params.exceptionDetails.text);
            }
        };

        ws.onerror = (err) => {
            console.error("WebSocket Error:", err);
        };

        setTimeout(() => {
            console.log("Closing connection.");
            ws.close();
            process.exit(0);
        }, 5000);

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
