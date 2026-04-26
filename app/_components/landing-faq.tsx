"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "Do you offer emergency dental appointments?",
    a: "Yes. We reserve slots for same-day emergencies. Call us or use the portal to request an urgent visit.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept cash, card, and most insurance plans. Payment is due at the time of service unless prior arrangements are made.",
  },
  {
    q: "How often should I have a check-up?",
    a: "We recommend a check-up and cleaning every six months to maintain oral health and catch issues early.",
  },
  {
    q: "Do you treat children?",
    a: "Yes. We offer family dentistry and welcome patients of all ages, with a gentle approach for younger patients.",
  },
  {
    q: "What should I bring to my first appointment?",
    a: "Please bring your ID, insurance card if applicable, and any recent X-rays or records from another practice.",
  },
  {
    q: "How can I book an appointment?",
    a: "You can call us, use the contact form on this page, or sign in to the patient portal to book online.",
  },
];

export function LandingFaq() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {FAQ_ITEMS.map((item, i) => (
        <Collapsible key={i} defaultOpen={i === 0}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180">
            {item.q}
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <p className="border-x border-b rounded-b-lg border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              {item.a}
            </p>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
