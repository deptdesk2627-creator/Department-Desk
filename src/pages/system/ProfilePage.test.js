import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ProfilePage from "./ProfilePage";
import { supabase } from "../../supabase/supabaseClient";

jest.mock("../../supabase/supabaseClient", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      updateUser: jest.fn(),
    },
  },
}));

const BASE_ROLE = {
  id: "staff",
  label: "Department Staff",
  description: "Office operations",
  initials: "DS",
};

const BASE_PROFILE = {
  name: "Ma'am Aubrey",
  title: "Department Secretary",
  email: "aubrey@deptdesk.edu",
  phone: "Local 4022",
  office: "Room 204",
  status: "available",
  statusNote: "",
};

const BASE_DATA = {
  tasks: [],
  transactions: [],
  inventory: [],
  notifications: [],
};

describe("ProfilePage password security", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { email: "aubrey@deptdesk.edu" } },
      error: null,
    });
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { email: "aubrey@deptdesk.edu" } },
      error: null,
    });
    supabase.auth.updateUser.mockResolvedValue({
      data: { user: { email: "aubrey@deptdesk.edu" } },
      error: null,
    });
  });

  function renderProfile() {
    return render(
      <ProfilePage
        role={BASE_ROLE}
        profile={BASE_PROFILE}
        onSave={jest.fn()}
        data={BASE_DATA}
        onNavigate={jest.fn()}
      />,
    );
  }

  test("requires current password before updating", async () => {
    renderProfile();

    fireEvent.change(screen.getByPlaceholderText("Create a strong password"), {
      target: { value: "StrongPass1!" },
    });
    fireEvent.change(screen.getByPlaceholderText("Re-enter new password"), {
      target: { value: "StrongPass1!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    expect(
      await screen.findByText(/please enter your current password/i),
    ).toBeInTheDocument();
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  test("rejects weak new passwords", async () => {
    renderProfile();

    fireEvent.change(
      screen.getByPlaceholderText("Enter your current password"),
      { target: { value: "OldPass1!" } },
    );
    fireEvent.change(screen.getByPlaceholderText("Create a strong password"), {
      target: { value: "weak123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Re-enter new password"), {
      target: { value: "weak123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    expect(
      await screen.findByText(/at least 8 characters and include uppercase/i),
    ).toBeInTheDocument();
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  test("rejects when new password matches current password", async () => {
    renderProfile();

    fireEvent.change(
      screen.getByPlaceholderText("Enter your current password"),
      { target: { value: "SamePass1!" } },
    );
    fireEvent.change(screen.getByPlaceholderText("Create a strong password"), {
      target: { value: "SamePass1!" },
    });
    fireEvent.change(screen.getByPlaceholderText("Re-enter new password"), {
      target: { value: "SamePass1!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    expect(
      await screen.findByText(/different from your current password/i),
    ).toBeInTheDocument();
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  test("blocks update when current password verification fails", async () => {
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid login credentials" },
    });

    renderProfile();

    fireEvent.change(
      screen.getByPlaceholderText("Enter your current password"),
      { target: { value: "WrongOld1!" } },
    );
    fireEvent.change(screen.getByPlaceholderText("Create a strong password"), {
      target: { value: "NewStrong2@" },
    });
    fireEvent.change(screen.getByPlaceholderText("Re-enter new password"), {
      target: { value: "NewStrong2@" },
    });
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    expect(
      await screen.findByText(/current password is incorrect/i),
    ).toBeInTheDocument();
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "aubrey@deptdesk.edu",
      password: "WrongOld1!",
    });
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  test("verifies current password and updates when new password is strong", async () => {
    renderProfile();

    const currentInput = screen.getByPlaceholderText(
      "Enter your current password",
    );
    const newInput = screen.getByPlaceholderText("Create a strong password");
    const confirmInput = screen.getByPlaceholderText("Re-enter new password");

    fireEvent.change(currentInput, { target: { value: "OldStrong1!" } });
    fireEvent.change(newInput, { target: { value: "NewStrong2@" } });
    fireEvent.change(confirmInput, { target: { value: "NewStrong2@" } });

    expect(screen.getByText("Strong")).toBeInTheDocument();
    expect(screen.getByText("Passwords match.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "aubrey@deptdesk.edu",
        password: "OldStrong1!",
      });
    });
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({
      password: "NewStrong2@",
    });
    expect(await screen.findByText("Password updated.")).toBeInTheDocument();
    expect(currentInput.value).toBe("");
    expect(newInput.value).toBe("");
    expect(confirmInput.value).toBe("");
  });
});
