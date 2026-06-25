"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { trpc } from "~/trpc/client";
import { ReviewSummaryCard } from "@/components/reviews/review-summary-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ReviewHistoryPage() {
  const params = useParams();
  const orgSlug = params.slug as string;
  
  // Need to get orgId first since trpc routes expect orgId
  const { data: org } = trpc.organization.getBySlug.useQuery({ slug: orgSlug });
  
  const [filter, setFilter] = useState<"ALL" | "BLOCKING" | "CLEAN">("ALL");
  
  const { data: reviews, isLoading } = trpc.pullRequest.listReviews.useQuery(
    { orgId: org?.id as string, filter },
    { enabled: !!org?.id }
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Review History</h1>
        <p className="text-muted-foreground mt-2">
          A complete history of all AI code reviews across your repositories.
        </p>
      </div>

      <Tabs defaultValue="ALL" value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="ALL">All Reviews</TabsTrigger>
          <TabsTrigger value="BLOCKING">Blocking Issues</TabsTrigger>
          <TabsTrigger value="CLEAN">Clean Reviews</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !reviews || reviews.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Inbox className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No reviews found</h3>
              <p className="text-muted-foreground max-w-sm">
                {filter === "ALL" 
                  ? "Connect a repository and open a pull request to see AI review history here."
                  : `No reviews match the "${filter}" filter.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewSummaryCard 
                key={review.id} 
                review={review as any} 
                orgSlug={orgSlug} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
