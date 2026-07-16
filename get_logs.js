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
        console.log("Targets:", targets);
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
