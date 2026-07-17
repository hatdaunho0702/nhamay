import { Router } from "express";
import { verifyRegistrationResponse, verifyAuthenticationResponse } from "@simplewebauthn/server";
import { db } from "../db.js";
import { requireSession } from "../middleware/requireSession.js";
import { generateSessionToken, signPayload, verifySignedPayload } from "../utils/token.js";

const router = Router();

/**
 * POST /api/auth/webauthn/register-challenge
 * Generates a registration challenge for the logged-in user.
 */
router.post("/api/auth/webauthn/register-challenge", requireSession, async (req, res) => {
    const empId = req.employeeId;
    const employee = await db.getEmployee(empId);
    if (!employee) {
        return res.status(404).json({ success: false, message: "Không tìm thấy nhân viên" });
    }

    const host = req.headers.host ? req.headers.host.split(":")[0] : "localhost";

    // Generate a random challenge (base64url encoded)
    const challenge = Buffer.from(Math.random().toString(36).substring(2) + Date.now().toString()).toString("base64url");

    // Sign the challenge to make it stateless
    const expiresAt = Date.now() + 60000; // 1 minute
    const payload = `${challenge}.${expiresAt}.${empId}`;
    const signature = signPayload(payload);
    const sessionId = `${payload}.${signature}`;

    return res.status(200).json({
        success: true,
        sessionId,
        publicKey: {
            challenge,
            rp: {
                name: "NBC HR System",
                id: host,
            },
            user: {
                id: Buffer.from(empId).toString("base64url"),
                name: employee.email || empId,
                displayName: employee.name,
            },
            pubKeyCredParams: [
                { alg: -7, type: "public-key" }, // ES256
                { alg: -257, type: "public-key" }, // RS256
            ],
            timeout: 60000,
            authenticatorSelection: {
                authenticatorAttachment: "platform",
                userVerification: "required",
                residentKey: "required",
                requireResidentKey: true,
            },
            attestation: "none",
        }
    });
});

/**
 * POST /api/auth/webauthn/register-verify
 * Verifies and saves the new credential.
 */
router.post("/api/auth/webauthn/register-verify", requireSession, async (req, res) => {
    const empId = req.employeeId;
    const { credential, sessionId } = req.body;

    if (!credential || !credential.id || !sessionId) {
        return res.status(400).json({ success: false, message: "Dữ liệu xác thực không hợp lệ" });
    }

    // Verify stateless sessionId challenge
    const parts = sessionId.split(".");
    if (parts.length !== 4) {
        return res.status(400).json({ success: false, message: "Phiên đăng ký không hợp lệ" });
    }
    const [savedChallenge, expiresAtStr, challengeEmpId, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt || challengeEmpId !== empId) {
        return res.status(400).json({ success: false, message: "Yêu cầu đăng ký đã hết hạn hoặc không khớp" });
    }
    const payload = `${savedChallenge}.${expiresAt}.${challengeEmpId}`;
    if (!verifySignedPayload(payload, signature)) {
        return res.status(400).json({ success: false, message: "Chữ ký phiên đăng ký không hợp lệ" });
    }

    try {
        const host = req.headers.host ? req.headers.host.split(":")[0] : "localhost";
        const origin = req.headers.origin || `https://${host}`;

        const verification = await verifyRegistrationResponse({
            response: credential,
            expectedChallenge: savedChallenge,
            expectedOrigin: origin,
            expectedRPID: host,
            requireUserVerification: true,
        });

        if (!verification.verified) {
            return res.status(400).json({ success: false, message: "Xác minh đăng ký sinh trắc học thất bại" });
        }

        const { registrationInfo } = verification;
        const { credentialPublicKey, counter } = registrationInfo;

        // Generate a signed credential token for the client to store statelessly
        const credentialInfo = {
            id: credential.id,
            publicKey: Buffer.from(credentialPublicKey).toString("base64url"),
            counter,
            employeeId: empId,
        };
        const credPayload = JSON.stringify(credentialInfo);
        const credSignature = signPayload(credPayload);
        const signedCredential = { payload: credPayload, signature: credSignature };

        // Save credential to database
        await db.saveCredential(credential.id, credentialInfo);

        console.log(`Registered biometric credential ${credential.id} for employee ${empId}`);

        return res.status(200).json({
            success: true,
            message: "Đăng ký sinh trắc học thành công!",
            signedCredential,
        });
    } catch (error) {
        console.error("Registration verification error:", error);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi xác minh đăng ký" });
    }
});

/**
 * POST /api/auth/webauthn/unregister
 * Deletes the credential for the logged-in user.
 */
router.post("/api/auth/webauthn/unregister", requireSession, async (req, res) => {
    const empId = req.employeeId;
    try {
        await db.deleteCredentialsForEmployee(empId);
        console.log(`Unregistered biometric credentials for employee ${empId}`);
        return res.status(200).json({
            success: true,
            message: "Đã tắt đăng nhập bằng sinh trắc học thành công!",
        });
    } catch (err) {
        console.error("Error unregistering biometrics:", err);
        return res.status(500).json({ success: false, message: "Không thể lưu dữ liệu, vui lòng thử lại sau" });
    }
});

