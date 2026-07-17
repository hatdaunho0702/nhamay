import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import webauthnRoutes from "./routes/webauthn.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import adminRoutes from "./routes/admin.routes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use(authRoutes);
app.use(webauthnRoutes);
app.use(employeeRoutes);
app.use(adminRoutes);

if (process.argv[1] && process.argv[1].endsWith("server.js")) {
    app.listen(PORT, () => console.log(`Server chạy ở port ${PORT}`));
}
export default app;
