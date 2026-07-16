import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, getDocs, collection, deleteDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfig = {
    apiKey: "AIzaSyDjcZpFjc51LWcOUL6w8ebsMiR0zGs_8F8",
    authDomain: "cuahangdienmay-9e28c.firebaseapp.com",
    projectId: "cuahangdienmay-9e28c",
    storageBucket: "cuahangdienmay-9e28c.firebasestorage.app",
    messagingSenderId: "965631598853",
    appId: "1:965631598853:web:3f969b3f7cd47186b1576c",
    measurementId: "G-0K34KWCB96"
};

// Initialize Firebase
let app;
let firestore;
let useFirebase = false;

try {
    app = initializeApp(firebaseConfig);
    firestore = getFirestore(app);
    useFirebase = true;
    console.log("Firebase initialized successfully");
} catch (err) {
    console.error("Failed to initialize Firebase, falling back to local file/memory:", err.message);
}

// Local File / Memory Fallback
let DB_FILE = path.join(__dirname, "db.json");
let memoryDb = null;

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
    credentials: {}
};

try {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 4), "utf8");
    } else {
        const data = fs.readFileSync(DB_FILE, "utf8");
        fs.writeFileSync(DB_FILE, data, "utf8");
    }
} catch (e) {
    DB_FILE = path.join("/tmp", "db.json");
    if (!fs.existsSync(DB_FILE)) {
        try {
            fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 4), "utf8");
        } catch (err) {
            memoryDb = JSON.parse(JSON.stringify(initialData));
        }
    }
}

function readDb() {
    try {
        if (memoryDb) return memoryDb;
        const data = fs.readFileSync(DB_FILE, "utf8");
        const parsed = JSON.parse(data);
        if (parsed && parsed.employees && !parsed.employees["admin"]) {
            parsed.employees["admin"] = initialData.employees["admin"];
            try {
                fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 4), "utf8");
            } catch (wErr) { }
        }
        return parsed;
    } catch (error) {
        if (!memoryDb) {
            memoryDb = JSON.parse(JSON.stringify(initialData));
        }
        return memoryDb;
    }
}

function writeDb(data) {
    try {
        if (memoryDb) {
            memoryDb = data;
            return;
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 4), "utf8");
    } catch (error) {
        memoryDb = data;
    }
}

// Seed Firestore with initial data if empty
async function seedFirestore() {
    if (!useFirebase) return;
    try {
        const snapshot = await getDocs(collection(firestore, "employees"));
        if (snapshot.empty) {
            console.log("Seeding initial data to Firestore...");
            for (const [id, emp] of Object.entries(initialData.employees)) {
                await setDoc(doc(firestore, "employees", id), emp);
            }
            for (const [id, reqs] of Object.entries(initialData.requests)) {
                await setDoc(doc(firestore, "requests", id), { list: reqs });
            }
            console.log("Seeding completed successfully");
        }
    } catch (err) {
        console.error("Failed to seed Firestore:", err.message);
    }
}

seedFirestore();

