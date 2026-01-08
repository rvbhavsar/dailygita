import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Verse {
  verse_id: number;
  chapter_number: number;
  verse_number: number;
  text: string;
}

interface Translation {
  verse_id: number;
  description: string;
  author_name: string;
}

// Curated insights for verses (matching curatedVersesMap from frontend)
const curatedInsights: Record<string, { explanation: string; takeaway: string }> = {
  "2-47": {
    explanation: "Focus only on performing your duties with full dedication. The results are not in your control—they depend on countless factors beyond you.",
    takeaway: "Work hard, stay detached from outcomes, and find peace in the effort itself."
  },
  "2-14": {
    explanation: "Pleasure and pain are temporary, like seasons. They come and go. A wise person remains steady through both.",
    takeaway: "Don't let temporary feelings shake your core stability."
  },
  "3-21": {
    explanation: "Leaders shape culture through their behavior, not their words. People watch what you do, not what you say. Your actions set the standard for those around you.",
    takeaway: "Be the change you wish to see. Your example speaks louder than any instruction."
  },
  "6-5": {
    explanation: "You have the power to lift yourself up or bring yourself down. Your mind can be your greatest ally or your worst enemy—the choice is yours.",
    takeaway: "Take responsibility for your growth. No one else can do it for you."
  },
  "2-62": {
    explanation: "Constantly thinking about sense objects creates attachment. Attachment leads to desire, and unfulfilled desire leads to anger.",
    takeaway: "Watch what you feed your mind—thoughts shape your emotional reality."
  },
  "2-63": {
    explanation: "Anger clouds judgment, which leads to confusion. When confused, you lose your reasoning ability, and when reasoning fails, you fall from your path.",
    takeaway: "Break the chain early. Don't let anger hijack your wisdom."
  },
  "3-35": {
    explanation: "It's better to follow your own path imperfectly than to follow someone else's path perfectly. Your unique journey is meant for you.",
    takeaway: "Authenticity over perfection. Your dharma is uniquely yours."
  },
  "6-35": {
    explanation: "The mind is restless and hard to control, but with persistent practice and detachment, it can be mastered over time.",
    takeaway: "Consistency and patience are your tools for mental mastery."
  },
  "2-48": {
    explanation: "Perform your duties while staying balanced in success and failure. This equanimity is the essence of yoga.",
    takeaway: "True strength is remaining steady regardless of outcomes."
  },
  "18-66": {
    explanation: "Let go of all other practices and simply surrender to the divine. You will be freed from all negative karma—do not worry.",
    takeaway: "Complete surrender brings complete freedom from fear and guilt."
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!ELEVENLABS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get request body for optional filtering
    const body = await req.json().catch(() => ({}));
    const { startChapter = 1, endChapter = 18, batchSize = 5 } = body;

    console.log(`Starting audio generation for chapters ${startChapter}-${endChapter}`);

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
    const groupedTrans = new Map<number, Translation[]>();
    
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

    // Check which verses already have audio
    const { data: existingAudio } = await supabase
      .from('verse_audio')
      .select('chapter_number, verse_number');

    const existingSet = new Set(
      existingAudio?.map(a => `${a.chapter_number}-${a.verse_number}`) || []
    );

    // Filter out verses that already have audio
    const versesToProcess = verses?.filter(v => 
      !existingSet.has(`${v.chapter_number}-${v.verse_number}`)
    ) || [];

    console.log(`${versesToProcess.length} verses need audio generation`);

    // User's custom voice from ElevenLabs
    const voiceId = 'MwYJJAHHO7HKX7gxuRnI';
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process in batches to avoid rate limits
    for (let i = 0; i < versesToProcess.length; i += batchSize) {
      const batch = versesToProcess.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (verse) => {
        const verseKey = `${verse.chapter_number}-${verse.verse_number}`;
        const translation = translationMap.get(verse.verse_id) || '';
        
        // Get curated insight or generate generic one
        const insight = curatedInsights[verseKey] || {
          explanation: `This verse from Chapter ${verse.chapter_number} teaches an important lesson about life and spirituality.`,
          takeaway: "Reflect on this wisdom and apply it to your daily life."
        };

        const fullText = `
${verse.text}

... 

The translation is: ${translation}

... 

What this means: ${insight.explanation}

... 

The key takeaway is: ${insight.takeaway}
        `.trim();

        try {
          console.log(`Generating audio for ${verseKey}...`);

          const ttsResponse = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
            {
              method: 'POST',
              headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                text: fullText,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                  stability: 0.6,
                  similarity_boost: 0.75,
                  style: 0.3,
                  use_speaker_boost: true,
                  speed: 0.85,
                },
              }),
            }
          );

          if (!ttsResponse.ok) {
            const errorText = await ttsResponse.text();
            throw new Error(`ElevenLabs error: ${ttsResponse.status} - ${errorText}`);
          }

          const audioBuffer = await ttsResponse.arrayBuffer();
          const storagePath = `${verse.chapter_number}/${verse.verse_number}.mp3`;

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('verse-audio')
            .upload(storagePath, audioBuffer, {
              contentType: 'audio/mpeg',
              upsert: true
            });

          if (uploadError) throw uploadError;

          // Record in database
          const { error: insertError } = await supabase
            .from('verse_audio')
            .upsert({
              chapter_number: verse.chapter_number,
              verse_number: verse.verse_number,
              storage_path: storagePath,
              file_size: audioBuffer.byteLength
            }, {
              onConflict: 'chapter_number,verse_number'
            });

          if (insertError) throw insertError;

          successCount++;
          console.log(`✓ Generated audio for ${verseKey} (${audioBuffer.byteLength} bytes)`);

        } catch (error) {
          errorCount++;
          const errMsg = `Failed ${verseKey}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errMsg);
          console.error(errMsg);
        }
      }));

      // Add delay between batches to respect rate limits
      if (i + batchSize < versesToProcess.length) {
        console.log(`Waiting 2s before next batch...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: versesToProcess.length,
        successCount,
        errorCount,
        errors: errors.slice(0, 10), // Only return first 10 errors
        message: `Generated ${successCount} audio files, ${errorCount} errors`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in generate-all-verse-audio:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
