import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

console.log("Fetching employees...");
try {
    const snapshot = await getDocs(collection(firestore, "employees"));
    console.log("Success! Found documents:", snapshot.size);
    snapshot.forEach(doc => {
        console.log(doc.id, doc.data());
    });
} catch (err) {
    console.error("Error fetching from Firestore:", err.message);
}
process.exit(0);
