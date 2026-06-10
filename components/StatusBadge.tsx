import type { StatusOption } from "@/lib/constants";

type Props = {
  option?: StatusOption;
  fallback?: string;
};

export default function StatusBadge({ option, fallback = "—" }: Props) {
  if (!option) {
    return <span className="text-body-sm text-on-surface-variant/60">{fallback}</span>;
  }
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-label-md font-medium ${option.badge}`}
    >
      {option.label}
    </span>
  );
}
