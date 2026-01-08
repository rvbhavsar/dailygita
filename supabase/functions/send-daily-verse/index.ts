import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get users with daily verse enabled along with their challenges
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, daily_verse_enabled, selected_challenges')
      .eq('daily_verse_enabled', true);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      console.log('No users with daily verse enabled');
      return new Response(
        JSON.stringify({ success: true, message: 'No users to send to', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user emails from auth.users
    const { data: authData } = await supabase.auth.admin.listUsers();
    
    const usersWithEmail = profiles.map(profile => {
      const authUser = authData?.users?.find(u => u.id === profile.user_id);
      return {
        ...profile,
        email: authUser?.email,
      };
    }).filter(u => u.email);

    const today = new Date().toISOString().split('T')[0];
    const challengeLabels: Record<string, string> = {
      stress: "😰 Stress & Anxiety",
      focus: "🎯 Focus & Discipline",
      purpose: "🧭 Life Purpose",
      relationships: "💑 Relationships",
      grief: "💔 Grief & Loss",
      anger: "😤 Anger Management",
      self_doubt: "🌱 Self Doubt",
      detachment: "🧘 Letting Go",
    };

    let sentCount = 0;
    const errors: string[] = [];

    for (const user of usersWithEmail) {
      try {
        const challenges = user.selected_challenges || [];

        // Get user's feedback history for smart selection
        const { data: feedbackHistory } = await supabase
          .from("verse_feedback")
          .select("verse_id, feedback, challenge_context")
          .eq("user_id", user.user_id);

        // Get recently shown verses (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: recentHistory } = await supabase
          .from("daily_verse_history")
          .select("verse_id")
          .eq("user_id", user.user_id)
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
        let matchingVerses: any[] = [];
        
        if (challenges.length > 0) {
          const { data } = await supabase
            .from("verse_challenges")
            .select("chapter_number, verse_number, challenges, ai_summary")
            .overlaps("challenges", challenges);
          matchingVerses = data || [];
        } else {
          // No challenges selected, get random verses
          const { data } = await supabase
            .from("verse_challenges")
            .select("chapter_number, verse_number, challenges, ai_summary")
            .limit(100);
          matchingVerses = data || [];
        }

        let selectedVerse: any = null;
        let selectedVerseChallenge: any = null;

        if (matchingVerses.length > 0) {
          // Filter out recently shown and disliked verses
          let eligibleVerses = matchingVerses.filter(v => {
            const compositeId = v.chapter_number * 1000 + v.verse_number;
            return !recentVerseIds.has(compositeId) && !dislikedVerseIds.has(compositeId);
          });

          if (eligibleVerses.length === 0) {
            eligibleVerses = matchingVerses;
          }

          // Score verses based on challenge preference weights
          const scoredVerses = eligibleVerses.map(v => {
            let score = 1;
            (v.challenges || []).forEach((c: string) => {
              score += challengeWeights[c] || 0;
            });
            score *= (0.5 + Math.random());
            return { ...v, score };
          });

          scoredVerses.sort((a, b) => b.score - a.score);
          const topVerses = scoredVerses.slice(0, Math.min(5, scoredVerses.length));
          selectedVerseChallenge = topVerses[Math.floor(Math.random() * topVerses.length)];

          const { data: verse } = await supabase
            .from("verses")
            .select("*")
            .eq("chapter_number", selectedVerseChallenge.chapter_number)
            .eq("verse_number", selectedVerseChallenge.verse_number)
            .single();

          selectedVerse = verse;
        } else {
          // Fallback: random verse
          const { data: randomVerse } = await supabase
            .from("verses")
            .select("*")
            .limit(1)
            .order("id", { ascending: false })
            .single();

          selectedVerse = randomVerse;
        }

        if (!selectedVerse) {
          console.log(`No verse found for user ${user.user_id}`);
          continue;
        }

        // Get translation
        const { data: translation } = await supabase
          .from("translations")
          .select("description, author_name")
          .eq("verse_id", selectedVerse.verse_id)
          .eq("author_name", "Swami Sivananda")
          .single();

        const translationText = translation?.description || 'Translation not available';
        const authorName = translation?.author_name || '';

        // Record in history
        await supabase
          .from("daily_verse_history")
          .upsert({
            user_id: user.user_id,
            verse_id: selectedVerse.verse_id,
            chapter_number: selectedVerse.chapter_number,
            verse_number: selectedVerse.verse_number,
            shown_date: today,
          }, {
            onConflict: "user_id,shown_date",
          });

        // Build challenge badges HTML
        let challengeBadgesHtml = "";
        if (selectedVerseChallenge?.challenges && selectedVerseChallenge.challenges.length > 0) {
          challengeBadgesHtml = `
            <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px;">
              <p style="color: #666; font-size: 12px; margin: 0 0 8px;">This verse was chosen for you because you're working on:</p>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${selectedVerseChallenge.challenges.slice(0, 3).map((c: string) => 
                  `<span style="background: #fff7ed; color: #c2410c; padding: 4px 12px; border-radius: 16px; font-size: 12px;">${challengeLabels[c] || c}</span>`
                ).join('')}
              </div>
            </div>
          `;
        }

        // Build AI summary HTML
        let aiSummaryHtml = "";
        if (selectedVerseChallenge?.ai_summary) {
          aiSummaryHtml = `
            <div style="margin-top: 20px; padding: 16px; background: #fffbeb; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6; font-style: italic;">
                💡 ${selectedVerseChallenge.ai_summary}
              </p>
            </div>
          `;
        }

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f0e8; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 24px; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { padding: 24px; }
              .verse-ref { color: #c2410c; font-size: 14px; font-weight: 600; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
              .sanskrit { font-size: 16px; line-height: 1.8; color: #374151; text-align: center; margin-bottom: 20px; padding: 16px; background: #f9fafb; border-radius: 8px; }
              .translation { font-size: 16px; line-height: 1.7; color: #1f2937; border-left: 4px solid #f97316; padding-left: 16px; margin: 20px 0; }
              .author { font-size: 12px; color: #9ca3af; margin-top: 8px; }
              .footer { text-align: center; padding: 20px; border-top: 1px solid #e5e7eb; background: #fafafa; }
              .footer p { font-size: 12px; color: #9ca3af; margin: 4px 0; }
              .feedback-note { margin-top: 16px; padding: 12px; background: #f3f4f6; border-radius: 8px; text-align: center; }
              .feedback-note p { font-size: 12px; color: #6b7280; margin: 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🙏 Your Daily Gita Wisdom</h1>
                <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Chapter ${selectedVerse.chapter_number} • Verse ${selectedVerse.verse_number}</p>
              </div>
              
              <div class="content">
                <p style="color: #6b7280; margin-bottom: 20px;">
                  Good morning${user.display_name ? `, ${user.display_name.split(' ')[0]}` : ''}! Here's your personalized verse for today:
                </p>
                
                <div class="sanskrit">${selectedVerse.text.replace(/\n/g, '<br>')}</div>
                
                <div class="translation">
                  "${translationText}"
                  ${authorName ? `<div class="author">— ${authorName}</div>` : ''}
                </div>

                ${aiSummaryHtml}
                ${challengeBadgesHtml}
                
                <div class="feedback-note">
                  <p>📝 Open the app to give feedback on this verse and improve your future recommendations!</p>
                </div>
              </div>
              
              <div class="footer">
                <p>May this wisdom guide your day.</p>
                <p style="font-size: 11px; margin-top: 12px;">To unsubscribe, update your preferences in the app settings.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await resend.emails.send({
          from: 'DailyGita <onboarding@resend.dev>',
          to: [user.email!],
          subject: `🙏 Gita ${selectedVerse.chapter_number}.${selectedVerse.verse_number}: Your Personalized Daily Verse`,
          html: emailHtml,
        });

        sentCount++;
        console.log(`Sent personalized email to ${user.email}`);
      } catch (emailError: unknown) {
        const errorMessage = emailError instanceof Error ? emailError.message : 'Unknown error';
        console.error(`Failed to send to ${user.email}:`, errorMessage);
        errors.push(`${user.email}: ${errorMessage}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Daily verse emails sent`,
        sent: sentCount,
        total: usersWithEmail.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending daily verse:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
