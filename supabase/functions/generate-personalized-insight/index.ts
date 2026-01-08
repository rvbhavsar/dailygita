import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { verse, profile, challenge } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build user context from profile
    let userContext = "an individual";
    const contextParts: string[] = [];
    
    if (profile?.age) {
      if (profile.age < 25) contextParts.push("a young adult in their early twenties");
      else if (profile.age < 35) contextParts.push("someone in their late twenties to early thirties");
      else if (profile.age < 45) contextParts.push("a person in their mid-thirties to early forties");
      else if (profile.age < 55) contextParts.push("someone in their mid-forties to early fifties");
      else contextParts.push("a person in their fifties or older");
    }
    
    if (profile?.profession) {
      contextParts.push(`working as a ${profile.profession}`);
    }
    
    if (profile?.marital_status) {
      const statusMap: Record<string, string> = {
        'single': 'who is single',
        'married': 'who is married',
        'divorced': 'who has been through a divorce',
        'widowed': 'who has lost their spouse',
        'in_relationship': 'who is in a relationship'
      };
      contextParts.push(statusMap[profile.marital_status] || '');
    }
    
    if (contextParts.length > 0) {
      userContext = contextParts.filter(Boolean).join(', ');
    }

    const challengeLabels: Record<string, string> = {
      'stress-anxiety': 'stress and anxiety',
      'decision-making': 'making difficult decisions',
      'discipline-consistency': 'maintaining discipline and consistency',
      'focus-distraction': 'staying focused amid distractions',
      'purpose-motivation': 'finding purpose and motivation',
      'relationships': 'navigating relationships',
      'leadership': 'leadership challenges',
      'fear-doubt': 'overcoming fear and self-doubt'
    };

    const challengeContext = challenge ? challengeLabels[challenge] || challenge : 'life challenges';

    const systemPrompt = `You are a wise and empathetic guide who helps people understand the timeless wisdom of the Bhagavad Gita through relatable, modern-day examples.

Your task is to create a personalized real-life example that illustrates how a verse from the Bhagavad Gita applies to someone's specific life situation.

CRITICAL RULES:
1. NEVER use any names - keep the example completely anonymous using terms like "someone", "a person", "they", "an individual"
2. Make the example highly relatable to the user's demographic context
3. Connect the example directly to their specific life challenge
4. Keep the example concise but impactful (150-200 words)
5. Show how applying the verse's wisdom leads to a positive transformation
6. Use contemporary, everyday situations
7. Be warm, understanding, and non-preachy in tone

Format your response as a JSON object with:
- "title": A short, engaging title for the example (5-8 words)
- "description": The detailed example narrative`;

    const userPrompt = `Create a personalized real-life example for this verse:

VERSE: Bhagavad Gita Chapter ${verse.chapter}, Verse ${verse.verse}
SANSKRIT: ${verse.sanskrit}
TRANSLATION: ${verse.english}

USER CONTEXT: ${userContext}
LIFE CHALLENGE: Dealing with ${challengeContext}

Generate an anonymous, relatable example showing how this verse's wisdom applies to someone with this background facing this challenge. Remember: NO NAMES, keep it anonymous.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to generate insight" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response
    let insight;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insight = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Fallback: create a structured response from the raw text
      insight = {
        title: "Your Personal Insight",
        description: content.replace(/```json|```/g, '').trim()
      };
    }

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-personalized-insight:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
