import {
    createUserWithEmailAndPassword,
    deleteUser,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    query,
    runTransaction,
    setDoc,
    where,
} from "firebase/firestore";
import { ROLE_LIST } from "../constants/roles";
import { auth, db } from "./firebaseConfig";

export async function registerUser(email, password, fullname, role) {
    const roleConfig = ROLE_LIST.find((item) => item.id === role);
    if (!roleConfig) {
        throw new Error("Please select a valid workspace role.");
    }

    const existingUsers = await getDocs(
        query(
            collection(db, "users"),
            where("role", "==", role),
            limit(roleConfig.maxUsers),
        ),
    );
    if (existingUsers.docs.length >= roleConfig.maxUsers) {
        throw new Error(
            `The ${roleConfig.label} role is full. It can have up to ${roleConfig.maxUsers} users.`,
        );
    }
    const existingUserIds = existingUsers.docs.map((userDoc) => userDoc.id);

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userProfile = {
        user_id: user.uid,
        email: user.email,
        fullname: fullname,
        role: role,
        createdAt: new Date().toISOString(),
    };

    try {
        const roleAssignmentRef = doc(db, "roleAssignments", role);
        const userRef = doc(db, "users", user.uid);
        await runTransaction(db, async (transaction) => {
            const assignment = await transaction.get(roleAssignmentRef);
            const assignmentData = assignment.exists() ? assignment.data() : {};
            const assignedUserIds = Array.isArray(assignmentData.user_ids)
                ? assignmentData.user_ids
                : assignmentData.user_id
                  ? [assignmentData.user_id]
                  : existingUserIds;
            const allUserIds = [...new Set([...assignedUserIds, ...existingUserIds])];

            if (allUserIds.length >= roleConfig.maxUsers) {
                throw new Error(
                    `The ${roleConfig.label} role is full. It can have up to ${roleConfig.maxUsers} users.`,
                );
            }

            transaction.set(roleAssignmentRef, {
                user_ids: [...allUserIds, user.uid],
                updatedAt: userProfile.createdAt,
            });
            transaction.set(userRef, userProfile);
        });
    } catch (registrationError) {
        try {
            await deleteUser(user);
        } catch (cleanupError) {
            try {
                await signOut(auth);
            } catch (signOutError) {
                console.error("Unable to clear the failed registration session:", signOutError);
            }
            console.error("Unable to remove the failed Firebase account:", cleanupError);
            throw new Error(
                `${registrationError?.message || "Unable to complete registration."} The incomplete account could not be removed; contact support.`,
            );
        }
        throw registrationError;
    }
}

export async function authenticateUser(email, password, selectedRole) {
    const normalizedEmail = email.trim().toLowerCase();
    const userCredential = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password,
    );
    const user = userCredential.user;
    let userData;

    try {
        if (user.email?.trim().toLowerCase() !== normalizedEmail) {
            throw new Error("The authenticated email does not match your account.");
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
            throw new Error("No DeptDesk account profile was found for this user.");
        }

        userData = userDoc.data();
        if (
            typeof userData.email !== "string" ||
            userData.email.trim().toLowerCase() !== normalizedEmail
        ) {
            throw new Error("The account email does not match its saved profile.");
        }
        if (
            !ROLE_LIST.some((role) => role.id === selectedRole) ||
            userData.role !== selectedRole
        ) {
            throw new Error("The selected workspace role does not match this account.");
        }
    } catch (error) {
        try {
            await signOut(auth);
        } catch (signOutError) {
            console.error("Unable to clear an unverified Firebase session:", signOutError);
        }
        throw error;
    }

    return userData;
}

export function signOutUser() {
    return signOut(auth);
}

export function resetUserPassword(email) {
    return sendPasswordResetEmail(auth, email.trim().toLowerCase());
}