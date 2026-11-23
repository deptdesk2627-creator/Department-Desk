import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Login from "./Login";
import { supabase } from "../../supabase/supabaseClient";

jest.mock("../../supabase/supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      verifyOtp: jest.fn(),
      resend: jest.fn(),
      getClaims: jest.fn(),
    },
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  supabase.from.mockImplementation(() => {
    const query = {
      select: jest.fn(() => query),
      eq: jest.fn(() => query),
      maybeSingle: jest.fn(() =>
        Promise.resolve({
          data: { approval_status: "approved" },
          error: null,
        }),
      ),
    };
    return query;
  });
  supabase.rpc.mockResolvedValue({
    data: [
      { role: "secretary", is_available: true },
      { role: "dean", is_available: true },
      { role: "staff", is_available: true },
    ],
    error: null,
  });
  supabase.auth.getClaims.mockResolvedValue({
    data: { claims: { app_metadata: { role: "staff" } } },
    error: null,
  });
  supabase.auth.signOut.mockResolvedValue({ error: null });
  supabase.auth.verifyOtp.mockResolvedValue({
    data: { session: null },
    error: null,
  });
  supabase.auth.resend.mockResolvedValue({ data: {}, error: null });
});

async function openSignupForm() {
  fireEvent.click(screen.getByRole("button", { name: /create an account/i }));
  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: /^role$/i })).not.toBeDisabled(),
  );
}

test.each(["secretary", "dean", "staff"])(
  "accepts the %s app_metadata.role JWT claim",
  async (role) => {
    const user = {
      email: "person@example.com",
      app_metadata: { role },
      user_metadata: { role: "secretary" },
    };
    supabase.auth.getClaims.mockResolvedValue({
      data: { claims: { app_metadata: { role } } },
      error: null,
    });
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
    fireEvent.click(
      screen.getByRole("button", { name: /sign in to workspace/i }),
    );

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith(user));
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "person@example.com",
      password: "secure-password",
    });
    expect(supabase.auth.getClaims).toHaveBeenCalled();
  },
);

test("rejects accounts without an allowed app_metadata.role JWT claim", async () => {
  const onLogin = jest.fn();
  supabase.auth.signInWithPassword.mockResolvedValue({
    data: {
      user: {
        email: "person@example.com",
        user_metadata: { role: "secretary" },
      },
    },
    error: null,
  });
  supabase.auth.getClaims.mockResolvedValue({
    data: { claims: { app_metadata: { role: "administrator" } } },
    error: null,
  });
  render(<Login onLogin={onLogin} />);

  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: "person@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: "secure-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: /sign in to workspace/i }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    /app_metadata\.role JWT claim/i,
  );
  expect(supabase.auth.signOut).toHaveBeenCalled();
  expect(onLogin).not.toHaveBeenCalled();
});

test("creates an account, opens the 8-digit OTP verification step, verifies the OTP, and shows the Awaiting Account Confirmation card for new staff", async () => {
  const onLogin = jest.fn();
  supabase.auth.signUp.mockResolvedValue({
    data: { session: null },
    error: null,
  });
  supabase.auth.verifyOtp.mockResolvedValue({
    data: {
      user: {
        id: "user-1",
        email: "alex@example.com",
        app_metadata: { role: "staff" },
      },
      session: { access_token: "otp-session" },
    },
    error: null,
  });
  render(<Login onLogin={onLogin} />);

  await openSignupForm();
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

  await waitFor(() =>
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: "alex@example.com",
      password: "secure-password",
      options: { data: { full_name: "Alex Staff", role: "staff" } },
    }),
  );
  expect(
    await screen.findByRole("heading", { name: /verify your email/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent(
    /8-digit verification code/i,
  );

  // Paste the 8-digit OTP code into the first box
  const firstDigitBox = screen.getByLabelText(/verification code digit 1/i);
  fireEvent.paste(firstDigitBox, {
    clipboardData: { getData: () => "99288296" },
  });

  fireEvent.click(screen.getByRole("button", { name: /verify code/i }));

  await waitFor(() =>
    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      email: "alex@example.com",
      token: "99288296",
      type: "signup",
    }),
  );
  expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
  expect(onLogin).not.toHaveBeenCalled();
  expect(
    await screen.findByRole("heading", {
      name: /awaiting account confirmation/i,
    }),
  ).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent(
    /please wait for confirmation of your account from the secretary or dean/i,
  );
  expect(screen.getByRole("status")).toHaveTextContent(/proceed to the oic/i);
});

