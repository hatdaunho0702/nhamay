import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDjcZpFjc51LWcOUL6w8ebsMiR0zGs_8F8",
    authDomain: "cuahangdienmay-9e28c.firebaseapp.com",
    projectId: "cuahangdienmay-9e28c",
    storageBucket: "cuahangdienmay-9e28c.firebasestorage.app",
    messagingSenderId: "965631598853",
    appId: "1:965631598853:web:3f969b3f7cd47186b1576c",
    measurementId: "G-0K34KWCB96"
};

console.log("Initializing Firebase...");
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

const testId = "NBC_TEST_999";
console.log(`Attempting to write document ${testId} to Firestore...`);
try {
    const docRef = doc(firestore, "employees", testId);
    await setDoc(docRef, {
        employeeId: testId,
        name: "Test Employee Persistence",
        role: "Tester"
    });
    console.log("Write successful!");

    console.log("Attempting to read document back...");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        console.log("Read successful! Data:", snap.data());
    } else {
        console.log("Read failed: Document does not exist!");
    }

    console.log("Attempting to delete test document...");
    await deleteDoc(docRef);
    console.log("Delete successful!");
} catch (err) {
    console.error("Firestore operation failed:", err.message);
}
process.exit(0);
