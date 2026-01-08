export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationData {
  value: any;
  rules: ValidationRule[];
}

export interface ValidationInput {
  [key: string]: ValidationData;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateForm(data: ValidationInput): ValidationResult {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const [field, fieldData] of Object.entries(data)) {
    const { value, rules } = fieldData;

    for (const rule of rules) {
      // Required validation
      if (rule.required && (!value || value.toString().trim() === "")) {
        errors[field] = "Ce champ est requis";
        isValid = false;
        break;
      }

      // Skip other validations if field is empty and not required
      if (!value && !rule.required) continue;

      // Min length validation
      if (rule.minLength && value.length < rule.minLength) {
        errors[field] = `Minimum ${rule.minLength} caractères requis`;
        isValid = false;
        break;
      }

      // Max length validation
      if (rule.maxLength && value.length > rule.maxLength) {
        errors[field] = `Maximum ${rule.maxLength} caractères autorisés`;
        isValid = false;
        break;
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        errors[field] = "Format invalide";
        isValid = false;
        break;
      }

      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(value);
        if (customError) {
          errors[field] = customError;
          isValid = false;
          break;
        }
      }
    }
  }

  return { isValid, errors };
}

export const validationRules = {
  required: { required: true },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (!value.includes("@")) return "Email invalide";
      return null;
    },
  },
  minLength: (length: number) => ({ minLength: length }),
  password: {
    required: true,
    minLength: 6,
    custom: (value: string) => {
      if (value.length < 6)
        return "Le mot de passe doit contenir au moins 6 caractères";
      return null;
    },
  },
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
  },
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50,
  },
  username: {
    required: true,
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_]+$/,
    custom: (value: string) => {
      if (!/^[a-zA-Z0-9_]+$/.test(value))
        return "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores";
      return null;
    },
  },
};