test("opens the 8-digit OTP screen and resends a code if an unconfirmed account attempts to sign in", async () => {
  supabase.auth.signInWithPassword.mockResolvedValue({
    data: { user: null, session: null },
    error: new Error("Email not confirmed"),
  });
  render(<Login onLogin={jest.fn()} />);

  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: "pending@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: "secure-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: /sign in to workspace/i }));

  expect(
    await screen.findByRole("heading", { name: /verify your email/i }),
  ).toBeInTheDocument();
  expect(supabase.auth.resend).toHaveBeenCalledWith({
    type: "signup",
    email: "pending@example.com",
  });
  expect(screen.getByRole("status")).toHaveTextContent(
    /not verified yet/i,
  );
});

test("hides secretary and dean signup choices when their slots are full", async () => {
  supabase.rpc.mockResolvedValue({
    data: [
      { role: "secretary", is_available: false },
      { role: "dean", is_available: false },
      { role: "staff", is_available: true },
    ],
    error: null,
  });
  render(<Login />);

  await openSignupForm();
  const roleSelect = screen.getByRole("combobox", { name: /^role$/i });

  await waitFor(() => {
    expect(roleSelect).toHaveValue("staff");
    expect(
      screen.queryByRole("option", { name: /secretary/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /^dean$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /faculty & staff/i }),
    ).toBeInTheDocument();
  });
  expect(supabase.rpc).toHaveBeenCalledWith(
    "get_signup_role_availability",
  );
});

test("shows only signup roles reported as available by Supabase", async () => {
  supabase.rpc.mockResolvedValue({
    data: [
      { role: "secretary", is_available: true },
      { role: "dean", is_available: false },
      { role: "staff", is_available: true },
    ],
    error: null,
  });
  render(<Login />);

  await openSignupForm();
  const roleSelect = screen.getByRole("combobox", { name: /^role$/i });

  await waitFor(() => {
    expect(roleSelect).toHaveValue("staff");
    expect(
      screen.getByRole("option", { name: /secretary/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /^dean$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /faculty & staff/i }),
    ).toBeInTheDocument();
  });
});

test("signs out an automatically authenticated signup and returns to login", async () => {
  supabase.auth.signUp.mockResolvedValue({
    data: { session: { access_token: "test-session" } },
    error: null,
  });
  supabase.auth.signOut.mockResolvedValue({ error: null });
  render(<Login />);

  await openSignupForm();
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
  await openSignupForm();
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

test("blocks a pending staff account at sign-in until approved by the Secretary or Dean", async () => {
  const onLogin = jest.fn();
  supabase.from.mockImplementation(() => {
    const query = {
      select: jest.fn(() => query),
      eq: jest.fn(() => query),
      maybeSingle: jest.fn(() =>
        Promise.resolve({
          data: { approval_status: "pending" },
          error: null,
        }),
      ),
    };
    return query;
  });
  supabase.auth.signInWithPassword.mockResolvedValue({
    data: {
      user: {
        id: "staff-pending-1",
        email: "newstaff@example.com",
        app_metadata: { role: "staff" },
      },
    },
    error: null,
  });
  supabase.auth.getClaims.mockResolvedValue({
    data: { claims: { app_metadata: { role: "staff" } } },
    error: null,
  });

  render(<Login onLogin={onLogin} />);

  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: "newstaff@example.com" },
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: "secure-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: /sign in to workspace/i }));

  expect(
    await screen.findByRole("heading", {
      name: /awaiting account confirmation/i,
    }),
  ).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent(
    /please wait for confirmation of your account from the secretary or dean/i,
  );
  expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
  expect(onLogin).not.toHaveBeenCalled();
});

test("does not offer demo sign-in", () => {
  render(<Login />);

  expect(screen.queryByText(/quick demo sign-in/i)).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /secretary/i }),
  ).not.toBeInTheDocument();
});
