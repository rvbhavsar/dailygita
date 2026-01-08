import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/gita/gita/main/data';

interface GitaChapter {
  chapter_number: number;
  verses_count: number;
  name: string;
  translation: string;
  transliteration: string;
  summary: { en: string; hi: string };
}

interface GitaVerse {
  id: number;
  chapter_number: number;
  verse_number: number;
  text: string;
  transliteration: string;
  word_meanings: string;
}

interface GitaTranslation {
  id: number;
  verse_id: number;
  description: string;
  authorName: string;
  lang: string;
}

async function fetchFromGitHub<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${GITHUB_BASE_URL}/${endpoint}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}: ${response.status}`);
  }
  return response.json();
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching chapters from GitHub...');
    const chapters = await fetchFromGitHub<GitaChapter[]>('chapters.json');
    
    console.log(`Found ${chapters.length} chapters. Inserting into database...`);
    
    // Insert chapters
    const chaptersData = chapters.map(ch => ({
      chapter_number: ch.chapter_number,
      name: ch.name,
      name_transliterated: ch.transliteration,
      name_translated: ch.translation,
      verses_count: ch.verses_count,
      chapter_summary: ch.summary?.en || null,
      chapter_summary_hindi: ch.summary?.hi || null,
    }));

    const { error: chaptersError } = await supabase
      .from('chapters')
      .upsert(chaptersData, { onConflict: 'chapter_number' });

    if (chaptersError) {
      console.error('Error inserting chapters:', chaptersError);
      throw chaptersError;
    }
    console.log('Chapters inserted successfully');

    // Fetch and insert verses
    console.log('Fetching verses from GitHub...');
    const verses = await fetchFromGitHub<GitaVerse[]>('verse.json');
    console.log(`Found ${verses.length} verses. Inserting into database...`);

    const versesData = verses.map(v => ({
      verse_id: v.id,
      chapter_number: v.chapter_number,
      verse_number: v.verse_number,
      text: v.text,
      transliteration: v.transliteration || null,
      word_meanings: v.word_meanings || null,
    }));

    // Insert verses in batches of 100
    const BATCH_SIZE = 100;
    for (let i = 0; i < versesData.length; i += BATCH_SIZE) {
      const batch = versesData.slice(i, i + BATCH_SIZE);
      const { error: versesError } = await supabase
        .from('verses')
        .upsert(batch, { onConflict: 'verse_id' });

      if (versesError) {
        console.error(`Error inserting verses batch ${i}:`, versesError);
        throw versesError;
      }
      console.log(`Inserted verses batch ${i + 1} to ${Math.min(i + BATCH_SIZE, versesData.length)}`);
    }
    console.log('Verses inserted successfully');

    // Fetch and insert translations
    console.log('Fetching translations from GitHub...');
    const translations = await fetchFromGitHub<GitaTranslation[]>('translation.json');
    
    // Filter to only English translations to reduce data size
    const englishTranslations = translations.filter(t => t.lang === 'english');
    console.log(`Found ${englishTranslations.length} English translations. Inserting into database...`);

    const translationsData = englishTranslations.map(t => ({
      verse_id: t.verse_id,
      author_name: t.authorName,
      language: t.lang,
      description: t.description,
    }));

    // Insert translations in batches of 100
    for (let i = 0; i < translationsData.length; i += BATCH_SIZE) {
      const batch = translationsData.slice(i, i + BATCH_SIZE);
      const { error: translationsError } = await supabase
        .from('translations')
        .insert(batch);

      if (translationsError) {
        // If it's a duplicate, skip
        if (translationsError.code !== '23505') {
          console.error(`Error inserting translations batch ${i}:`, translationsError);
          throw translationsError;
        }
      }
      console.log(`Inserted translations batch ${i + 1} to ${Math.min(i + BATCH_SIZE, translationsData.length)}`);
    }
    console.log('Translations inserted successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Gita data seeded successfully',
        stats: {
          chapters: chapters.length,
          verses: verses.length,
          translations: englishTranslations.length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error seeding data:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
