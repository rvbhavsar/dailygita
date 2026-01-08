import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CHALLENGES = [
  { id: 'stress-anxiety', label: 'Stress & Anxiety', description: 'Finding peace, calm, managing overwhelm' },
  { id: 'decision-making', label: 'Decision Making', description: 'Making choices, handling confusion, clarity' },
  { id: 'discipline-consistency', label: 'Discipline & Consistency', description: 'Building habits, staying committed, self-control' },
  { id: 'focus-distraction', label: 'Focus & Distraction', description: 'Concentration, avoiding distractions, mental clarity' },
  { id: 'purpose-motivation', label: 'Purpose & Motivation', description: 'Finding meaning, staying motivated, life direction' },
  { id: 'relationships', label: 'Relationships', description: 'Family, friends, conflict, love, connection' },
  { id: 'leadership', label: 'Leadership', description: 'Leading others, influence, responsibility, management' },
  { id: 'fear-doubt', label: 'Fear & Doubt', description: 'Overcoming fear, self-doubt, courage, confidence' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get request body for optional filtering
    const body = await req.json().catch(() => ({}));
    const { startChapter = 1, endChapter = 18, batchSize = 5 } = body;

    console.log(`Starting AI analysis for chapters ${startChapter}-${endChapter}`);

    // Fetch all verses
    const { data: verses, error: versesError } = await supabase
      .from('verses')
      .select('verse_id, chapter_number, verse_number, text')
      .gte('chapter_number', startChapter)
      .lte('chapter_number', endChapter)
      .order('chapter_number')
      .order('verse_number');

    if (versesError) throw versesError;
    console.log(`Found ${verses?.length || 0} verses`);

    // Fetch all translations
    const { data: translations, error: transError } = await supabase
      .from('translations')
      .select('verse_id, description, author_name');

    if (transError) throw transError;

    // Create translation map (prefer Sivananda)
    const translationMap = new Map<number, string>();
    const groupedTrans = new Map<number, any[]>();
    
    translations?.forEach(t => {
      if (!groupedTrans.has(t.verse_id)) {
        groupedTrans.set(t.verse_id, []);
      }
      groupedTrans.get(t.verse_id)!.push(t);
    });

    groupedTrans.forEach((trans, verseId) => {
      const sivananda = trans.find(t => t.author_name.includes('Sivananda'));
      translationMap.set(verseId, sivananda?.description || trans[0]?.description || '');
    });

    // Check which verses already have challenge tags
    const { data: existingTags } = await supabase
      .from('verse_challenges')
      .select('chapter_number, verse_number');

    const existingSet = new Set(
      existingTags?.map(a => `${a.chapter_number}-${a.verse_number}`) || []
    );

    // Filter out verses that already have tags
    const versesToProcess = verses?.filter(v => 
      !existingSet.has(`${v.chapter_number}-${v.verse_number}`)
    ) || [];

    console.log(`${versesToProcess.length} verses need AI analysis`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    const challengesList = CHALLENGES.map(c => `- ${c.id}: ${c.label} (${c.description})`).join('\n');

    // Process in batches
    for (let i = 0; i < versesToProcess.length; i += batchSize) {
      const batch = versesToProcess.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (verse) => {
        const verseKey = `${verse.chapter_number}-${verse.verse_number}`;
        const translation = translationMap.get(verse.verse_id) || '';

        try {
          console.log(`Analyzing verse ${verseKey}...`);

          const prompt = `Analyze this verse from the Bhagavad Gita and determine which life challenges it addresses.

VERSE (Chapter ${verse.chapter_number}, Verse ${verse.verse_number}):
Sanskrit: ${verse.text}
Translation: ${translation}

AVAILABLE CHALLENGES:
${challengesList}

Instructions:
1. Select 1-3 challenges that this verse DIRECTLY addresses
2. Only select challenges that are clearly relevant to the verse's teaching
3. Provide a brief 1-2 sentence summary of the verse's main teaching

Respond in this exact JSON format:
{
  "challenges": ["challenge-id-1", "challenge-id-2"],
  "summary": "Brief summary of the verse's teaching"
}`;

          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { 
                  role: 'system', 
                  content: 'You are an expert in the Bhagavad Gita and its practical applications to modern life challenges. Respond only with valid JSON.' 
                },
                { role: 'user', content: prompt }
              ],
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI API error: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || '';
          
          // Parse JSON from response (handle markdown code blocks)
          let parsed;
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              parsed = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('No JSON found in response');
            }
          } catch (parseError) {
            console.error(`Failed to parse AI response for ${verseKey}:`, content);
            throw new Error('Failed to parse AI response');
          }

          // Validate challenges
          const validChallenges = (parsed.challenges || []).filter(
            (c: string) => CHALLENGES.some(ch => ch.id === c)
          );

          // Store in database
          const { error: insertError } = await supabase
            .from('verse_challenges')
            .upsert({
              chapter_number: verse.chapter_number,
              verse_number: verse.verse_number,
              challenges: validChallenges,
              ai_summary: parsed.summary || null,
            }, {
              onConflict: 'chapter_number,verse_number'
            });

          if (insertError) throw insertError;

          successCount++;
          console.log(`✓ Analyzed ${verseKey}: ${validChallenges.join(', ')}`);

        } catch (error) {
          errorCount++;
          const errMsg = `Failed ${verseKey}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errMsg);
          console.error(errMsg);
        }
      }));

      // Add delay between batches to respect rate limits
      if (i + batchSize < versesToProcess.length) {
        console.log(`Waiting 1s before next batch...`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: versesToProcess.length,
        successCount,
        errorCount,
        errors: errors.slice(0, 10),
        message: `Analyzed ${successCount} verses, ${errorCount} errors`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in analyze-verses-challenges:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
