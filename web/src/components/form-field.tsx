import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FormFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  control: Control<T>;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  multiline?: boolean;
  rows?: number;
}

export function FormField<T extends FieldValues>({
  name,
  control,
  label,
  type = "text",
  placeholder,
  autoComplete,
  multiline,
  rows,
}: FormFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          {multiline ? (
            <Textarea
              {...field}
              id={name}
              placeholder={placeholder}
              rows={rows}
              aria-invalid={fieldState.invalid}
            />
          ) : (
            <Input
              {...field}
              id={name}
              type={type}
              placeholder={placeholder}
              autoComplete={autoComplete}
              aria-invalid={fieldState.invalid}
            />
          )}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
