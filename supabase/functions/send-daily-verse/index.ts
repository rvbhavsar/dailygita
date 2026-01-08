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

    // Get users with daily verse enabled
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, daily_verse_enabled')
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
    const userIds = profiles.map(p => p.user_id);
    const { data: authData } = await supabase.auth.admin.listUsers();
    
    const usersWithEmail = profiles.map(profile => {
      const authUser = authData?.users?.find(u => u.id === profile.user_id);
      return {
        ...profile,
        email: authUser?.email,
      };
    }).filter(u => u.email);

    // Get a random verse
    const { data: verses, error: versesError } = await supabase
      .from('verses')
      .select('*, chapters(name, name_translated)')
      .limit(1)
      .order('verse_id', { ascending: true })
      .range(Math.floor(Math.random() * 700), Math.floor(Math.random() * 700));

    if (versesError || !verses || verses.length === 0) {
      // Fallback to first verse
      const { data: fallbackVerse } = await supabase
        .from('verses')
        .select('*')
        .limit(1)
        .single();
      
      if (!fallbackVerse) {
        throw new Error('No verses found in database');
      }
      verses?.push(fallbackVerse);
    }

    const verse = verses?.[0];

    // Get English translation
    const { data: translation } = await supabase
      .from('translations')
      .select('description, author_name')
      .eq('verse_id', verse.verse_id)
      .eq('language', 'english')
      .limit(1)
      .maybeSingle();

    const translationText = translation?.description || 'Translation not available';
    const authorName = translation?.author_name || '';

    // Send emails
    let sentCount = 0;
    const errors: string[] = [];

    for (const user of usersWithEmail) {
      try {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Georgia, serif; background: #f5f0e8; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 24px; }
              .header h1 { color: #c2410c; font-size: 24px; margin: 0; }
              .verse-ref { color: #c2410c; font-size: 14px; font-weight: 500; margin-bottom: 16px; }
              .sanskrit { font-size: 18px; line-height: 1.8; color: #1f2937; text-align: center; margin-bottom: 20px; }
              .transliteration { font-style: italic; color: #6b7280; text-align: center; margin-bottom: 20px; font-size: 14px; }
              .translation { font-size: 16px; line-height: 1.7; color: #374151; border-top: 1px solid #e5e7eb; padding-top: 20px; }
              .author { font-size: 12px; color: #9ca3af; margin-top: 12px; text-align: right; }
              .footer { text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
              .footer p { font-size: 12px; color: #9ca3af; margin: 4px 0; }
              .cta { display: inline-block; background: #c2410c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🙏 Daily Verse from the Gita</h1>
              </div>
              <p style="text-align: center; color: #6b7280;">Namaste${user.display_name ? `, ${user.display_name}` : ''}! Here's your verse for today:</p>
              <div class="verse-ref">Chapter ${verse.chapter_number}, Verse ${verse.verse_number}</div>
              <div class="sanskrit">${verse.text.replace(/\n/g, '<br>')}</div>
              ${verse.transliteration ? `<div class="transliteration">${verse.transliteration}</div>` : ''}
              <div class="translation">
                ${translationText}
                ${authorName ? `<div class="author">— ${authorName}</div>` : ''}
              </div>
              <div class="footer">
                <a href="${Deno.env.get('SITE_URL') || 'https://dailygita.app'}/verse/${verse.chapter_number}-${verse.verse_number}" class="cta">Read More</a>
                <p>May this wisdom guide your day.</p>
                <p style="font-size: 11px;">To unsubscribe, update your preferences in the app settings.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await resend.emails.send({
          from: 'DailyGita <onboarding@resend.dev>',
          to: [user.email!],
          subject: `🙏 Gita ${verse.chapter_number}.${verse.verse_number}: Your Daily Verse`,
          html: emailHtml,
        });

        sentCount++;
        console.log(`Sent email to ${user.email}`);
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
