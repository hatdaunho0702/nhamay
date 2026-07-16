import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, "db.json");

const initialData = {
    employees: {
        "NBC012345": {
            employeeId: "NBC012345",
            password: "password123",
            name: "Nguyễn Văn An",
            role: "Nhân viên Sản xuất",
            department: "Phòng Sản xuất - Line 2",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
            dob: "12/05/1992",
            gender: "Nam",
            email: "nguyenvanan@nbc.com.vn",
            phone: "0987 654 321",
            joinDate: "15/08/2020",
            workLocation: "Nhà máy NBC - KCN VSIP II",
            status: "Đang làm việc",
        },
        "NBC001": {
            employeeId: "NBC001",
            password: "12345",
            name: "Nguyễn Văn Một",
            role: "Nhân viên Kỹ thuật",
            department: "Phòng Kỹ thuật - Line 1",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
            dob: "01/01/1990",
            gender: "Nam",
            email: "nguyenvanmot@nbc.com.vn",
            phone: "0901 234 561",
            joinDate: "10/01/2019",
            workLocation: "Nhà máy NBC - KCN VSIP II",
            status: "Đang làm việc",
        },
        "NBC002": {
            employeeId: "NBC002",
            password: "12345",
            name: "Trần Thị Hai",
            role: "Nhân viên Kiểm hàng",
            department: "Phòng QC - Line 2",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
            dob: "02/02/1995",
            gender: "Nữ",
            email: "tranthihai@nbc.com.vn",
            phone: "0901 234 562",
            joinDate: "20/03/2021",
            workLocation: "Nhà máy NBC - KCN VSIP II",
            status: "Đang làm việc",
        },
        "NBC003": {
            employeeId: "NBC003",
            password: "12345",
            name: "Lê Văn Ba",
            role: "Nhân viên Vận hành",
            department: "Phòng Sản xuất - Line 3",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
            dob: "03/03/1993",
            gender: "Nam",
            email: "levanba@nbc.com.vn",
            phone: "0901 234 563",
            joinDate: "15/06/2022",
            workLocation: "Nhà máy NBC - KCN VSIP II",
            status: "Đang làm việc",
        },
        "NBC004": {
            employeeId: "NBC004",
            password: "12345",
            name: "Phạm Thị Bốn",
            role: "Nhân viên Đóng gói",
            department: "Phòng Đóng gói - Line 4",
            avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&q=80",
            dob: "04/04/1997",
            gender: "Nữ",
            email: "phamthibon@nbc.com.vn",
            phone: "0901 234 564",
            joinDate: "01/11/2023",
            workLocation: "Nhà máy NBC - KCN VSIP II",
            status: "Đang làm việc",
        },
        "NBC005": {
            employeeId: "NBC005",
            password: "12345",
            name: "Hoàng Văn Năm",
            role: "Trưởng nhóm Sản xuất",
            department: "Phòng Sản xuất - Line 5",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80",
            dob: "05/05/1988",
            gender: "Nam",
            email: "hoangvannam@nbc.com.vn",
            phone: "0901 234 565",
            joinDate: "12/04/2018",
            workLocation: "Nhà máy NBC - KCN VSIP II",
            status: "Đang làm việc",
        },
        "admin": {
            employeeId: "admin",
            password: "admin",
            name: "Admin System",
            role: "Admin",
            department: "Phòng Quản trị",
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80",
            dob: "01/01/1985",
            gender: "Nam",
            email: "admin@nbc.com.vn",
            phone: "0900 000 000",
            joinDate: "01/01/2015",
            workLocation: "Văn phòng NBC",
            status: "Đang làm việc",
        }
    },
    requests: {
        "NBC012345": [
            {
                id: 1,
                type: "Nghỉ phép năm",
                details: "Từ 26/05/2025 đến 28/05/2025",
                reason: "Nghỉ phép năm",
                status: "Chờ duyệt",
                createdAt: "20/05/2025",
            },
            {
                id: 2,
                type: "Làm thêm giờ",
                details: "Ngày 18/05/2025 (Chủ nhật), Thời gian: 2.0 giờ",
                reason: "Tăng ca sản xuất",
                status: "Đã duyệt",
                createdAt: "16/05/2025",
            }
        ]
    },
    credentials: {} // Key: credentialId, Value: { employeeId, publicKey, counter }
};

