import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  authenticateUser,
  registerUser,
  resetUserPassword,
} from "./authService";
import { auth, db } from "./firebaseConfig";

const firebaseConfigMock = jest.requireMock("./firebaseConfig");
const configuredDb = db;

jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(),
  deleteUser: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  limit: jest.fn(),
  query: jest.fn(),
  runTransaction: jest.fn(),
  setDoc: jest.fn(),
  where: jest.fn(),
}));

jest.mock("./firebaseConfig", () => ({
  auth: {},
  db: {},
}));

const user = { uid: "user-123", email: "person@example.com" };
const profile = {
  user_id: "user-123",
  email: "person@example.com",
  fullname: "Taylor User",
  role: "dean",
};
const newUser = { uid: "new-user-456", email: "new@example.com" };
const transactionSet = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  createUserWithEmailAndPassword.mockResolvedValue({ user: newUser });
  deleteUser.mockResolvedValue(undefined);
  signInWithEmailAndPassword.mockResolvedValue({ user });
  sendPasswordResetEmail.mockResolvedValue(undefined);
  doc.mockImplementation((_database, collectionName, id) => `${collectionName}/${id}`);
  getDoc.mockResolvedValue({
    exists: () => true,
    data: () => profile,
  });
  getDocs.mockResolvedValue({ empty: true, docs: [] });
  runTransaction.mockImplementation(async (_database, callback) =>
    callback({
      get: jest.fn().mockResolvedValue({ exists: () => false }),
      set: transactionSet,
    }),
  );
  transactionSet.mockClear();
  signOut.mockResolvedValue(undefined);
});

afterEach(() => {
  firebaseConfigMock.db = configuredDb;
});

test("reports missing Firebase configuration before accessing Firestore", async () => {
  firebaseConfigMock.db = null;

  await expect(
    registerUser("new@example.com", "secure-password", "Taylor User", "dean"),
  ).rejects.toThrow(/firebase is not configured.*\.env file/i);

  expect(collection).not.toHaveBeenCalled();
  expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
});

test("validates Firebase credentials and the matching Firestore email and role", async () => {
  await expect(
    authenticateUser(" PERSON@example.com ", "correct-password", "dean"),
  ).resolves.toEqual(profile);

  expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
    auth,
    "person@example.com",
    "correct-password",
  );
  expect(doc).toHaveBeenCalledWith(db, "users", user.uid);
  expect(signOut).not.toHaveBeenCalled();
});

test("rejects a selected role that does not match the saved profile and clears the session", async () => {
  await expect(
    authenticateUser("person@example.com", "correct-password", "staff"),
  ).rejects.toThrow(/selected workspace role does not match/i);

  expect(signOut).toHaveBeenCalledWith(auth);
});

test("rejects missing Firestore profiles and clears the Firebase session", async () => {
  getDoc.mockResolvedValue({ exists: () => false });

  await expect(
    authenticateUser("person@example.com", "correct-password", "dean"),
  ).rejects.toThrow(/no deptdesk account profile/i);

  expect(signOut).toHaveBeenCalledWith(auth);
});

test("does not read Firestore when Firebase rejects the credentials", async () => {
  signInWithEmailAndPassword.mockRejectedValue(
    Object.assign(new Error("Invalid credentials"), {
      code: "auth/invalid-credential",
    }),
  );

  await expect(
    authenticateUser("person@example.com", "wrong-password", "dean"),
  ).rejects.toMatchObject({ code: "auth/invalid-credential" });

  expect(getDoc).not.toHaveBeenCalled();
  expect(signOut).not.toHaveBeenCalled();
});

test("sends a password reset email to the normalized address", async () => {
  await resetUserPassword(" PERSON@example.com ");

  expect(sendPasswordResetEmail).toHaveBeenCalledWith(
    auth,
    "person@example.com",
  );
});

test("assigns the Dean role atomically to the first user", async () => {
  await registerUser("new@example.com", "secure-password", "Taylor User", "dean");

  expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
    auth,
    "new@example.com",
    "secure-password",
  );
  expect(runTransaction).toHaveBeenCalledWith(db, expect.any(Function));
  expect(transactionSet).toHaveBeenCalledTimes(2);
  expect(transactionSet).toHaveBeenCalledWith(
    "roleAssignments/dean",
    expect.objectContaining({ user_ids: [newUser.uid] }),
  );
  expect(transactionSet).toHaveBeenCalledWith(
    `users/${newUser.uid}`,
    expect.objectContaining({ role: "dean", email: newUser.email }),
  );
});

test("rejects registration when the Dean role is already full", async () => {
  getDocs.mockResolvedValue({
    empty: false,
    docs: [{ id: "existing-dean" }],
  });

  await expect(
    registerUser("new@example.com", "secure-password", "Taylor User", "dean"),
  ).rejects.toThrow(/dean role is full.*up to 1 users/i);

  expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  expect(runTransaction).not.toHaveBeenCalled();
});

test("allows a third Secretary account and persists all role assignments", async () => {
  const existingSecretaryIds = ["secretary-1", "secretary-2"];
  getDocs.mockResolvedValue({
    empty: false,
    docs: existingSecretaryIds.map((id) => ({ id })),
  });
  runTransaction.mockImplementation(async (_database, callback) =>
    callback({
      get: jest.fn().mockResolvedValue({ exists: () => false }),
      set: transactionSet,
    }),
  );

  await registerUser("new@example.com", "secure-password", "Taylor User", "secretary");

  expect(transactionSet).toHaveBeenCalledWith(
    "roleAssignments/secretary",
    expect.objectContaining({
      user_ids: [...existingSecretaryIds, newUser.uid],
    }),
  );
});

test("rejects a fourth Secretary account and removes the newly created Auth account", async () => {
  runTransaction.mockImplementation(async (_database, callback) =>
    callback({
      get: jest.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ user_ids: ["secretary-1", "secretary-2", "secretary-3"] }),
      }),
      set: transactionSet,
    }),
  );

  await expect(
    registerUser("new@example.com", "secure-password", "Taylor User", "secretary"),
  ).rejects.toThrow(/secretary role is full.*up to 3 users/i);

  expect(deleteUser).toHaveBeenCalledWith(newUser);
  expect(transactionSet).not.toHaveBeenCalled();
});

test("removes the newly created Auth account if another registration claims the role first", async () => {
  getDocs.mockResolvedValue({ empty: true, docs: [] });
  runTransaction.mockImplementation(async (_database, callback) =>
    callback({
      get: jest.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ user_id: "existing-dean" }),
      }),
      set: transactionSet,
    }),
  );

  await expect(
    registerUser("new@example.com", "secure-password", "Taylor User", "dean"),
  ).rejects.toThrow(/dean role is full.*up to 1 users/i);

  expect(deleteUser).toHaveBeenCalledWith(newUser);
  expect(transactionSet).not.toHaveBeenCalled();
});
