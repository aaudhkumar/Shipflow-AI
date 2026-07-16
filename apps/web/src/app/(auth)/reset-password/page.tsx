"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/auth-client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!token) {
      toast.error("Missing reset token");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await resetPassword({
        newPassword: password,
        token,
      });

      if (error) {
        toast.error(error.message || "Failed to reset password");
      } else {
        toast.success("Password reset successfully");
        router.push("/login");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col space-y-6 text-center">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Invalid Link</h1>
          <p className="text-sm text-zinc-500">
            This password reset link is invalid or has expired.
          </p>
        </div>
        <div className="flex justify-center">
          <Link href="/forgot-password" className="text-sm flex items-center justify-center hover:underline opacity-70 hover:opacity-100">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Set new password</h1>
        <p className="text-sm text-zinc-500">
          Enter a new password for your account.
        </p>
      </div>
      
      <div className="grid gap-6">
        <form onSubmit={handleReset}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                disabled={isLoading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button disabled={isLoading} type="submit" className="w-full">
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-zinc-900 dark:border-zinc-50"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
