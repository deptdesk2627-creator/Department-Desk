import { fireEvent, render, screen } from "@testing-library/react";
import Login from "./Login";

test("submits selected role credentials or quick demo role buttons", () => {
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

  // Open quick demo modal and sign in
  fireEvent.click(
    screen.getByRole("button", { name: /quick demo sign-in/i }),
  );
  fireEvent.click(screen.getByRole("button", { name: /faculty & staff/i }));
  expect(onLogin).toHaveBeenCalledWith("staff");
});
