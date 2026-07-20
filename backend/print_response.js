import fetch from "node-fetch";
import fs from "fs";

const BASE_URL = "https://nhamay-delta.vercel.app";
const ADMIN_ID = "admin";
const ADMIN_PASSWORD = "admin123";

console.log("Sending POST to /api/login...");
try {
    const res = await fetch(`${BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: ADMIN_ID, password: ADMIN_PASSWORD })
    });
    console.log("Status:", res.status);
    const headers = Object.fromEntries(res.headers.entries());
    const text = await res.text();
    fs.writeFileSync("response_debug.txt", JSON.stringify({
        status: res.status,
        headers,
        bodyPreview: text.substring(0, 2000)
    }, null, 2), "utf8");
    console.log("Wrote response to response_debug.txt");
} catch (err) {
    console.error("Error:", err.message);
}
process.exit(0);
