import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig"; // Adjust import path if your folder structure differs

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);       // Holds the raw Firebase Auth user object
    const [userData, setUserData] = useState(null); // Holds Firestore data: { user_id, email, fullname, role, etc. }
    const [loading, setLoading] = useState(true);   // Tracks whether Firebase is still checking auth state

    useEffect(() => {
        // onAuthStateChanged listens for login, logout, or page refresh events
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            if (authUser) {
                setUser(authUser);

                try {
                    // Fetch the matching document from your Firestore 'users' collection using the Auth UID
                    const userDocRef = doc(db, "users", authUser.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        setUserData(userDocSnap.data());
                    } else {
                        console.warn("User authenticated, but no matching Firestore document found.");
                        setUserData(null);
                    }
                } catch (error) {
                    console.error("Error fetching user role from Firestore:", error);
                    setUserData(null);
                }
            } else {
                // User is logged out
                setUser(null);
                setUserData(null);
            }

            // Finished loading auth state
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, userData, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to easily access auth state and user role anywhere in your app
export function useAuth() {
    return useContext(AuthContext);
}