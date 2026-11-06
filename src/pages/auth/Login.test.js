import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Login from "./Login";
import {
  authenticateUser,
  registerUser,
  resetUserPassword,
} from "../../firebase/authService";

jest.mock("../../firebase/authService", () => ({
  authenticateUser: jest.fn(),
  registerUser: jest.fn(),
  resetUserPassword: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  authenticateUser.mockResolvedValue({ role: "secretary" });
  registerUser.mockResolvedValue(undefined);
  resetUserPassword.mockResolvedValue(undefined);
});

test("authenticates selected role credentials before entering the workspace", async () => {
  const onLogin = jest.fn();
  render(<Login onLogin={onLogin} defaultRoleId="secretary" />);

  expect(
    screen.getByRole("heading", { name: /sign in to deptdesk/i }),
  ).toBeInTheDocument();

  expect(
    screen.getByRole("heading", { name: /hello,\s*welcome!/i }),
  ).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/workspace role/i), {
    target: { value: "dean" },
  });
  expect(screen.getByLabelText(/email address/i)).toHaveValue(
    "dean@deptdesk.edu",
  );
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "securepass123" },
  });

  fireEvent.click(
    screen.getByRole("button", { name: /sign in to workspace/i }),
  );
  await waitFor(() => {
    expect(authenticateUser).toHaveBeenCalledWith(
      "dean@deptdesk.edu",
      "securepass123",
      "dean",
    );
  });
  expect(onLogin).toHaveBeenCalledWith("dean");
});

test("removes demo sign-in and sends a password reset to the entered email", async () => {
  render(<Login onLogin={jest.fn()} />);
  expect(
    screen.queryByRole("button", { name: /quick demo sign-in/i }),
  ).not.toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: "  person@example.com " },
  });
  fireEvent.click(screen.getByRole("button", { name: /forgot password/i }));

  await waitFor(() => {
    expect(resetUserPassword).toHaveBeenCalledWith("person@example.com");
  });
  expect(await screen.findByRole("status")).toHaveTextContent(
    /reset link has been sent/i,
  );
  expect(screen.queryByText(/deptdesk123/i)).not.toBeInTheDocument();
});

test("does not enter the workspace when authentication fails", async () => {
  authenticateUser.mockRejectedValue(
    new Error("The selected workspace role does not match this account."),
  );
  const onLogin = jest.fn();
  render(<Login onLogin={onLogin} />);

  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "wrongpass123" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: /sign in to workspace/i }),
  );

  expect(await screen.findByRole("alert")).toHaveTextContent(
    /selected workspace role does not match/i,
  );
  expect(onLogin).not.toHaveBeenCalled();
});

test("applies dark theme attribute to split page container", () => {
  render(<Login onLogin={jest.fn()} theme="dark" />);

  const page = screen.getByTestId("login-split-page");
  expect(page).toHaveAttribute("data-theme", "dark");
});

test("registers a sign-up form with Firebase and confirms success", async () => {
  const onLogin = jest.fn();
  render(<Login onLogin={onLogin} defaultRoleId="secretary" />);

  fireEvent.click(screen.getByRole("button", { name: /^sign up$/i }));

  expect(
    screen.getByRole("heading", { name: /create your deptdesk account/i }),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/account role/i), {
    target: { value: "staff" },
  });
  expect(screen.getByLabelText(/account role/i)).toHaveValue("staff");
  expect(
    screen.getByRole("option", { name: /^secretary$/i }),
  ).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/full name/i), {
    target: { value: "Taylor User" },
  });
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: "taylor@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "securepass123" },
  });
  fireEvent.change(screen.getByLabelText(/confirm password/i), {
    target: { value: "securepass123" },
  });
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));

  await waitFor(() => {
    expect(registerUser).toHaveBeenCalledWith(
      "taylor@example.com",
      "securepass123",
      "Taylor User",
      "staff",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      /account created successfully/i,
    );
  });
  expect(onLogin).not.toHaveBeenCalled();
});

test("shows Firebase registration errors to the user", async () => {
  registerUser.mockRejectedValue(new Error("This email is already in use."));
  render(<Login onLogin={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
  fireEvent.change(screen.getByLabelText(/full name/i), {
    target: { value: "Taylor User" },
  });
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: "taylor@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "securepass123" },
  });
  fireEvent.change(screen.getByLabelText(/confirm password/i), {
    target: { value: "securepass123" },
  });
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    /email is already in use/i,
  );
});

test("requires matching passwords before showing sign-up confirmation", () => {
  render(<Login onLogin={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
  fireEvent.change(screen.getByLabelText(/full name/i), {
    target: { value: "Taylor User" },
  });
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: "taylor@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "securepass123" },
  });
  fireEvent.change(screen.getByLabelText(/confirm password/i), {
    target: { value: "differentpass" },
  });
  fireEvent.click(screen.getByRole("button", { name: /create account/i }));

  expect(screen.getByRole("alert")).toHaveTextContent(
    /your passwords do not match/i,
  );
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
