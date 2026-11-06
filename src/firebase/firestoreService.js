import { useCallback, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { useStoredState } from "../hooks/useStoredState";
import { auth, db, isFirebaseConfigured } from "./firebaseConfig";

export const COLLECTIONS = Object.freeze({
  USERS: "users",
  ROLE_ASSIGNMENTS: "roleAssignments",
  REQUESTS: "requests",
  TASKS: "tasks",
  INVENTORY: "inventory",
  INVENTORY_RECORDS: "inventoryRecords",
  WORKSPACE_SETTINGS: "workspaceSettings",
});

export function getDocumentId(item, fallbackIndex = 0) {
  const rawId =
    item?.id ??
    item?.productId ??
    item?.requestId ??
    item?.taskId ??
    `item-${fallbackIndex}`;
  return String(rawId).trim().replace(/\//g, "_") || `item-${fallbackIndex}`;
}

export function sanitizeForFirestore(value) {
  if (value === undefined) return null;
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value
      .filter((entry) => entry !== undefined)
      .map((entry) => sanitizeForFirestore(entry));
  }
  const result = {};
  for (const [key, val] of Object.entries(value)) {
    if (val !== undefined) {
      result[key] = sanitizeForFirestore(val);
    }
  }
  return result;
}

function isLiveFirestoreEnabled() {
  return (
    process.env.NODE_ENV !== "test" &&
    Boolean(isFirebaseConfigured && db && auth)
  );
}

async function syncArrayDiffToFirestore(collectionName, prevItems, nextItems) {
  if (!isLiveFirestoreEnabled() || !auth?.currentUser) return;

  const prevList = Array.isArray(prevItems) ? prevItems.filter(Boolean) : [];
  const nextList = Array.isArray(nextItems) ? nextItems.filter(Boolean) : [];

  const prevMap = new Map();
  prevList.forEach((item, index) => {
    prevMap.set(getDocumentId(item, index), item);
  });

  const nextMap = new Map();
  nextList.forEach((item, index) => {
    nextMap.set(getDocumentId(item, index), { item, index });
  });

  const batch = writeBatch(db);
  let operationCount = 0;
  const nowIso = new Date().toISOString();

  // Upsert added or modified documents
  for (const [docId, { item, index }] of nextMap.entries()) {
    const prevItem = prevMap.get(docId);
    const hasChanged =
      !prevItem || JSON.stringify(prevItem) !== JSON.stringify(item);

    if (hasChanged) {
      const docRef = doc(db, collectionName, docId);
      const payload = sanitizeForFirestore({
        ...item,
        id: item.id ?? docId,
        _sortOrder: index,
        updatedAt: item.updatedAt || nowIso,
      });
      batch.set(docRef, payload, { merge: true });
      operationCount += 1;
    }
  }

  // Delete removed documents
  for (const docId of prevMap.keys()) {
    if (!nextMap.has(docId)) {
      const docRef = doc(db, collectionName, docId);
      batch.delete(docRef);
      operationCount += 1;
    }
  }

  if (operationCount > 0) {
    try {
      await batch.commit();
    } catch (error) {
      console.error(
        `Failed to sync changes to Firestore collection "${collectionName}":`,
        error,
      );
    }
  }
}

export function useFirestoreCollection(
  collectionName,
  storageKey,
  initialValue = [],
) {
  const [items, setStoredItems] = useStoredState(storageKey, initialValue);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const hasSeededRef = useRef(false);

  useEffect(() => {
    if (!isLiveFirestoreEnabled()) return undefined;

    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (!authUser) return;

      const colRef = collection(db, collectionName);
      unsubscribeSnapshot = onSnapshot(
        colRef,
        (snapshot) => {
          if (snapshot.empty) {
            const localItems = Array.isArray(itemsRef.current)
              ? itemsRef.current.filter(Boolean)
              : [];
            if (localItems.length > 0 && !hasSeededRef.current) {
              hasSeededRef.current = true;
              syncArrayDiffToFirestore(collectionName, [], localItems);
            } else {
              setStoredItems([]);
            }
            return;
          }

          hasSeededRef.current = true;
          const remoteItems = snapshot.docs
            .map((docSnap) => {
              const data = docSnap.data();
              return {
                ...data,
                id: data.id ?? docSnap.id,
              };
            })
            .sort((a, b) => {
              const orderA =
                typeof a._sortOrder === "number"
                  ? a._sortOrder
                  : Number.MAX_SAFE_INTEGER;
              const orderB =
                typeof b._sortOrder === "number"
                  ? b._sortOrder
                  : Number.MAX_SAFE_INTEGER;
              if (orderA !== orderB) return orderA - orderB;
              return String(b.dateTime || b.updatedAt || "").localeCompare(
                String(a.dateTime || a.updatedAt || ""),
              );
            })
            .map(({ _sortOrder, ...rest }) => rest);

          if (
            JSON.stringify(itemsRef.current) !== JSON.stringify(remoteItems)
          ) {
            setStoredItems(remoteItems);
          }
        },
        (error) => {
          console.error(
            `Error listening to Firestore collection "${collectionName}":`,
            error,
          );
        },
      );
    });

    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
      unsubscribeAuth();
    };
  }, [collectionName, setStoredItems]);

  const setSyncedItems = useCallback(
    (nextOrUpdater) => {
      setStoredItems((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        const next =
          typeof nextOrUpdater === "function"
            ? nextOrUpdater(safePrev)
            : nextOrUpdater;
        const safeNext = Array.isArray(next) ? next.filter(Boolean) : [];

        if (isLiveFirestoreEnabled() && auth?.currentUser) {
          syncArrayDiffToFirestore(collectionName, safePrev, safeNext);
        }

        return safeNext;
      });
    },
    [collectionName, setStoredItems],
  );

  return [items, setSyncedItems];
}

export async function saveUserProfileToFirestore(uid, profileData) {
  if (!isLiveFirestoreEnabled() || !uid || !profileData) return;
  try {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    await setDoc(
      userRef,
      sanitizeForFirestore({
        fullname: profileData.name,
        email: profileData.email,
        title: profileData.title,
        phone: profileData.phone,
        office: profileData.office,
        status: profileData.status,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true },
    );
  } catch (error) {
    console.error("Failed to save user profile to Firestore:", error);
  }
}

export async function saveWorkspaceSettingsToFirestore(settingsData) {
  if (!isLiveFirestoreEnabled() || !auth?.currentUser || !settingsData) return;
  try {
    const settingsRef = doc(db, COLLECTIONS.WORKSPACE_SETTINGS, "default");
    await setDoc(
      settingsRef,
      sanitizeForFirestore({
        ...settingsData,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true },
    );
  } catch (error) {
    console.error("Failed to save workspace settings to Firestore:", error);
  }
}

