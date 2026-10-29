import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

export async function registerUser(email, password, fullname, role) {
    // Step 1: Firebase Auth handles password & email securely
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Step 2: Firestore saves your metadata using the Auth UID as the document ID
    await setDoc(doc(db, "users", user.uid), {
        user_id: user.uid,
        email: user.email,
        fullname: fullname,
        role: role, // e.g., "admin" or "customer"
        createdAt: new Date().toISOString()
    });
}