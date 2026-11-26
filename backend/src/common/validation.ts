import { ValidationError, ValidationPipe } from "@nestjs/common";
import { FieldError, validationError } from "@/common/errors";

function flatten(errors: ValidationError[], parent = ""): FieldError[] {
  const out: FieldError[] = [];
  for (const error of errors) {
    const field = parent ? `${parent}.${error.property}` : error.property;
    for (const [code, message] of Object.entries(error.constraints ?? {})) {
      out.push({ field, code: toCode(code), message });
    }
    if (error.children?.length) {
      out.push(...flatten(error.children, field));
    }
  }
  return out;
}

function toCode(constraint: string): string {
  switch (constraint) {
    case "isNotEmpty":
    case "isDefined":
      return "REQUIRED";
    case "maxLength":
    case "isLength":
      return "TOO_LONG";
    case "minLength":
      return "TOO_SHORT";
    case "whitelistValidation":
      return "UNKNOWN_FIELD";
    default:
      return "INVALID";
  }
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => validationError(flatten(errors))
  });
}
