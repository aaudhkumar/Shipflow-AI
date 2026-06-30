import { MousePointer2, Mail, Ticket, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const icons = {
  IN_APP: MousePointer2,
  EMAIL: Mail,
  TICKET: Ticket,
  CALL: Phone,
};

const labels = {
  IN_APP: "In-App",
  EMAIL: "Email",
  TICKET: "Support Ticket",
  CALL: "Customer Call",
};

export function SourceChannelBadge({ channel }: { channel: "IN_APP" | "EMAIL" | "TICKET" | "CALL" }) {
  const Icon = icons[channel] || MousePointer2;
  return (
    <Badge variant="outline" className="flex items-center gap-1 w-fit bg-background">
      <Icon className="h-3 w-3" />
      {labels[channel] || labels.IN_APP}
    </Badge>
  );
}
