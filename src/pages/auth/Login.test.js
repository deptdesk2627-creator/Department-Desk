import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Login from "./Login";
import { registerUser } from "../../firebase/authService";

jest.mock("../../firebase/authService", () => ({
  registerUser: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  registerUser.mockResolvedValue(undefined);
});

test("submits selected role credentials with smooth transition", () => {
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

  fireEvent.click(
    screen.getByRole("button", { name: /sign in to workspace/i }),
  );
  expect(onLogin).toHaveBeenCalledWith("dean");
});

test("opens quick demo modal and signs into demo account", () => {
  const onLogin = jest.fn();
  render(<Login onLogin={onLogin} defaultRoleId="secretary" />);

  fireEvent.click(
    screen.getByRole("button", { name: /quick demo sign-in/i }),
  );
  fireEvent.click(screen.getByRole("button", { name: /faculty & staff/i }));
  expect(onLogin).toHaveBeenCalledWith("staff");
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
