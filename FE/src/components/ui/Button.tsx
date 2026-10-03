import { cn } from "@/shared/utils";

type ButtonVariant = "primary" | "secondary" | "warning";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants[variant], className)} {...props}>
      {children}
    </button>
  );
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: [
    "w-full h-[40px]",
    "bg-main-blue",
    "rounded-lg",
    "font-ssurround text-md text-main-white font-bold",
    "transition-opacity active:opacity-80",
  ].join(" "),

  secondary: [
    "w-full h-[40px]",
    "bg-main-white border-[1.5px] border-main-blue",
    "rounded-lg",
    "font-ssurround text-md text-main-blue font-bold",
    "transition-opacity active:opacity-80",
  ].join(" "),

  warning: [
    "w-full h-[40px]",
    "bg-sub-coral",
    "rounded-lg",
    "font-ssurround text-md text-main-white font-bold",
    "transition-opacity active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:opacity-40",
  ].join(" "),
};