export const db = {
    getEmployees: async () => {
        if (useFirebase) {
            try {
                const snapshot = await getDocs(collection(firestore, "employees"));
                const employees = {};
                snapshot.forEach(doc => {
                    employees[doc.id] = doc.data();
                });
                return employees;
            } catch (err) {
                console.error("Firebase getEmployees failed, falling back:", err.message);
            }
        }
        return readDb().employees;
    },
    getEmployee: async (employeeId) => {
        if (useFirebase) {
            try {
                const docSnap = await getDoc(doc(firestore, "employees", employeeId));
                return docSnap.exists() ? docSnap.data() : null;
            } catch (err) {
                console.error("Firebase getEmployee failed, falling back:", err.message);
            }
        }
        return readDb().employees[employeeId];
    },
    getRequests: async (employeeId) => {
        if (useFirebase) {
            try {
                const docSnap = await getDoc(doc(firestore, "requests", employeeId));
                if (docSnap.exists()) {
                    return docSnap.data().list || [];
                } else {
                    const defaultReqs = [
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
                    await setDoc(doc(firestore, "requests", employeeId), { list: defaultReqs });
                    return defaultReqs;
                }
            } catch (err) {
                console.error("Firebase getRequests failed, falling back:", err.message);
            }
        }
        const data = readDb();
        if (!data.requests[employeeId]) {
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
    addRequest: async (employeeId, request) => {
        if (useFirebase) {
            try {
                const docSnap = await getDoc(doc(firestore, "requests", employeeId));
                let list = [];
                if (docSnap.exists()) {
                    list = docSnap.data().list || [];
                }
                list.unshift(request);
                await setDoc(doc(firestore, "requests", employeeId), { list });
                return;
            } catch (err) {
                console.error("Firebase addRequest failed, falling back:", err.message);
            }
        }
        const data = readDb();
        if (!data.requests[employeeId]) {
            data.requests[employeeId] = [];
        }
        data.requests[employeeId].unshift(request);
        writeDb(data);
    },
    getCredentials: async () => {
        if (useFirebase) {
            try {
                const snapshot = await getDocs(collection(firestore, "credentials"));
                const credentials = {};
                snapshot.forEach(doc => {
                    credentials[doc.id] = doc.data();
                });
                return credentials;
            } catch (err) {
                console.error("Firebase getCredentials failed, falling back:", err.message);
            }
        }
        return readDb().credentials || {};
    },
    getCredential: async (credentialId) => {
        if (useFirebase) {
            try {
                const docSnap = await getDoc(doc(firestore, "credentials", credentialId));
                return docSnap.exists() ? docSnap.data() : null;
            } catch (err) {
                console.error("Firebase getCredential failed, falling back:", err.message);
            }
        }
        return (readDb().credentials || {})[credentialId];
    },
    saveCredential: async (credentialId, credentialInfo) => {
        if (useFirebase) {
            try {
                await setDoc(doc(firestore, "credentials", credentialId), credentialInfo);
                return;
            } catch (err) {
                console.error("Firebase saveCredential failed, falling back:", err.message);
            }
        }
        const data = readDb();
        if (!data.credentials) {
            data.credentials = {};
        }
        data.credentials[credentialId] = credentialInfo;
        writeDb(data);
    },
    deleteCredentialsForEmployee: async (employeeId) => {
        if (useFirebase) {
            try {
                const snapshot = await getDocs(collection(firestore, "credentials"));
                snapshot.forEach(async (d) => {
                    if (d.data().employeeId === employeeId) {
                        await deleteDoc(doc(firestore, "credentials", d.id));
                    }
                });
                return;
            } catch (err) {
                console.error("Firebase deleteCredentialsForEmployee failed, falling back:", err.message);
            }
        }
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
    saveEmployee: async (employeeId, employeeData) => {
        if (useFirebase) {
            try {
                const docRef = doc(firestore, "employees", employeeId);
                const docSnap = await getDoc(docRef);
                const existing = docSnap.exists() ? docSnap.data() : {};
                const updated = {
                    ...existing,
                    ...employeeData,
                    employeeId
                };
                await setDoc(docRef, updated);
                return;
            } catch (err) {
                console.error("Firebase saveEmployee failed, falling back:", err.message);
            }
        }
        const data = readDb();
        data.employees[employeeId] = {
            ...data.employees[employeeId],
            ...employeeData,
            employeeId
        };
        writeDb(data);
    },
    deleteEmployee: async (employeeId) => {
        if (useFirebase) {
            try {
                await deleteDoc(doc(firestore, "employees", employeeId));
                await deleteDoc(doc(firestore, "requests", employeeId));
                const snapshot = await getDocs(collection(firestore, "credentials"));
                snapshot.forEach(async (d) => {
                    if (d.data().employeeId === employeeId) {
                        await deleteDoc(doc(firestore, "credentials", d.id));
                    }
                });
                return;
            } catch (err) {
                console.error("Firebase deleteEmployee failed, falling back:", err.message);
            }
        }
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
