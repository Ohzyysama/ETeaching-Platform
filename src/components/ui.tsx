import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

/* Tropical Paradise shared primitives.
 * Teal #00897b · warm yellow #fffde7 · coral #ff6f61 · mango #ffc107.
 * Rounded-2xl/rounded-full, warm teal/coral shadows, sans-serif throughout. */

export const inputClass =
  "bg-white border-2 border-[#00897b]/20 rounded-2xl px-4 py-2 text-sm text-gray-700 focus:border-[#00897b] focus:outline-none transition-all duration-300 w-full";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function PaperButton({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "rounded-full font-bold shadow-[0_4px_16px_rgba(0,137,123,0.3)] transition-all duration-300 px-5 py-2 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:scale-95";
  const variants = {
    primary: "bg-[#00897b] text-white hover:bg-[#00796b]",
    secondary:
      "bg-white text-[#00897b] border-2 border-[#00897b]/20 hover:bg-[#fffde7]",
  } as const;
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props} />
  );
}

/** teal link with coral hover (the "blue link" name is legacy) */
export function blueLinkClass(): string {
  return "text-[#00897b] hover:text-[#ff6f61] hover:underline underline-offset-2";
}

/** rounded white card with a warm teal shadow */
export function PaperCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,137,123,0.1)] p-5 md:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

/** numbered section heading — "1 作业列表" */
export function SectionTitle({
  number,
  title,
  className = "",
}: {
  number: string;
  title: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`font-bold tracking-tight text-xl md:text-2xl text-[#00897b] ${className}`}
    >
      <span>{number}</span>
      <span className="ml-2">{title}</span>
    </h2>
  );
}

/** link styled as a tropical button (for navigation, not submit) */
export function PaperLink({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: "primary" | "secondary";
  className?: string;
  children: ReactNode;
}) {
  const base =
    "rounded-full font-bold shadow-[0_4px_16px_rgba(0,137,123,0.3)] transition-all duration-300 px-5 py-2 text-sm inline-flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95";
  const variants = {
    primary: "bg-[#00897b] text-white hover:bg-[#00796b]",
    secondary:
      "bg-white text-[#00897b] border-2 border-[#00897b]/20 hover:bg-[#fffde7]",
  } as const;
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}

/** label + control (for simple text inputs — wraps in <label> for a11y) */
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block font-sans">
      <span className="block text-sm font-bold text-[#00897b] mb-1">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="block text-xs md:text-sm text-gray-500 mt-1">{hint}</span>
      ) : null}
    </label>
  );
}

/** section label for composite controls (no <label> wrapper, avoids nesting) */
export function SectionLabel({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="font-sans">
      <span className="block text-sm font-bold text-[#00897b] mb-1">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="block text-xs md:text-sm text-gray-500 mt-1">{hint}</span>
      ) : null}
    </div>
  );
}
