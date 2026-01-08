import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { verse, profile, challenge } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build user context from profile
    let userContext = '';
    if (profile) {
      const parts = [];
      if (profile.age) parts.push(`${profile.age} years old`);
      if (profile.profession) parts.push(`works as a ${profile.profession}`);
      if (profile.marital_status) parts.push(`${profile.marital_status}`);
      if (parts.length > 0) {
        userContext = `The reader is ${parts.join(', ')}.`;
      }
    }

    // Build challenge context
    let challengeContext = '';
    if (challenge) {
      challengeContext = `They are currently facing: ${challenge.label} - ${challenge.description}.`;
    }

    const systemPrompt = `You are a wise spiritual guide who helps people understand the Bhagavad Gita through relatable, modern examples. 
Your task is to create a personalized real-life example that illustrates how a verse's teaching applies to someone's specific situation.

Important guidelines:
- Keep the example anonymous - do not use names, use generic terms like "a person", "someone", "they"
- Make the example highly relatable to the person's age, profession, and life situation
- Connect the example directly to the verse's core teaching
- Keep it concise but impactful (2-3 sentences for the scenario)
- The example should show how applying the verse's wisdom leads to positive outcomes

Respond with a JSON object containing:
- "title": A short, catchy title for the example (5-8 words)
- "description": The personalized example scenario (2-4 sentences)`;

    const userPrompt = `Create a personalized example for this verse:

Verse: Chapter ${verse.chapter}, Verse ${verse.verse}
Sanskrit: ${verse.sanskrit}
Translation: "${verse.english}"
Explanation: ${verse.insight?.explanation || ''}

${userContext}
${challengeContext}

Generate a relatable, anonymous example that shows how this verse's teaching applies to their life situation.`;

    console.log('Generating personalized insight for verse:', verse.chapter + '.' + verse.verse);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please try again later.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse JSON from the response
    let insight;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insight = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Fallback: create a simple insight from the raw text
      insight = {
        title: 'A Personal Reflection',
        description: content.slice(0, 500)
      };
    }

    console.log('Generated insight:', insight.title);

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-personalized-insight:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate insight';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
