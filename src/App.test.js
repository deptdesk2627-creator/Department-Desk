import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { authenticateUser, signOutUser } from "./firebase/authService";

jest.mock("./firebase/authService", () => ({
  authenticateUser: jest.fn(),
  signOutUser: jest.fn(),
}));

beforeEach(() => {
  window.localStorage.clear();
  jest.clearAllMocks();
  authenticateUser.mockResolvedValue({ role: "secretary" });
  signOutUser.mockResolvedValue(undefined);
});

test("renders DeptDesk login screen, authenticates, and logs out from header and sidebar", async () => {
  render(<App />);
  expect(
    screen.getByRole("heading", { name: /sign in to deptdesk/i }),
  ).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "securepass123" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: /sign in to workspace/i }),
  );

  await waitFor(() => {
    expect(
      screen.getByRole("complementary", { name: /main navigation/i }),
    ).toBeInTheDocument();
  });

  // Log out from top-right header profile menu
  fireEvent.click(
    screen.getByRole("button", { name: /ma'am aubrey|cha gamay/i }),
  );
  fireEvent.click(screen.getByRole("menuitem", { name: /log out/i }));

  await screen.findByRole("heading", { name: /sign in to deptdesk/i });
  expect(signOutUser).toHaveBeenCalledTimes(1);

  // Sign back in and log out from sidebar logout button
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "securepass123" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: /sign in to workspace/i }),
  );
  await waitFor(() => {
    expect(
      screen.getByRole("complementary", { name: /main navigation/i }),
    ).toBeInTheDocument();
  });
  fireEvent.click(
    screen.getByRole("button", { name: /^log out$/i }),
  );

  await screen.findByRole("heading", { name: /sign in to deptdesk/i });
  expect(signOutUser).toHaveBeenCalledTimes(2);
});
