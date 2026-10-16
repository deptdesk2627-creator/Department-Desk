import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

beforeEach(() => {
  window.localStorage.clear();
});

test("renders DeptDesk login screen, signs into workspace, and logs out from header and sidebar menus", () => {
  render(<App />);
  expect(
    screen.getByRole("heading", { name: /sign in to deptdesk/i }),
  ).toBeInTheDocument();

  fireEvent.click(
    screen.getByRole("button", { name: /sign in to workspace/i }),
  );

  expect(
    screen.getByRole("complementary", { name: /main navigation/i }),
  ).toBeInTheDocument();

  // Log out from top-right header profile menu
  fireEvent.click(
    document.getElementById("profile-menu-trigger"),
  );
  fireEvent.click(screen.getByRole("menuitem", { name: /log out/i }));

  expect(
    screen.getByRole("heading", { name: /sign in to deptdesk/i }),
  ).toBeInTheDocument();

  // Sign back in and log out from bottom-left sidebar profile menu
  fireEvent.click(
    screen.getByRole("button", { name: /sign in to workspace/i }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: /ma'am aubrey menu/i }),
  );
  fireEvent.click(screen.getByRole("menuitem", { name: /log out/i }));

  expect(
    screen.getByRole("heading", { name: /sign in to deptdesk/i }),
  ).toBeInTheDocument();
});
