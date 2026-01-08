import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DailyVerseRequest {
  userId: string;
  challenges: string[];
  shuffle?: boolean;
}

// Helper function to get a preview of the next verse
async function getNextVersePreview(supabase: any, challenges: string[], excludeVerseId: number) {
  try {
    let query = supabase
      .from("verse_challenges")
      .select("chapter_number, verse_number, challenges, ai_summary");

    if (challenges && challenges.length > 0) {
      query = query.overlaps("challenges", challenges);
    }

    const { data: matchingVerses } = await query.limit(50);

    if (!matchingVerses || matchingVerses.length === 0) {
      return null;
    }

    // Pick a random verse that's different from today's
    const eligibleVerses = matchingVerses.filter((v: any) => {
      const compositeId = v.chapter_number * 1000 + v.verse_number;
      return compositeId !== excludeVerseId;
    });

    if (eligibleVerses.length === 0) {
      return null;
    }

    const nextVerseChallenge = eligibleVerses[Math.floor(Math.random() * eligibleVerses.length)];

    const { data: verse } = await supabase
      .from("verses")
      .select("verse_id, chapter_number, verse_number, text")
      .eq("chapter_number", nextVerseChallenge.chapter_number)
      .eq("verse_number", nextVerseChallenge.verse_number)
      .single();

    if (!verse) return null;

    const { data: translation } = await supabase
      .from("translations")
      .select("description")
      .eq("verse_id", verse.verse_id)
      .eq("author_name", "Swami Sivananda")
      .single();

    return {
      chapter_number: verse.chapter_number,
      verse_number: verse.verse_number,
      translation: translation?.description || "",
      aiSummary: nextVerseChallenge.ai_summary || "",
    };
  } catch (error) {
    console.error("Error getting next verse preview:", error);
    return null;
  }
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, challenges, shuffle = false }: DailyVerseRequest = await req.json();
    const today = new Date().toISOString().split('T')[0];

    // If not shuffling, check if we already have a verse for today
    if (!shuffle) {
      const { data: existingHistory } = await supabase
        .from("daily_verse_history")
        .select("*")
        .eq("user_id", userId)
        .eq("shown_date", today)
        .single();

      if (existingHistory) {
        // Return the already-selected verse for today
        const { data: verse } = await supabase
          .from("verses")
          .select("*")
          .eq("verse_id", existingHistory.verse_id)
          .single();

        if (verse) {
          const { data: translation } = await supabase
            .from("translations")
            .select("description")
            .eq("verse_id", verse.verse_id)
            .eq("author_name", "Swami Sivananda")
            .single();

          const { data: verseChallenge } = await supabase
            .from("verse_challenges")
            .select("challenges, ai_summary")
            .eq("chapter_number", verse.chapter_number)
            .eq("verse_number", verse.verse_number)
            .single();

          // Get next verse preview (different from today's)
          const nextVersePreview = await getNextVersePreview(supabase, challenges, verse.verse_id);

          return new Response(JSON.stringify({
            verse,
            translation: translation?.description || "",
            challenges: verseChallenge?.challenges || [],
            aiSummary: verseChallenge?.ai_summary || "",
            isFromHistory: true,
            nextVerse: nextVersePreview,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Get user's feedback history to learn preferences
    const { data: feedbackHistory } = await supabase
      .from("verse_feedback")
      .select("verse_id, feedback, challenge_context")
      .eq("user_id", userId);

    // Get recently shown verses to exclude (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: recentHistory } = await supabase
      .from("daily_verse_history")
      .select("verse_id")
      .eq("user_id", userId)
      .gte("shown_date", thirtyDaysAgo.toISOString().split('T')[0]);

    const recentVerseIds = new Set((recentHistory || []).map(h => h.verse_id));
    const dislikedVerseIds = new Set(
      (feedbackHistory || [])
        .filter(f => f.feedback === 'dislike')
        .map(f => f.verse_id)
    );

    // Calculate challenge preference weights based on likes
    const challengeWeights: Record<string, number> = {};
    (feedbackHistory || []).forEach(f => {
      if (f.feedback === 'like' && f.challenge_context) {
        f.challenge_context.forEach((c: string) => {
          challengeWeights[c] = (challengeWeights[c] || 1) + 0.5;
        });
      }
    });

    // Get verses matching user's challenges
    let versesQuery = supabase
      .from("verse_challenges")
      .select("chapter_number, verse_number, challenges, ai_summary");

    if (challenges && challenges.length > 0) {
      // Use overlaps to find verses that match any of the user's challenges
      versesQuery = versesQuery.overlaps("challenges", challenges);
    }

    const { data: matchingVerses, error: versesError } = await versesQuery;

    if (versesError) {
      console.error("Error fetching matching verses:", versesError);
      throw versesError;
    }

    if (!matchingVerses || matchingVerses.length === 0) {
      // Fallback: get any random verse
      const { data: allVerses } = await supabase
        .from("verses")
        .select("*")
        .limit(100);

      if (!allVerses || allVerses.length === 0) {
        throw new Error("No verses found in database");
      }

      const randomVerse = allVerses[Math.floor(Math.random() * allVerses.length)];
      
      const { data: translation } = await supabase
        .from("translations")
        .select("description")
        .eq("verse_id", randomVerse.verse_id)
        .eq("author_name", "Swami Sivananda")
        .single();

      return new Response(JSON.stringify({
        verse: randomVerse,
        translation: translation?.description || "",
        challenges: [],
        aiSummary: "",
        isFromHistory: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter out recently shown and disliked verses
    let eligibleVerses = matchingVerses.filter(v => {
      // We need to get the verse_id from the verses table
      // For now, use chapter_number and verse_number as a composite key
      const compositeId = v.chapter_number * 1000 + v.verse_number;
      return !recentVerseIds.has(compositeId) && !dislikedVerseIds.has(compositeId);
    });

    // If all verses are filtered out, reset and use all matching verses
    if (eligibleVerses.length === 0) {
      eligibleVerses = matchingVerses;
    }

    // Score verses based on challenge preference weights
    const scoredVerses = eligibleVerses.map(v => {
      let score = 1;
      (v.challenges || []).forEach((c: string) => {
        score += challengeWeights[c] || 0;
      });
      // Add randomness factor
      score *= (0.5 + Math.random());
      return { ...v, score };
    });

    // Sort by score and pick the top one (or random from top 5 for variety)
    scoredVerses.sort((a, b) => b.score - a.score);
    const topVerses = scoredVerses.slice(0, Math.min(5, scoredVerses.length));
    const selectedVerseChallenge = topVerses[Math.floor(Math.random() * topVerses.length)];

    // Get the actual verse data
    const { data: verse } = await supabase
      .from("verses")
      .select("*")
      .eq("chapter_number", selectedVerseChallenge.chapter_number)
      .eq("verse_number", selectedVerseChallenge.verse_number)
      .single();

    if (!verse) {
      throw new Error("Could not find verse details");
    }

    // Get translation
    const { data: translation } = await supabase
      .from("translations")
      .select("description")
      .eq("verse_id", verse.verse_id)
      .eq("author_name", "Swami Sivananda")
      .single();

    // Record this verse in history (upsert for today)
    await supabase
      .from("daily_verse_history")
      .upsert({
        user_id: userId,
        verse_id: verse.verse_id,
        chapter_number: verse.chapter_number,
        verse_number: verse.verse_number,
        shown_date: today,
      }, {
        onConflict: "user_id,shown_date",
      });

    // Get next verse preview
    const nextVersePreview = await getNextVersePreview(supabase, challenges, verse.verse_id);

    return new Response(JSON.stringify({
      verse,
      translation: translation?.description || "",
      challenges: selectedVerseChallenge.challenges || [],
      aiSummary: selectedVerseChallenge.ai_summary || "",
      isFromHistory: false,
      nextVerse: nextVersePreview,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in get-daily-verse:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
