"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BillingSuccessModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setOpen(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    setOpen(false);
    // Remove the query param
    const params = new URLSearchParams(searchParams);
    params.delete("payment");
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-emerald-500" />
          </div>
          <DialogTitle className="text-2xl font-bold">Payment Successful!</DialogTitle>
          <DialogDescription className="text-base mt-2">
            Your subscription has been updated. You now have access to all Pro features!
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex justify-center">
          <Button onClick={handleClose} size="lg">
            Continue to Dashboard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
