"use client";

import { trpc } from "~/trpc/client";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const ACTIONS = [
  "FEATURE_CREATED", "FEATURE_PRD_GENERATED", "FEATURE_TASKS_GENERATED",
  "FEATURE_PLAN_APPROVED", "FEATURE_IN_DEVELOPMENT", "FEATURE_REVIEW_STARTED",
  "FEATURE_FIX_NEEDED", "FEATURE_HUMAN_APPROVAL_REQUESTED", "FEATURE_APPROVED",
  "FEATURE_REJECTED", "FEATURE_SHIPPED", "ORG_MEMBER_INVITED",
  "ORG_MEMBER_REMOVED", "REPO_CONNECTED", "REPO_DISCONNECTED",
  "AI_REVIEW_COMPLETED"
];

export default function AuditLogsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: org } = trpc.organization.getBySlug.useQuery({ slug });

  const [cursor, setCursor] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, isLoading } = trpc.audit.list.useQuery(
    { 
      orgId: org?.id!, 
      limit: 50, 
      cursor,
      action: actionFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    },
    { enabled: !!org }
  );

  const handleNextPage = () => {
    if (data?.nextCursor !== undefined) {
      setCursor(data.nextCursor);
    }
  };

  const handlePrevPage = () => {
    setCursor((prev) => Math.max(0, prev - 50));
  };

  if (!org) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Audit Logs</h3>
        <p className="text-sm text-muted-foreground">
          View a history of actions performed in your organization.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Action</label>
          <select 
            className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCursor(0);
            }}
          >
            <option value="">All Actions</option>
            {ACTIONS.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Start Date</label>
          <input 
            type="date"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCursor(0);
            }}
          />
        </div>

        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">End Date</label>
          <input 
            type="date"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCursor(0);
            }}
          />
        </div>
      </div>

      <div className="border border-border/50 rounded-lg bg-card/40 backdrop-blur-sm overflow-hidden relative min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border/50">
            <tr>
              <th className="px-6 py-3">Action</th>
              <th className="px-6 py-3">Entity Type</th>
              <th className="px-6 py-3">Entity ID</th>
              <th className="px-6 py-3">Actor</th>
              <th className="px-6 py-3 text-right">Date</th>
            </tr>
          </thead>
          <tbody>
            {!data?.items.length && !isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  No audit logs found matching your criteria.
                </td>
              </tr>
            ) : (
              data?.items.map((log: any) => (
                <tr key={log.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                  <td className="px-6 py-4 font-medium">{log.action}</td>
                  <td className="px-6 py-4">{log.targetEntity}</td>
                  <td className="px-6 py-4" title={log.targetEntityId}>
                    {log.entityName && log.entityName !== log.targetEntityId ? (
                      <span className="font-sans text-sm font-medium">{log.entityName}</span>
                    ) : (
                      <span className="font-mono text-xs">{log.targetEntityId?.slice(0, 8)}...</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {log.actor?.user?.name || (log.actorId ? log.actorId.slice(0, 8) + '...' : 'System')}
                  </td>
                  <td className="px-6 py-4 text-right text-muted-foreground">
                    {format(new Date(log.timestamp), "MMM d, HH:mm")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {data?.items.length || 0} entries
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={cursor === 0 || isLoading}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={data?.nextCursor === undefined || isLoading}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
