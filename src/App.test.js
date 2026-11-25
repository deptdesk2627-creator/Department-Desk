import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { supabase } from "./supabase/supabaseClient";

jest.mock("./supabase/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
      getClaims: jest.fn(),
    },
    from: jest.fn(),
  },
}));

beforeEach(() => {
  window.localStorage.clear();
  jest.clearAllMocks();
  supabase.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: null,
  });
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "secretary-user" } },
    error: null,
  });
  supabase.from.mockImplementation(() => {
    const query = {
      select: jest.fn(() => query),
      eq: jest.fn(() => query),
      delete: jest.fn(() => query),
      update: jest.fn(() => query),
      is: jest.fn(() => Promise.resolve({ data: [], error: null })),
      gte: jest.fn(() => Promise.resolve({ data: [], error: null })),
      order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      maybeSingle: jest.fn(() =>
        Promise.resolve({
          data: { user_id: 1, username: "Ma'am Aubrey" },
          error: null,
        }),
      ),
    };
    return query;
  });
  supabase.auth.getClaims.mockResolvedValue({
    data: { claims: { app_metadata: { role: "secretary" } } },
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
    app_metadata: { role: "secretary" },
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
        access_token: "signed-jwt",
        user: {
          email: "dean@example.com",
          app_metadata: { role: "dean" },
          user_metadata: { role: "dean" },
        },
      },
    },
    error: null,
  });
  supabase.auth.getClaims.mockResolvedValue({
    data: { claims: { app_metadata: { role: "dean" } } },
    error: null,
  });

  render(<App />);
  expect(
    await screen.findByRole("complementary", { name: /main navigation/i }),
  ).toBeInTheDocument();
  expect(supabase.auth.getClaims).toHaveBeenCalledWith("signed-jwt");
});

test("clears previously saved local profiles without removing Supabase accounts", async () => {
  window.localStorage.setItem(
    "officeflow.profiles",
    JSON.stringify({ secretary: { name: "Old profile" } }),
  );

  render(<App />);

  await waitFor(() =>
    expect(window.localStorage.getItem("officeflow.profiles")).toBeNull(),
  );
  expect(supabase.auth.getSession).toHaveBeenCalled();
});

test("keeps Login mounted during PASSWORD_RECOVERY auth events so the user can set a new password", async () => {
  let authListener;
  supabase.auth.onAuthStateChange.mockImplementation((callback) => {
    authListener = callback;
    return { data: { subscription: { unsubscribe: jest.fn() } } };
  });

  render(<App />);
  expect(
    await screen.findByRole("heading", { name: /sign in to deptdesk/i }),
  ).toBeInTheDocument();

  authListener("PASSWORD_RECOVERY", {
    access_token: "recovery-jwt",
    user: {
      id: "secretary-user",
      email: "secretary@example.com",
      app_metadata: { role: "secretary" },
    },
  });

  expect(
    screen.getByRole("heading", { name: /sign in to deptdesk/i }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("complementary", { name: /main navigation/i }),
  ).not.toBeInTheDocument();
});

test("applies sidebar, table density, and default view buttons in Settings immediately", async () => {
  const user = {
    id: "secretary-user",
    email: "secretary@example.com",
    app_metadata: { role: "secretary" },
    user_metadata: { full_name: "Ma'am Aubrey" },
  };
  supabase.auth.signInWithPassword.mockResolvedValue({
    data: { user },
    error: null,
  });
  render(<App />);

  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: user.email },
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: "secure-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: /sign in to workspace/i }));
  const sidebar = await screen.findByRole("complementary", {
    name: /main navigation/i,
  });

  // Open Settings from the sidebar
  fireEvent.click(screen.getByRole("button", { name: /^settings$/i }));
  expect(
    await screen.findByRole("heading", { name: /^settings$/i }),
  ).toBeInTheDocument();

  // 1. Sidebar Collapsed / Expanded buttons immediately collapse and expand the sidebar
  fireEvent.click(screen.getByText("Collapsed"));
  expect(sidebar).toHaveClass("workspace-sidebar--collapsed");

  fireEvent.click(screen.getByText("Expanded"));
  expect(sidebar).not.toHaveClass("workspace-sidebar--collapsed");

  // 2. Compact / Comfortable buttons immediately update document data-density and preview table
  fireEvent.click(screen.getByText("Compact"));
  expect(document.documentElement.getAttribute("data-density")).toBe("compact");
  expect(
    screen.getByLabelText(/table row density preview/i),
  ).toBeInTheDocument();

  fireEvent.click(screen.getByText("Comfortable"));
  expect(document.documentElement.getAttribute("data-density")).toBe(
    "comfortable",
  );

  // 3. Request Tracker view buttons update default view & open Request Tracker in that view
  fireEvent.click(screen.getByText("Cabinet Locator"));
  fireEvent.click(
    screen.getByRole("button", {
      name: /open request tracker in cabinet locator/i,
    }),
  );
  expect(
    await screen.findByLabelText(/cict file cabinet locator/i),
  ).toBeInTheDocument();

  // Return to Settings and test Task Management By Status view button
  fireEvent.click(screen.getByRole("button", { name: /^settings$/i }));
  fireEvent.click(screen.getByText("By Status"));
  fireEvent.click(
    screen.getByRole("button", {
      name: /open task management in by status/i,
    }),
  );
  expect(
    await screen.findByRole("button", { name: /by status/i }),
  ).toHaveClass("active");

  // Return to Settings and test Notification sound mute switch
  fireEvent.click(screen.getByRole("button", { name: /^settings$/i }));
  const soundSwitch = await screen.findByRole("switch", {
    name: /notification sound/i,
  });
  expect(soundSwitch).toBeChecked();
  fireEvent.click(soundSwitch);
  expect(soundSwitch).not.toBeChecked();
  expect(screen.getByText("Notification sound muted.")).toBeInTheDocument();
  expect(screen.getByText("Muted")).toBeInTheDocument();

  // Test Clear all office data
  fireEvent.click(screen.getByRole("button", { name: /^clear data$/i }));
  fireEvent.click(
    screen.getByRole("button", { name: /yes, clear everything/i }),
  );
  expect(
    await screen.findAllByText(/all office data was cleared/i),
  ).not.toHaveLength(0);
}, 15000);
