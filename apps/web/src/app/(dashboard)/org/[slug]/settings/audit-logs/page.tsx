"use client";

import { trpc } from "~/trpc/client";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export default function AuditLogsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: org } = trpc.organization.getBySlug.useQuery({ slug });

  const { data, isLoading } = trpc.audit.list.useQuery(
    { orgId: org?.id!, limit: 50, cursor: 0 },
    { enabled: !!org }
  );

  if (isLoading) {
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

      <div className="border border-border/50 rounded-lg bg-card/40 backdrop-blur-sm overflow-hidden">
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
            {!data?.items.length ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-muted-foreground">
                  No audit logs found.
                </td>
              </tr>
            ) : (
              data.items.map((log: any) => (
                <tr key={log.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                  <td className="px-6 py-4 font-medium">{log.action}</td>
                  <td className="px-6 py-4">{log.targetEntity}</td>
                  <td className="px-6 py-4 font-mono text-xs">{log.targetEntityId?.slice(0, 8)}...</td>
                  <td className="px-6 py-4">{log.actorId ? log.actorId.slice(0, 8) + '...' : 'System'}</td>
                  <td className="px-6 py-4 text-right text-muted-foreground">
                    {format(new Date(log.timestamp), "MMM d, HH:mm")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
