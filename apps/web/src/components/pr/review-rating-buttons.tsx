"use client";

import { Button } from "@/components/ui/button";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReviewRatingButtons({
  orgId,
  reviewId,
}: {
  orgId: string;
  reviewId: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState<boolean | null>(null);

  const rateMutation = trpc.pullRequest.rateReview.useMutation({
    onSuccess: (data, variables) => {
      setRating(variables.isCorrect);
      toast.success(
        variables.isCorrect
          ? "Marked as Recommended Merge"
          : "Marked as Not Recommended"
      );
      router.refresh();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to rate review");
    },
  });

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={() => rateMutation.mutate({ orgId, reviewId, isCorrect: true })}
        disabled={rateMutation.isPending || rating === true}
        className="text-xs h-8 bg-white text-black hover:bg-zinc-200 border-0"
      >
        {rating === true ? "✓ Marked Correct" : "Review is correct"}
      </Button>
      <Button
        size="sm"
        onClick={() => rateMutation.mutate({ orgId, reviewId, isCorrect: false })}
        disabled={rateMutation.isPending || rating === false}
        className="text-xs h-8 bg-white text-black hover:bg-zinc-200 border-0"
      >
        {rating === false ? "✓ Marked Incorrect" : "Review is not correct"}
      </Button>
    </div>
  );
}
