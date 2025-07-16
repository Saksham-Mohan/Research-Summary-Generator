import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: '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',
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      selectedPublications,
      researcherName,
      length,
      timeframe,
      voice,
      tone,
      audience,
      keyElements,
      additionalInstructions
    } = body;

    if (!selectedPublications || selectedPublications.length === 0) {
      return NextResponse.json({ error: 'No publications selected' }, { status: 400 });
    }

    // Build the publications text
    const publicationsText = selectedPublications.map((pub: any) => 
      `- "${pub.articleTitle}" (${pub.articleYear}, ${pub.publicationTypeCanonical}, ${pub.authorPosition || 'N/A'} author)`
    ).join('\n');

    // Build the prompt
    const prompt = `You are an expert academic writer tasked with creating a professional research summary for a faculty member's web profile.

RESEARCHER: ${researcherName}

SELECTED PUBLICATIONS:
${publicationsText}

REQUIREMENTS:
- Length: ${length}
- Time Frame: ${timeframe}
- Voice: ${voice}
- Tone: ${tone}
- Target Audience: ${audience}
${keyElements.length > 0 ? `- Key Elements to Highlight: ${keyElements.join(', ')}` : ''}
${additionalInstructions ? `- Additional Instructions: ${additionalInstructions}` : ''}

INSTRUCTIONS:
Create a professional, concise research summary that:
1. Synthesizes the researcher's key contributions based on their selected publications
2. Uses the specified voice (${voice}) and tone (${tone})
3. Targets the specified audience (${audience})
4. Focuses on the ${timeframe} timeframe
5. Maintains appropriate length for ${length}
6. Highlights the researcher's expertise and impact in their field
7. Uses clear, accessible language appropriate for the target audience

The summary should be well-structured, engaging, and accurately represent the researcher's work and contributions.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert academic writer specializing in creating professional research summaries for faculty profiles. You excel at synthesizing complex research into clear, engaging narratives that highlight researchers' key contributions and impact."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const summary = completion.choices[0]?.message?.content || 'Unable to generate summary';

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
} 