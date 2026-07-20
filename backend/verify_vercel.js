import fetch from "node-fetch";
import fs from "fs";

const BASE_URL = "https://nhamay-delta.vercel.app";
const ADMIN_ID = "admin";
const ADMIN_PASSWORD = "admin123";

async function login() {
    console.log("Logging in as admin...");
    const res = await fetch(`${BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: ADMIN_ID, password: ADMIN_PASSWORD })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        console.error("Login failed:", data);
        process.exit(1);
    }
    console.log("Login successful!");
    fs.writeFileSync("token.txt", data.sessionToken, "utf8");
    console.log("Saved token to token.txt");
    return data.sessionToken;
}

async function createEmployee(token, employeeId) {
    console.log(`Creating employee ${employeeId}...`);
    const res = await fetch(`${BASE_URL}/api/admin/employees`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            employeeId,
            password: "password123",
            name: `Test Employee ${employeeId}`,
            role: "Nhân viên Kỹ thuật",
            department: "Phòng Kỹ thuật",
            status: "Đang làm việc"
        })
    });
    const data = await res.json();
    console.log("Response:", res.status, data);
}

async function listEmployees(token, expectedId = null) {
    console.log("Listing employees...");
    const res = await fetch(`${BASE_URL}/api/admin/employees`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        console.error("Failed to list employees:", data);
        process.exit(1);
    }
    console.log(`Total employees: ${data.employees.length}`);
    const found = data.employees.find(e => e.employeeId === expectedId);
    if (expectedId) {
        if (found) {
            console.log(`SUCCESS: Found expected employee ${expectedId}!`);
        } else {
            console.log(`FAILURE: Expected employee ${expectedId} NOT found!`);
        }
    } else {
        console.log("Employees in list:", data.employees.map(e => e.employeeId).join(", "));
    }
}

async function deleteEmployee(token, employeeId) {
    console.log(`Deleting employee ${employeeId}...`);
    const res = await fetch(`${BASE_URL}/api/admin/employees/${employeeId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    console.log("Response:", res.status, data);
}

const action = process.argv[2];
const arg = process.argv[3];
let token = process.argv[4];

if (!action) {
    console.log("Usage: node verify_vercel.js <login|create|list|delete> [arg] [token]");
    process.exit(0);
}

if (action !== "login" && !token) {
    if (fs.existsSync("token.txt")) {
        token = fs.readFileSync("token.txt", "utf8").trim();
    } else {
        console.error("Missing token and token.txt not found. Run login first.");
        process.exit(1);
    }
}

if (action === "login") {
    await login();
} else if (action === "create") {
    if (!arg) {
        console.error("Missing employeeId");
        process.exit(1);
    }
    await createEmployee(token, arg);
} else if (action === "list") {
    await listEmployees(token, arg);
} else if (action === "delete") {
    if (!arg) {
        console.error("Missing employeeId");
        process.exit(1);
    }
    await deleteEmployee(token, arg);
}
