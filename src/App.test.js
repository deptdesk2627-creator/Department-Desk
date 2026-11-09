import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { supabase } from "./supabase/supabaseClient";

jest.mock("./supabase/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
    },
  },
}));

beforeEach(() => {
  window.localStorage.clear();
  jest.clearAllMocks();
  supabase.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: null,
  });
  supabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });
  supabase.auth.signOut.mockResolvedValue({ error: null });
});

test("signs in with Supabase and logs out from header and sidebar", async () => {
  const user = {
    email: "secretary@example.com",
    user_metadata: { full_name: "Ma'am Aubrey", role: "secretary" },
  };
  supabase.auth.signInWithPassword.mockResolvedValue({
    data: { user },
    error: null,
  });
  render(<App />);

  expect(
    screen.getByRole("heading", { name: /sign in to deptdesk/i }),
  ).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: user.email },
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: "secure-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: /sign in to workspace/i }));

  expect(
    await screen.findByRole("complementary", { name: /main navigation/i }),
  ).toBeInTheDocument();

  fireEvent.click(
    screen.getByRole("button", { name: /ma'am aubrey|cha gamay/i }),
  );
  fireEvent.click(screen.getByRole("menuitem", { name: /log out/i }));
  await waitFor(() =>
    expect(
      screen.getByRole("heading", { name: /sign in to deptdesk/i }),
    ).toBeInTheDocument(),
  );

  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: user.email },
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: "secure-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: /sign in to workspace/i }));
  expect(
    await screen.findByRole("complementary", { name: /main navigation/i }),
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /^log out$/i }));
  await waitFor(() =>
    expect(
      screen.getByRole("heading", { name: /sign in to deptdesk/i }),
    ).toBeInTheDocument(),
  );
});

test("restores a valid Supabase session on page load", async () => {
  supabase.auth.getSession.mockResolvedValue({
    data: {
      session: {
        user: {
          email: "dean@example.com",
          user_metadata: { role: "dean" },
        },
      },
    },
    error: null,
  });

  render(<App />);
  expect(
    await screen.findByRole("complementary", { name: /main navigation/i }),
  ).toBeInTheDocument();
});
