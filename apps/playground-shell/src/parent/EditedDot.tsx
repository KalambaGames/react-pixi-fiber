// A saved edit of an example: a dot after its title in the sidebar and the breadcrumb.
export function EditedDot({ label }: { label?: string }) {
  return (
    <span
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className="size-1.5 shrink-0 rounded-full bg-current"
      role={label ? "img" : undefined}
    />
  );
}
