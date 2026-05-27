import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "@/pages/LoginPage";
import { MemoryRouter } from "react-router-dom";

// Mock AuthContext
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockLoginWithGoogle = vi.fn();
const mockResetPassword = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    userProfile: null,
    loading: false,
    login: mockLogin,
    register: mockRegister,
    loginWithGoogle: mockLoginWithGoogle,
    resetPassword: mockResetPassword,
    logout: vi.fn(),
  }),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form", () => {
    renderPage();
    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    expect(screen.getByText("Real Estate CRM")).toBeInTheDocument();
  });

  it("shows email and password fields", () => {
    renderPage();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("calls login on submit", async () => {
    mockLogin.mockResolvedValue(undefined);
    renderPage();

    const emailInput = screen.getByPlaceholderText("you@example.com");
    const passwordInput = screen.getByPlaceholderText("••••••••");
    const submitBtn = screen.getByText("Sign In");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
    });
  });

  it("shows error on failed login", async () => {
    mockLogin.mockRejectedValue({ message: "Invalid credentials" });
    renderPage();

    const emailInput = screen.getByPlaceholderText("you@example.com");
    const passwordInput = screen.getByPlaceholderText("••••••••");
    const submitBtn = screen.getByText("Sign In");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrong" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  it("shows Firebase auth error messages", async () => {
    mockLogin.mockRejectedValue({ code: "auth/user-not-found" });
    renderPage();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "unknown@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByText("Sign In"));

    await waitFor(() => {
      expect(
        screen.getByText("No account found with this email"),
      ).toBeInTheDocument();
    });
  });

  it("shows registration form toggle", () => {
    renderPage();
    fireEvent.click(screen.getByText("Don't have an account? Register"));

    expect(screen.getByText("Create your account")).toBeInTheDocument();
    expect(screen.getByText("Create Account")).toBeInTheDocument();
  });

  it("shows forgot password link and calls resetPassword", async () => {
    mockResetPassword.mockResolvedValue(undefined);
    renderPage();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@example.com" },
    });

    fireEvent.click(screen.getByText("Forgot password?"));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith("test@example.com");
    });
    expect(
      screen.getByText("Password reset email sent. Check your inbox."),
    ).toBeInTheDocument();
  });

  it("renders Google login button", () => {
    renderPage();
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
  });
});