/**
 * POST /api/auth/webauthn/challenge
 * Generates a login challenge.
 */
router.post("/api/auth/webauthn/challenge", (req, res) => {
    const { mode } = req.body || {};
    const ttl = mode === "conditional" ? 300000 : 60000; // 5 minutes for conditional UI, 1 minute otherwise

    // Generate a random challenge
    const challenge = Buffer.from(Math.random().toString(36).substring(2) + Date.now().toString()).toString("base64url");

    // Sign the challenge to make it stateless
    const expiresAt = Date.now() + ttl;
    const payload = `${challenge}.${expiresAt}`;
    const signature = signPayload(payload);
    const sessionId = `${payload}.${signature}`;

    return res.status(200).json({
        success: true,
        sessionId,
        publicKey: {
            challenge,
            timeout: ttl,
            rpId: req.hostname === "localhost" ? "localhost" : req.hostname,
            userVerification: "required",
        }
    });
});

/**
 * POST /api/auth/webauthn/verify
 * Verifies the login assertion and authenticates the user.
 */
router.post("/api/auth/webauthn/verify", async (req, res) => {
    const { credential, sessionId, signedCredential } = req.body;

    if (!credential || !credential.id || !sessionId) {
        return res.status(400).json({ success: false, message: "Dữ liệu xác thực không hợp lệ" });
    }

    // Verify stateless sessionId challenge
    const parts = sessionId.split(".");
    if (parts.length !== 3) {
        return res.status(400).json({ success: false, message: "Phiên xác thực không hợp lệ" });
    }
    const [savedChallenge, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
        return res.status(400).json({ success: false, message: "Phiên xác thực đã hết hạn, vui lòng thử lại" });
    }
    const payload = `${savedChallenge}.${expiresAt}`;
    if (!verifySignedPayload(payload, signature)) {
        return res.status(400).json({ success: false, message: "Chữ ký phiên xác thực không hợp lệ" });
    }

    // Look up credential in database
    let savedCred = await db.getCredential(credential.id);

    // Fallback to signedCredential if database doesn't have it (for backward compatibility)
    if (!savedCred && signedCredential && signedCredential.payload && signedCredential.signature) {
        if (verifySignedPayload(signedCredential.payload, signedCredential.signature)) {
            savedCred = JSON.parse(signedCredential.payload);
        }
    }

    if (!savedCred) {
        return res.status(401).json({
            success: false,
            message: "Thiết bị sinh trắc học này chưa được đăng ký hoặc không khớp với tài khoản nào",
        });
    }

    const employee = await db.getEmployee(savedCred.employeeId);
    if (!employee) {
        return res.status(404).json({
            success: false,
            message: "Không tìm thấy thông tin nhân viên liên kết với thiết bị này",
        });
    }

    try {
        const host = req.headers.host ? req.headers.host.split(":")[0] : "localhost";
        const origin = req.headers.origin || `https://${host}`;

        const verification = await verifyAuthenticationResponse({
            response: credential,
            expectedChallenge: savedChallenge,
            expectedOrigin: origin,
            expectedRPID: host,
            authenticator: {
                credentialID: Buffer.from(savedCred.id, "base64url"),
                credentialPublicKey: Buffer.from(savedCred.publicKey, "base64url"),
                counter: savedCred.counter,
            },
            requireUserVerification: true,
        });

        if (!verification.verified) {
            return res.status(401).json({ success: false, message: "Xác thực sinh trắc học thất bại" });
        }

        // Cập nhật counter mới và sinh signedCredential mới
        const newCounter = verification.authenticationInfo.newCounter;
        const updatedCredInfo = {
            ...savedCred,
            counter: newCounter,
        };
        await db.saveCredential(credential.id, updatedCredInfo);

        const updatedPayload = JSON.stringify(updatedCredInfo);
        const updatedSignature = signPayload(updatedPayload);
        const newSignedCredential = { payload: updatedPayload, signature: updatedSignature };

        // Sinh session token không trạng thái bảo mật
        const sessionToken = generateSessionToken(employee.employeeId);

        console.log(`Biometric login successful for employee ${employee.employeeId}`);

        return res.status(200).json({
            success: true,
            message: "Đăng nhập bằng sinh trắc học thành công!",
            sessionToken,
            signedCredential: newSignedCredential,
            user: {
                employeeId: employee.employeeId,
                name: employee.name,
                role: employee.role,
            },
        });
    } catch (error) {
        console.error("Authentication verification error:", error);
        return res.status(401).json({ success: false, message: "Xác thực sinh trắc học thất bại" });
    }
});

/**
 * GET /api/auth/webauthn/status
 * Helper endpoint to check if the current user has biometric enrolled.
 */
router.get("/api/auth/webauthn/status", requireSession, async (req, res) => {
    const empId = req.employeeId;
    const creds = Object.values(await db.getCredentials()).filter(c => c.employeeId === empId);
    return res.status(200).json({
        success: true,
        hasBiometricEnrolled: creds.length > 0,
    });
});

export default router;
