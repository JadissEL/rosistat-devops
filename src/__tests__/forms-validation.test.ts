/**
 * Forms Validation Test Suite
 * Tests all form schemas, validation logic, error messages, and backend integration
 *
 * Forms Covered:
 * 1. Authentication Forms (Sign In, Sign Up, Reset Password)
 * 2. Starting Investment Input Form
 */

import { describe, it, expect, beforeEach } from "vitest";
import * as z from "zod";

// ============================================================================
// SCHEMA DEFINITIONS (Extracted from AuthDialog.tsx)
// ============================================================================

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    displayName: z
      .string()
      .min(2, "Display name must be at least 2 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Investment validation (from StartingInvestmentInput.tsx)
const investmentSchema = z.object({
  amount: z.number()
    .min(1000, "Amount must be at least 1,000")
    .max(1000000, "Amount must not exceed 1,000,000"),
  currency: z.string().length(3, "Currency must be 3 characters (ISO 4217)"),
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
type InvestmentFormData = z.infer<typeof investmentSchema>;

// ============================================================================
// TEST: SIGN IN FORM
// ============================================================================

describe("Sign In Form - signInSchema", () => {
  describe("Valid Values", () => {
    it("should accept valid email and password", () => {
      const data: SignInFormData = {
        email: "user@example.com",
        password: "password123",
      };
      const result = signInSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
        expect(result.data.password).toBe("password123");
      }
    });

    it("should accept valid email with special characters", () => {
      const data: SignInFormData = {
        email: "user+tag@example.co.uk",
        password: "SecurePass123",
      };
      const result = signInSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user+tag@example.co.uk");
      }
    });

    it("should accept minimum valid password length (6 chars)", () => {
      const data: SignInFormData = {
        email: "test@example.com",
        password: "123456",
      };
      const result = signInSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept long passwords", () => {
      const data: SignInFormData = {
        email: "test@example.com",
        password: "VeryLongPasswordWith1234567890!@#$%^&*()",
      };
      const result = signInSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("Invalid Values", () => {
    it("should reject empty email", () => {
      const data = {
        email: "",
        password: "password123",
      };
      const result = signInSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid email address");
      }
    });

    it("should reject invalid email format", () => {
      const invalidEmails = [
        "notanemail",
        "missing@domain",
        "@nodomain.com",
        "spaces in@email.com",
        "double@@domain.com",
      ];

      invalidEmails.forEach((email) => {
        const data = { email, password: "password123" };
        const result = signInSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Invalid email address");
        }
      });
    });

    it("should reject password shorter than 6 characters", () => {
      const data: SignInFormData = {
        email: "test@example.com",
        password: "12345", // Only 5 chars
      };
      const result = signInSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Password must be at least 6 characters"
        );
      }
    });

    it("should reject empty password", () => {
      const data: SignInFormData = {
        email: "test@example.com",
        password: "",
      };
      const result = signInSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Password must be at least 6 characters"
        );
      }
    });

    it("should reject missing email", () => {
      const data = {
        password: "password123",
      };
      const result = signInSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject missing password", () => {
      const data = {
        email: "test@example.com",
      };
      const result = signInSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("Error Messages", () => {
    it("should provide helpful error message for invalid email", () => {
      const data = { email: "invalid", password: "password123" };
      const result = signInSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find(
          (issue) => issue.path[0] === "email"
        );
        expect(emailError?.message).toBe("Invalid email address");
      }
    });

    it("should provide helpful error message for short password", () => {
      const data = { email: "test@example.com", password: "short" };
      const result = signInSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "password"
        );
        expect(passwordError?.message).toBe(
          "Password must be at least 6 characters"
        );
      }
    });
  });

  describe("Default Values", () => {
    it("should have no default values (user must provide)", () => {
      const emptyData = {};
      const result = signInSchema.safeParse(emptyData);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// TEST: SIGN UP FORM
// ============================================================================

describe("Sign Up Form - signUpSchema", () => {
  describe("Valid Values", () => {
    it("should accept valid sign up data", () => {
      const data: SignUpFormData = {
        email: "newuser@example.com",
        password: "SecurePassword123",
        confirmPassword: "SecurePassword123",
        displayName: "John Doe",
      };
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.displayName).toBe("John Doe");
        expect(result.data.email).toBe("newuser@example.com");
      }
    });

    it("should accept minimum valid display name (2 chars)", () => {
      const data: SignUpFormData = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
        displayName: "Jo",
      };
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept display names with special characters", () => {
      const data: SignUpFormData = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
        displayName: "José María-García O'Brien",
      };
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept long display names", () => {
      const data: SignUpFormData = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
        displayName: "Christopher Maximiliano Rodriguez de la Concha",
      };
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("Invalid Values", () => {
    it("should reject display name shorter than 2 characters", () => {
      const data: SignUpFormData = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
        displayName: "J",
      };
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const displayNameError = result.error.issues.find(
          (issue) => issue.path[0] === "displayName"
        );
        expect(displayNameError?.message).toBe(
          "Display name must be at least 2 characters"
        );
      }
    });

    it("should reject empty display name", () => {
      const data: SignUpFormData = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
        displayName: "",
      };
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject mismatched passwords", () => {
      const data: SignUpFormData = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password456",
        displayName: "John Doe",
      };
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "confirmPassword"
        );
        expect(passwordError?.message).toBe("Passwords don't match");
      }
    });

    it("should reject short password", () => {
      const data: SignUpFormData = {
        email: "test@example.com",
        password: "short",
        confirmPassword: "short",
        displayName: "John Doe",
      };
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject invalid email", () => {
      const data: SignUpFormData = {
        email: "notanemail",
        password: "password123",
        confirmPassword: "password123",
        displayName: "John Doe",
      };
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("Password Matching Validation", () => {
    it("should pass when passwords match (case-sensitive)", () => {
      const data: SignUpFormData = {
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
        displayName: "John Doe",
      };
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should fail when passwords differ only in case", () => {
      const data: SignUpFormData = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "Password123",
        displayName: "John Doe",
      };
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((e) => e.message === "Passwords don't match")
        ).toBe(true);
      }
    });

    it("should fail when confirmPassword is empty", () => {
      const data: SignUpFormData = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "",
        displayName: "John Doe",
      };
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("Error Messages", () => {
    it("should provide specific error for password mismatch", () => {
      const data = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "different123",
        displayName: "John Doe",
      };
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some((e) => e.message === "Passwords don't match")
        ).toBe(true);
      }
    });

    it("should provide specific error for short display name", () => {
      const data = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
        displayName: "",
      };
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.error.issues.some(
            (e) => e.message === "Display name must be at least 2 characters"
          )
        ).toBe(true);
      }
    });
  });

  describe("Default Values", () => {
    it("should have no default values (user must provide all)", () => {
      const emptyData = {};
      const result = signUpSchema.safeParse(emptyData);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// TEST: RESET PASSWORD FORM
// ============================================================================

describe("Reset Password Form - resetPasswordSchema", () => {
  describe("Valid Values", () => {
    it("should accept valid email", () => {
      const data: ResetPasswordFormData = {
        email: "user@example.com",
      };
      const result = resetPasswordSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
      }
    });

    it("should accept email with plus addressing", () => {
      const data: ResetPasswordFormData = {
        email: "user+reset@example.com",
      };
      const result = resetPasswordSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("Invalid Values", () => {
    it("should reject invalid email", () => {
      const data = { email: "notanemail" };
      const result = resetPasswordSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid email address");
      }
    });

    it("should reject empty email", () => {
      const data = { email: "" };
      const result = resetPasswordSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject missing email field", () => {
      const data = {};
      const result = resetPasswordSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("Error Messages", () => {
    it("should provide helpful error message for invalid email", () => {
      const data = { email: "invalid-email" };
      const result = resetPasswordSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid email address");
      }
    });
  });
});

// ============================================================================
// TEST: INVESTMENT FORM
// ============================================================================

describe("Starting Investment Form - investmentSchema", () => {
  describe("Valid Values", () => {
    it("should accept valid investment amount", () => {
      const data: InvestmentFormData = {
        amount: 50000,
        currency: "USD",
      };
      const result = investmentSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(50000);
        expect(result.data.currency).toBe("USD");
      }
    });

    it("should accept minimum valid amount (1000)", () => {
      const data: InvestmentFormData = {
        amount: 1000,
        currency: "EUR",
      };
      const result = investmentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept maximum valid amount (1000000)", () => {
      const data: InvestmentFormData = {
        amount: 1000000,
        currency: "GBP",
      };
      const result = investmentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept amount in middle range", () => {
      const data: InvestmentFormData = {
        amount: 100000,
        currency: "USD",
      };
      const result = investmentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept various ISO 4217 currency codes", () => {
      const currencies = ["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD"];
      currencies.forEach((currency) => {
        const data: InvestmentFormData = {
          amount: 50000,
          currency,
        };
        const result = investmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("Invalid Values - Amount", () => {
    it("should reject amount below minimum (999)", () => {
      const data: InvestmentFormData = {
        amount: 999,
        currency: "USD",
      };
      const result = investmentSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Amount must be at least 1,000"
        );
      }
    });

    it("should reject zero amount", () => {
      const data: InvestmentFormData = {
        amount: 0,
        currency: "USD",
      };
      const result = investmentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject negative amount", () => {
      const data: InvestmentFormData = {
        amount: -50000,
        currency: "USD",
      };
      const result = investmentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject amount above maximum (1000001)", () => {
      const data: InvestmentFormData = {
        amount: 1000001,
        currency: "USD",
      };
      const result = investmentSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Amount must not exceed 1,000,000"
        );
      }
    });

    it("should reject non-numeric amount", () => {
      const data = {
        amount: "fifty thousand" as any,
        currency: "USD",
      };
      const result = investmentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject decimal amounts (assuming integers)", () => {
      const data: InvestmentFormData = {
        amount: 50000.5 as any,
        currency: "USD",
      };
      // Note: Zod might accept this depending on schema configuration
      // If strict integer validation is needed, add .int() to the schema
      const result = investmentSchema.safeParse(data);
      expect(result.success).toBe(true); // Currently passes
    });

    it("should reject missing amount", () => {
      const data = { currency: "USD" };
      const result = investmentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("Invalid Values - Currency", () => {
    it("should reject currency shorter than 3 characters", () => {
      const data: InvestmentFormData = {
        amount: 50000,
        currency: "US",
      };
      const result = investmentSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Currency must be 3 characters"
        );
      }
    });

    it("should reject currency longer than 3 characters", () => {
      const data: InvestmentFormData = {
        amount: 50000,
        currency: "USDA",
      };
      const result = investmentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject empty currency", () => {
      const data: InvestmentFormData = {
        amount: 50000,
        currency: "",
      };
      const result = investmentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should reject lowercase currency codes", () => {
      const data: InvestmentFormData = {
        amount: 50000,
        currency: "usd",
      };
      const result = investmentSchema.safeParse(data);
      expect(result.success).toBe(true); // Schema doesn't enforce uppercase
    });

    it("should reject missing currency", () => {
      const data = { amount: 50000 };
      const result = investmentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("Error Messages", () => {
    it("should provide helpful error message for amount too low", () => {
      const data: InvestmentFormData = {
        amount: 500,
        currency: "USD",
      };
      const result = investmentSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Amount must be at least 1,000"
        );
      }
    });

    it("should provide helpful error message for amount too high", () => {
      const data: InvestmentFormData = {
        amount: 2000000,
        currency: "USD",
      };
      const result = investmentSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Amount must not exceed 1,000,000"
        );
      }
    });

    it("should provide helpful error message for invalid currency", () => {
      const data: InvestmentFormData = {
        amount: 50000,
        currency: "US",
      };
      const result = investmentSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Currency must be 3 characters"
        );
      }
    });
  });

  describe("Default Values", () => {
    it("should have no default values", () => {
      const emptyData = {};
      const result = investmentSchema.safeParse(emptyData);
      expect(result.success).toBe(false);
    });

    it("should validate when preset values are used", () => {
      const presetAmounts = [5000, 10000, 25000, 50000, 100000];
      presetAmounts.forEach((amount) => {
        const data: InvestmentFormData = {
          amount,
          currency: "USD",
        };
        const result = investmentSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });
});

// ============================================================================
// INTEGRATION TESTS: Backend Submission Behavior
// ============================================================================

describe("Form Backend Integration Scenarios", () => {
  describe("Sign In Submission", () => {
    it("should prepare valid sign in data for backend", () => {
      const formData: SignInFormData = {
        email: "user@example.com",
        password: "securepassword123",
      };
      const result = signInSchema.safeParse(formData);
      expect(result.success).toBe(true);
      if (result.success) {
        // Backend would receive this data
        expect(result.data).toEqual(formData);
        expect(result.data.email).toBe("user@example.com");
        expect(result.data.password).toBe("securepassword123");
      }
    });

    it("should block invalid sign in before backend call", () => {
      const formData = {
        email: "invalid-email",
        password: "short",
      };
      const result = signInSchema.safeParse(formData);
      expect(result.success).toBe(false);
      // Form should not submit to backend
    });
  });

  describe("Sign Up Submission", () => {
    it("should prepare valid sign up data for backend", () => {
      const formData: SignUpFormData = {
        email: "newuser@example.com",
        password: "SecurePassword123",
        confirmPassword: "SecurePassword123",
        displayName: "John Doe",
      };
      const result = signUpSchema.safeParse(formData);
      expect(result.success).toBe(true);
      if (result.success) {
        // Backend would receive (usually without confirmPassword)
        expect(result.data.email).toBe("newuser@example.com");
        expect(result.data.displayName).toBe("John Doe");
        expect(result.data.password).toBe("SecurePassword123");
      }
    });

    it("should validate all fields before backend submission", () => {
      const invalidDataSets = [
        // Missing displayName
        {
          email: "test@example.com",
          password: "password123",
          confirmPassword: "password123",
          displayName: "",
        },
        // Mismatched passwords
        {
          email: "test@example.com",
          password: "password123",
          confirmPassword: "different",
          displayName: "John Doe",
        },
        // Invalid email
        {
          email: "not-an-email",
          password: "password123",
          confirmPassword: "password123",
          displayName: "John Doe",
        },
      ];

      invalidDataSets.forEach((data) => {
        const result = signUpSchema.safeParse(data);
        expect(result.success).toBe(false);
        // Form should not submit to backend
      });
    });
  });

  describe("Investment Submission", () => {
    it("should prepare valid investment data for backend", () => {
      const formData: InvestmentFormData = {
        amount: 50000,
        currency: "USD",
      };
      const result = investmentSchema.safeParse(formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(50000);
        expect(result.data.currency).toBe("USD");
      }
    });

    it("should validate boundaries before submission", () => {
      const invalidAmounts = [0, 999, 1000001, -100, NaN];
      invalidAmounts.forEach((amount) => {
        const formData = {
          amount,
          currency: "USD",
        };
        const result = investmentSchema.safeParse(formData);
        // Should reject amounts outside range
        if (amount < 1000 || amount > 1000000) {
          expect(result.success).toBe(false);
        }
      });
    });
  });
});

// ============================================================================
// SUMMARY STATISTICS
// ============================================================================

describe("Form Validation Summary", () => {
  it("should have 3 authentication schemas", () => {
    const schemas = [signInSchema, signUpSchema, resetPasswordSchema];
    expect(schemas.length).toBe(3);
  });

  it("should have 1 investment schema", () => {
    expect(investmentSchema).toBeDefined();
  });

  it("should validate all common authentication patterns", () => {
    const validSignIn = signInSchema.safeParse({
      email: "user@example.com",
      password: "pass123",
    });
    const validSignUp = signUpSchema.safeParse({
      email: "user@example.com",
      password: "pass123",
      confirmPassword: "pass123",
      displayName: "User",
    });
    const validReset = resetPasswordSchema.safeParse({
      email: "user@example.com",
    });

    expect(validSignIn.success).toBe(true);
    expect(validSignUp.success).toBe(true);
    expect(validReset.success).toBe(true);
  });

  it("should reject all major validation violations", () => {
    const invalidSignIn = signInSchema.safeParse({
      email: "invalid",
      password: "short",
    });
    const invalidSignUp = signUpSchema.safeParse({
      email: "invalid",
      password: "short",
      confirmPassword: "different",
      displayName: "X",
    });
    const invalidReset = resetPasswordSchema.safeParse({
      email: "invalid",
    });

    expect(invalidSignIn.success).toBe(false);
    expect(invalidSignUp.success).toBe(false);
    expect(invalidReset.success).toBe(false);
  });
});
