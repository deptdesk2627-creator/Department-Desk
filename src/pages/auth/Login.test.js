import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Login from "./Login";
import { supabase } from "../../supabase/supabaseClient";

jest.mock("../../supabase/supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    rpc: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  supabase.rpc.mockResolvedValue({
    data: [
      { role: "secretary", is_available: true },
      { role: "dean", is_available: true },
    ],
    error: null,
  });
});

test("signs in with Supabase and passes the authenticated user to the app", async () => {
  const user = {
    email: "person@example.com",
    user_metadata: { role: "dean" },
  };
  const onLogin = jest.fn();
  supabase.auth.signInWithPassword.mockResolvedValue({
    data: { user },
    error: null,
  });
  render(<Login onLogin={onLogin} />);

  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: " Person@Example.com " },
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: "secure-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: /sign in to workspace/i }));

  await waitFor(() => expect(onLogin).toHaveBeenCalledWith(user));
  expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
    email: "person@example.com",
    password: "secure-password",
  });
});

test("creates an account and returns to the sign-in form", async () => {
  supabase.auth.signUp.mockResolvedValue({
    data: { session: null },
    error: null,
  });
  render(<Login onLogin={jest.fn()} />);

  fireEvent.click(screen.getByRole("button", { name: /create an account/i }));
  fireEvent.change(screen.getByLabelText(/full name/i), {
    target: { value: "Alex Staff" },
  });
  fireEvent.change(screen.getByLabelText(/^role$/i), {
    target: { value: "staff" },
  });
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: "alex@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: "secure-password" },
  });
  fireEvent.change(screen.getByLabelText(/confirm password/i), {
    target: { value: "secure-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));

  await waitFor(() => expect(supabase.auth.signUp).toHaveBeenCalledWith({
    email: "alex@example.com",
    password: "secure-password",
    options: { data: { full_name: "Alex Staff", role: "staff" } },
  }));
  expect(
    await screen.findByRole("status"),
  ).toHaveTextContent(/account created/i);
  expect(
    screen.getByRole("heading", { name: /sign in to deptdesk/i }),
  ).toBeInTheDocument();
});

test("hides secretary and dean signup choices when their slots are full", async () => {
  supabase.rpc.mockResolvedValue({
    data: [
      { role: "secretary", is_available: false },
      { role: "dean", is_available: false },
    ],
    error: null,
  });
  render(<Login />);

  fireEvent.click(screen.getByRole("button", { name: /create an account/i }));
  const roleSelect = screen.getByRole("combobox", { name: /^role$/i });

  await waitFor(() => {
    expect(roleSelect).toHaveValue("staff");
    expect(
      screen.queryByRole("option", { name: /secretary/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /^dean$/i }),
    ).not.toBeInTheDocument();
  });
  expect(supabase.rpc).toHaveBeenCalledWith(
    "get_signup_role_availability",
  );
});

test("signs out an automatically authenticated signup and returns to login", async () => {
  supabase.auth.signUp.mockResolvedValue({
    data: { session: { access_token: "test-session" } },
    error: null,
  });
  supabase.auth.signOut.mockResolvedValue({ error: null });
  render(<Login />);

  fireEvent.click(screen.getByRole("button", { name: /create an account/i }));
  fireEvent.change(screen.getByLabelText(/full name/i), {
    target: { value: "Alex Staff" },
  });
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: "alex@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: "secure-password" },
  });
  fireEvent.change(screen.getByLabelText(/confirm password/i), {
    target: { value: "secure-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));

  await waitFor(() => expect(supabase.auth.signOut).toHaveBeenCalledTimes(1));
  expect(
    await screen.findByRole("heading", { name: /sign in to deptdesk/i }),
  ).toBeInTheDocument();
});

test("rejects mismatched passwords without sending a signup request", async () => {
  render(<Login onLogin={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: /create an account/i }));
  fireEvent.change(screen.getByLabelText(/full name/i), {
    target: { value: "Alex Staff" },
  });
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: "alex@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: "secure-password" },
  });
  fireEvent.change(screen.getByLabelText(/confirm password/i), {
    target: { value: "different-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    /passwords do not match/i,
  );
  expect(supabase.auth.signUp).not.toHaveBeenCalled();
});

test("applies dark theme attribute to split page container", () => {
  render(<Login theme="dark" />);

  expect(screen.getByTestId("login-split-page")).toHaveAttribute(
    "data-theme",
    "dark",
  );
});

test("signs in immediately with one-click demo account buttons", () => {
  const onLogin = jest.fn();
  render(<Login onLogin={onLogin} />);

  fireEvent.click(screen.getByRole("button", { name: /secretary/i }));
  expect(onLogin).toHaveBeenCalledWith({
    email: "secretary@deptdesk.edu",
    user_metadata: {
      full_name: "Ma'am Aubrey",
      role: "secretary",
    },
  });
});
