"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function PaymentRequiredModal() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  
  useEffect(() => {
    const handlePaymentRequired = () => {
      setOpen(true);
    };

    window.addEventListener("payment_required", handlePaymentRequired);
    return () => window.removeEventListener("payment_required", handlePaymentRequired);
  }, []);

  // Try to extract org slug from URL like /org/[slug]/...
  const match = pathname?.match(/^\/org\/([^/]+)/);
  const orgSlug = match ? match[1] : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Limit Reached</DialogTitle>
          <DialogDescription>
            You have exhausted your AI review credits. Please upgrade your plan to continue using this feature.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          {orgSlug ? (
            <Link href={`/org/${orgSlug}/settings/billing`}>
              <Button onClick={() => setOpen(false)}>Upgrade Plan</Button>
            </Link>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
