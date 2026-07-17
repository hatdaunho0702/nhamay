import crypto from "crypto";
import { SESSION_SECRET } from "../config/env.js";

export function signPayload(payload) {
    return crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
}

export function verifySignedPayload(payload, signature) {
    const expectedSignature = signPayload(payload);
    return signature === expectedSignature;
}

export function generateSessionToken(employeeId) {
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    const payload = `${employeeId}.${expiresAt}`;
    const signature = signPayload(payload);
    return `${payload}.${signature}`;
}

export function verifySessionToken(token) {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [employeeId, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) return null;
    const payload = `${employeeId}.${expiresAt}`;
    if (!verifySignedPayload(payload, signature)) return null;
    return { employeeId };
}
