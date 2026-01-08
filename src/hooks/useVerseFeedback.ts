import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type FeedbackType = "like" | "dislike";

interface FeedbackState {
  [verseId: number]: FeedbackType | null;
}

export const useVerseFeedback = () => {
  const { user, profile } = useAuth();
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = useCallback(async (
    verseId: number,
    chapterNumber: number,
    verseNumber: number,
    feedback: FeedbackType
  ) => {
    if (!user) {
      toast.error("Please sign in to save your feedback");
      return false;
    }

    setIsSubmitting(true);

    try {
      const challengeContext = profile?.selected_challenges || [];

      // Check if feedback already exists
      const { data: existing } = await supabase
        .from("verse_feedback")
        .select("id, feedback")
        .eq("user_id", user.id)
        .eq("verse_id", verseId)
        .single();

      if (existing) {
        if (existing.feedback === feedback) {
          // Same feedback - remove it (toggle off)
          await supabase
            .from("verse_feedback")
            .delete()
            .eq("id", existing.id);
          
          setFeedbackState(prev => ({ ...prev, [verseId]: null }));
          toast.success("Feedback removed");
        } else {
          // Different feedback - update it
          await supabase
            .from("verse_feedback")
            .update({ 
              feedback,
              challenge_context: challengeContext,
            })
            .eq("id", existing.id);
          
          setFeedbackState(prev => ({ ...prev, [verseId]: feedback }));
          toast.success(feedback === "like" ? "Marked as helpful! 👍" : "Thanks for the feedback");
        }
      } else {
        // No existing feedback - insert new
        const { error } = await supabase
          .from("verse_feedback")
          .insert({
            user_id: user.id,
            verse_id: verseId,
            chapter_number: chapterNumber,
            verse_number: verseNumber,
            feedback,
            challenge_context: challengeContext,
          });

        if (error) throw error;

        setFeedbackState(prev => ({ ...prev, [verseId]: feedback }));
        toast.success(feedback === "like" ? "Marked as helpful! 👍" : "Thanks for the feedback");
      }

      // Update daily_verse_history with was_liked
      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from("daily_verse_history")
        .update({ was_liked: feedback === "like" })
        .eq("user_id", user.id)
        .eq("shown_date", today);

      return true;
    } catch (err) {
      console.error("Error submitting feedback:", err);
      toast.error("Failed to save feedback");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, profile?.selected_challenges]);

  const getFeedback = useCallback((verseId: number): FeedbackType | null => {
    return feedbackState[verseId] || null;
  }, [feedbackState]);

  // Load existing feedback for a verse
  const loadFeedback = useCallback(async (verseId: number) => {
    if (!user) return;

    const { data } = await supabase
      .from("verse_feedback")
      .select("feedback")
      .eq("user_id", user.id)
      .eq("verse_id", verseId)
      .single();

    if (data) {
      setFeedbackState(prev => ({ ...prev, [verseId]: data.feedback as FeedbackType }));
    }
  }, [user]);

  return {
    submitFeedback,
    getFeedback,
    loadFeedback,
    isSubmitting,
  };
};
