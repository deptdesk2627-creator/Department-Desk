import { fireEvent, render, screen } from "@testing-library/react";
import Login from "./Login";

test("submits selected role credentials or quick demo role buttons", () => {
  const onLogin = jest.fn();
  render(<Login onLogin={onLogin} defaultRoleId="secretary" />);

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

  fireEvent.click(screen.getByRole("button", { name: /faculty & staff/i }));
  expect(onLogin).toHaveBeenCalledWith("staff");
});
