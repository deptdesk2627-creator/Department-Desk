import { fireEvent, render, screen } from "@testing-library/react";
import Login from "./Login";

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
