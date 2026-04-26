export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  score: number; // 0-4
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  let score = 0;

  if (password.length < 8) {
    errors.push("At least 8 characters required");
  } else {
    score++;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("At least one uppercase letter required");
  } else {
    score++;
  }

  if (!/[a-z]/.test(password)) {
    errors.push("At least one lowercase letter required");
  } else {
    score++;
  }

  if (!/[0-9]/.test(password)) {
    errors.push("At least one number required");
  } else {
    score++;
  }

  if (!/[@$!%*?&]/.test(password)) {
    errors.push("At least one special character required (@$!%*?&)");
  } else {
    score++;
  }

  const commonPasswords = [
    "password",
    "password123",
    "123456789",
    "admin123",
    "clinic123",
    "carenova123",
    "welcome1",
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push("This password is too common. Please choose a stronger one.");
    score = 0;
  }

  return {
    isValid: errors.length === 0,
    errors,
    score: Math.min(score, 4),
  };
}
