"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

interface CheckoutButtonProps extends React.ComponentProps<typeof Button> {
  loadingText?: string;
  children: React.ReactNode;
}

export function CheckoutButton({ children, loadingText = "Redirecting...", ...props }: CheckoutButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending ? loadingText : children}
    </Button>
  );
}
