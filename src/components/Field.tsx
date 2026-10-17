type Option = { value: string; label: string };

type Props = {
  label: string;
  name: string;
  uid?: string;
  type?: string;
  defaultValue?: string | number | boolean;
  required?: boolean;
  textarea?: boolean;
  rows?: number;
  hint?: string;
  options?: Option[];
  dataType?: "lines";
  min?: number;
  max?: number;
  autoComplete?: string;
  ltr?: boolean;
  placeholder?: string;
};

/** Labelled form control (input, textarea, select or checkbox) with a unique id per form via `uid`. */
export function Field({
  label,
  name,
  uid = "f",
  type = "text",
  defaultValue,
  required,
  textarea,
  rows = 4,
  hint,
  options,
  dataType,
  min,
  max,
  autoComplete,
  ltr,
  placeholder,
}: Props) {
  const id = `${uid}-${name}`;
  const hintId = hint ? `${id}-hint` : undefined;

  if (type === "checkbox") {
    return (
      <label className="flex min-h-11 items-center gap-3 font-semibold">
        <input type="checkbox" name={name} defaultChecked={Boolean(defaultValue)} className="size-5 accent-brand" />
        {label}
      </label>
    );
  }

  const common = {
    id,
    name,
    required,
    "aria-describedby": hintId,
    className: "input",
    dir: ltr ? ("ltr" as const) : undefined,
    placeholder,
  };

  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {options ? (
        <select {...common} defaultValue={defaultValue === undefined ? undefined : String(defaultValue)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : textarea ? (
        <textarea {...common} rows={rows} data-type={dataType} defaultValue={defaultValue === undefined ? undefined : String(defaultValue)} />
      ) : (
        <input
          {...common}
          type={type}
          min={min}
          max={max}
          autoComplete={autoComplete}
          defaultValue={defaultValue === undefined ? undefined : String(defaultValue)}
        />
      )}
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
