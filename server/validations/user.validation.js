import { z } from "zod";

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Name must be at least 3 characters")
      .max(50),
    email: z.email("Invalid email format"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      )
      .optional(),
    confirmpassword: z.string().optional(),
    phone: z
      .string()
      .regex(/^[0-9]{10}$/, "Phone must be 10 digits")
      .optional(),
    role: z.enum(["donor", "patient", "hospital"], {
      error: "Invalid role selected",
    }),
    bloodGroup: z
      .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
      .optional(),
    age: z
      .number()
      .min(18, "Minimum age is 18")
      .max(65, "Maximum age is 65")
      .optional(),
    weight: z.number().min(50, "Minimum weight must be 50kg").optional(),
    gender: z.enum(["Male", "Female", "Other"]),
    medicalHistory: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.isOAuthUser && !data.password) {
      ctx.addIssue({
        path: ["password"],
        message: "Password is required",
      });
    }

    if (data.role === "donor") {
      if (!data.bloodGroup) {
        ctx.addIssue({
          path: ["bloodGroup"],
          message: "Blood group is required for donors",
        });
      }
      if (!data.weight) {
        ctx.addIssue({
          path: ["weight"],
          message: "Weight is required for donors",
        });
      }
    }

    if (data.role === "patient" && !data.bloodGroup) {
      ctx.addIssue({
        path: ["bloodGroup"],
        message: "Blood group is required for patients",
      });
    }
  });

const verifyOtpSchema = z.object({
  email: z.email("Invalid email address"),
  otp: z
    .string()
    .trim()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
});

const resendOtpSchema = z.object({
  email: z.email("Invalid email address"),
});

const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),
});

const updateProfileDetailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(50)
    .optional(),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone must be 10 digits")
    .optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  medicalHistory: z.string().max(500).optional(),
  age: z.coerce
    .number()
    .min(18, "Minimum age is 18")
    .max(65, "Maximum age is 65")
    .optional(),
  weight: z.coerce.number().min(50, "Minimum weight must be 50kg").optional(),
});

const changePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "oldPassword must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      ),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "newPassword must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      ),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "confirmPassword must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      ),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirm password do not match",
    path: ["confirmPassword"],
  });

const forgotPasswordSchema = z.object({
  email: z.email("Invalid email address"),
});

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      ),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "ConfirmPassword must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  updateProfileDetailsSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