// Initialize database file if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 4), "utf8");
}

function readDb() {
    try {
        const data = fs.readFileSync(DB_FILE, "utf8");
        const parsed = JSON.parse(data);
        // Ensure admin account exists in database
        if (parsed && parsed.employees && !parsed.employees["admin"]) {
            parsed.employees["admin"] = {
                employeeId: "admin",
                password: "admin",
                name: "Admin System",
                role: "Admin",
                department: "Phòng Quản trị",
                avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80",
                dob: "01/01/1985",
                gender: "Nam",
                email: "admin@nbc.com.vn",
                phone: "0900 000 000",
                joinDate: "01/01/2015",
                workLocation: "Văn phòng NBC",
                status: "Đang làm việc",
            };
            fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 4), "utf8");
        }
        return parsed;
    } catch (error) {
        console.error("Error reading database file, resetting to initial data:", error);
        return initialData;
    }
}

function writeDb(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 4), "utf8");
    } catch (error) {
        console.error("Error writing database file:", error);
    }
}

export const db = {
    getEmployees: () => {
        return readDb().employees;
    },
    getEmployee: (employeeId) => {
        return readDb().employees[employeeId];
    },
    getRequests: (employeeId) => {
        const data = readDb();
        if (!data.requests[employeeId]) {
            // Initialize empty requests for new employee
            data.requests[employeeId] = [
                {
                    id: 1,
                    type: "Nghỉ phép năm",
                    details: "Từ 26/05/2025 đến 28/05/2025",
                    reason: "Nghỉ phép năm",
                    status: "Chờ duyệt",
                    createdAt: "20/05/2025",
                },
                {
                    id: 2,
                    type: "Làm thêm giờ",
                    details: "Ngày 18/05/2025 (Chủ nhật), Thời gian: 2.0 giờ",
                    reason: "Tăng ca sản xuất",
                    status: "Đã duyệt",
                    createdAt: "16/05/2025",
                }
            ];
            writeDb(data);
        }
        return data.requests[employeeId];
    },
    addRequest: (employeeId, request) => {
        const data = readDb();
        if (!data.requests[employeeId]) {
            data.requests[employeeId] = [];
        }
        data.requests[employeeId].unshift(request);
        writeDb(data);
    },
    getCredentials: () => {
        return readDb().credentials || {};
    },
    getCredential: (credentialId) => {
        return (readDb().credentials || {})[credentialId];
    },
    saveCredential: (credentialId, credentialInfo) => {
        const data = readDb();
        if (!data.credentials) {
            data.credentials = {};
        }
        data.credentials[credentialId] = credentialInfo;
        writeDb(data);
    },
    deleteCredentialsForEmployee: (employeeId) => {
        const data = readDb();
        if (data.credentials) {
            Object.keys(data.credentials).forEach(id => {
                if (data.credentials[id].employeeId === employeeId) {
                    delete data.credentials[id];
                }
            });
            writeDb(data);
        }
    },
    saveEmployee: (employeeId, employeeData) => {
        const data = readDb();
        data.employees[employeeId] = {
            ...data.employees[employeeId],
            ...employeeData,
            employeeId
        };
        writeDb(data);
    },
    deleteEmployee: (employeeId) => {
        const data = readDb();
        delete data.employees[employeeId];
        delete data.requests[employeeId];
        if (data.credentials) {
            Object.keys(data.credentials).forEach(id => {
                if (data.credentials[id].employeeId === employeeId) {
                    delete data.credentials[id];
                }
            });
        }
        writeDb(data);
    }
};
