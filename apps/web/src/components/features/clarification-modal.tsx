"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { trpc } from "~/trpc/client";
import { Sparkles, CheckCircle2 } from "lucide-react";

interface Question {
  id: string;
  question: string;
  recommendation: string;
}

interface ClarificationModalProps {
  featureId: string;
  orgId: string;
  isOpen: boolean;
  messages: any[];
  onComplete: () => void;
}

export function ClarificationModal({ featureId, orgId, isOpen, messages, onComplete }: ClarificationModalProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, { accepted: boolean; feedback: string }>>({});
  
  const submitAnswers = trpc.feature.submitClarificationAnswers.useMutation({
    onSuccess: () => {
      onComplete();
    }
  });

  useEffect(() => {
    if (isOpen && messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === "AI_QUESTIONS" && lastMessage.content) {
        try {
          const parsed = JSON.parse(lastMessage.content);
          if (parsed.questions && Array.isArray(parsed.questions)) {
            setQuestions(parsed.questions);
            
            // Initialize answers with defaults (accepted)
            const initialAnswers: Record<string, { accepted: boolean; feedback: string }> = {};
            parsed.questions.forEach((q: Question) => {
              initialAnswers[q.id] = { accepted: true, feedback: "" };
            });
            setAnswers(initialAnswers);
          }
        } catch (e) {
          console.error("Failed to parse AI questions", e);
        }
      } else {
        setQuestions([]);
      }
    }
  }, [isOpen, messages]);

  const handleSubmit = () => {
    const payload = questions.map(q => ({
      question: q.question,
      recommendation: q.recommendation,
      accepted: answers[q.id]?.accepted ?? true,
      feedback: answers[q.id]?.feedback ?? "",
    }));

    submitAnswers.mutate({
      featureId,
      orgId,
      answers: payload
    });
  };

  if (questions.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[700px] bg-background/95 backdrop-blur-xl border-border/50 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Clarification Needed
          </DialogTitle>
          <DialogDescription>
            The AI has a few questions to ensure your feature request is fully understood.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 my-6">
          {questions.map((q, index) => (
            <div key={q.id} className="p-4 rounded-xl border border-border/50 bg-card/40 space-y-4">
              <div>
                <h4 className="font-semibold text-foreground">
                  <span className="text-indigo-500 mr-2">Q{index + 1}.</span>
                  {q.question}
                </h4>
                <div className="mt-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border/30">
                  <span className="font-medium text-foreground">Recommendation:</span> {q.recommendation}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <RadioGroup 
                  value={answers[q.id]?.accepted ? "yes" : "no"} 
                  onValueChange={(val) => setAnswers(prev => ({ ...prev, [q.id]: { accepted: val === "yes", feedback: prev[q.id]?.feedback || "" } }))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id={`yes-${q.id}`} />
                    <Label htmlFor={`yes-${q.id}`} className="font-normal cursor-pointer text-sm">Yes, proceed with recommendation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id={`no-${q.id}`} />
                    <Label htmlFor={`no-${q.id}`} className="font-normal cursor-pointer text-sm">No, I have custom feedback</Label>
                  </div>
                </RadioGroup>

                {!answers[q.id]?.accepted && (
                  <div className="animate-in fade-in slide-in-from-top-2 pt-2">
                    <Textarea 
                      placeholder="Type your feedback or specific requirements here..."
                      value={answers[q.id]?.feedback || ""}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: { accepted: prev[q.id]?.accepted ?? false, feedback: e.target.value } }))}
                      className="resize-none"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <Button 
            onClick={handleSubmit} 
            disabled={submitAnswers.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
          >
            {submitAnswers.isPending ? "Submitting..." : "Submit Answers"}
            {!submitAnswers.isPending && <CheckCircle2 className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
