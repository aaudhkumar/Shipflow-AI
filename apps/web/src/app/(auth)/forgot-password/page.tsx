"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgetPassword } from "@/lib/auth-client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await forgetPassword({
        email,
        redirectTo: "/reset-password",
      });

      if (error) {
        toast.error(error.message || "Failed to request password reset");
      } else {
        toast.success("Password reset link sent!");
        setIsSubmitted(true);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col space-y-6 text-center">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
          <p className="text-sm text-zinc-500">
            We sent a password reset link to <span className="font-medium text-zinc-900 dark:text-zinc-50">{email}</span>.
          </p>
        </div>
        <div className="flex justify-center">
          <Link href="/login" className="text-sm flex items-center justify-center hover:underline opacity-70 hover:opacity-100">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
        <p className="text-sm text-zinc-500">
          Enter your email address and we will send you a link to reset your password.
        </p>
      </div>
      
      <div className="grid gap-6">
        <form onSubmit={handleReset}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="name@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button disabled={isLoading} type="submit" className="w-full">
              {isLoading ? "Sending link..." : "Send reset link"}
            </Button>
          </div>
        </form>
      </div>
      
      <p className="px-8 text-center text-sm text-zinc-500">
        Remember your password?{" "}
        <Link
          href="/login"
          className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
