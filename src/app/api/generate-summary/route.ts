import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import mysql from 'mysql2/promise';

const openai = new OpenAI({
  apiKey: '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',
});

const dbConfig = {
  host: 'reciter-analysis-report-db.cetg9yc1lyuf.us-east-1.rds.amazonaws.com',
  user: 'sam4075',
  password: 'sneezemousepancake',
  database: 'reciterdb',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      selectedPublications,
      selectedGrants,
      selectedSpecialties,
      selectedTrials,
      researcherName,
      cwid,
      length,
      timeframe,
      voice,
      tone,
      audience,
      keyElements,
      additionalInstructions,
      includeAbstracts,
      includeTrialSummaries
    } = body;

    if (!selectedPublications || selectedPublications.length === 0) {
      return NextResponse.json({ error: 'No publications selected' }, { status: 400 });
    }

    if (!cwid) {
      return NextResponse.json({ error: 'Missing cwid parameter' }, { status: 400 });
    }

    // Build the publications text
    const publicationsText = selectedPublications.map((pub: any) => {
      let pubText = `- "${pub.articleTitle}" (${pub.articleYear}, ${pub.publicationTypeCanonical}, ${pub.authorPosition || 'N/A'} author)`;
      if (includeAbstracts && pub.abstractVarchar) {
        pubText += `\n  Abstract: ${pub.abstractVarchar}`;
      }
      return pubText;
    }).join('\n');

    // Build the grants text
    const grantsText = selectedGrants && selectedGrants.length > 0 ? selectedGrants.map((grant: any) => {
      let grantText = `- "${grant.proj_title || 'Untitled Grant'}"`;
      if (grant.Orig_Sponsor) grantText += ` (${grant.Orig_Sponsor})`;
      if (grant.Award_Number) grantText += ` - Award #${grant.Award_Number}`;
      if (grant.begin_date && grant.end_date) grantText += ` (${grant.begin_date} to ${grant.end_date})`;
      if (grant.Role) grantText += ` - Role: ${grant.Role}`;
      if (grant.unit_name) grantText += ` - Unit: ${grant.unit_name}`;
      return grantText;
    }).join('\n') : '';

    // Build the clinical specialties text
    const specialtiesText = selectedSpecialties && selectedSpecialties.length > 0 ? selectedSpecialties.map((specialty: any) => {
      return `- ${specialty.personMesh} (Score: ${specialty.scoreBestMatch})`;
    }).join('\n') : '';

    // Build the clinical trials text
    const trialsText = selectedTrials && selectedTrials.length > 0 ? selectedTrials.map((trial: any) => {
      let trialText = `- "${trial.title}" (${trial.protocolType}, NCT: ${trial.nctNumber})`;
      if (includeTrialSummaries && trial.briefSummary) {
        trialText += `\n  Summary: ${trial.briefSummary}`;
      }
      return trialText;
    }).join('\n') : '';

    // Handle special tone cases
    let processedTone = tone;
    if (tone === "Kim Jong Un") {
      processedTone = "over-the-top authoritative and exaggerated";
    }

    // Handle voice instructions
    let voiceInstructions = "";
    if (voice === "Third person") {
      voiceInstructions = "Write in third person (e.g., 'Dr. Smith has conducted...', 'Her research focuses on...', 'The researcher has published...')";
    } else if (voice === "First person") {
      voiceInstructions = "Write in first person (e.g., 'I have conducted...', 'My research focuses on...', 'I have published...')";
    }

    // Build length-specific instructions
    let lengthInstructions = "";
    if (length === "Short") {
      lengthInstructions = "CRITICAL: Write EXACTLY 3-5 words maximum. This is a strict requirement. Do not exceed 5 words under any circumstances. Focus only on the researcher's primary research area in the most concise way possible. Examples: 'Tau protein neurodegeneration research' or 'Alzheimer's disease microglia studies'.";
    } else if (length === "Medium") {
      lengthInstructions = "CRITICAL: Write EXACTLY 3-4 sentences maximum. This is a strict requirement. Do not exceed 4 sentences under any circumstances. Include the researcher's main research areas, key methodologies, and notable findings. Provide enough detail to give a solid overview of their work while maintaining strict sentence count.";
    } else if (length === "Extended") {
      lengthInstructions = "CRITICAL: Write EXACTLY 300-500 words (approximately 20-35 sentences). This is a strict requirement. Do not exceed 500 words under any circumstances. Include comprehensive coverage of research areas, methodologies, key findings, impact, and future directions. Structure the summary with clear paragraphs covering different aspects of their work while maintaining strict word count.";
    }

    // Build the prompt
    const prompt = `You are a skilled academic writer creating a research summary for a faculty member's web profile.

RESEARCHER: ${researcherName}

SELECTED PUBLICATIONS:
${publicationsText}

${grantsText ? `SELECTED GRANTS:
${grantsText}

` : ''}${specialtiesText ? `CLINICAL SPECIALTIES:
${specialtiesText}

` : ''}${trialsText ? `CLINICAL TRIALS:
${trialsText}

` : ''}REQUIREMENTS:
- Length: ${length}
- Time Frame: ${timeframe}
- Voice: ${voice} ${voiceInstructions}
- Tone: ${processedTone}
- Target Audience: ${audience}
${keyElements.length > 0 ? `- Key Elements to Highlight: ${keyElements.join(', ')}` : ''}
${additionalInstructions ? `- Additional Instructions: ${additionalInstructions}` : ''}

LENGTH REQUIREMENTS:
${lengthInstructions}

INSTRUCTIONS:
Create a research summary that:
1. **FOLLOWS LENGTH REQUIREMENT FIRST AND FOREMOST** - The length requirement is the absolute priority. If you exceed the specified length, the summary is completely wrong regardless of content quality.
2. **Builds a coherent narrative** - Don't treat each publication as an isolated piece. Instead, analyze how the publications connect and build upon each other to tell the story of the researcher's career progression and evolving research focus.
3. **Identifies themes and patterns** - Look across all publications to identify recurring themes, methodological approaches, and how the researcher's work has developed over time.
4. **Shows career coherence** - Demonstrate how the researcher's work forms a cohesive body of research rather than a collection of individual studies.
5. Uses the specified voice: ${voiceInstructions}
6. Targets the specified audience (${audience})
7. Focuses on the ${timeframe} timeframe
8. **STRICTLY ADHERES TO LENGTH REQUIREMENT** - This is non-negotiable
9. Uses clear, accessible language appropriate for the target audience

The summary should weave together the researcher's work into a compelling narrative that shows the evolution and coherence of their research career.

**FINAL WARNING: LENGTH IS ABSOLUTE. If you exceed the specified length, the summary fails completely. Prioritize length compliance over all other requirements.**`;

    const completion = await openai.chat.completions.create({
      model: "o3",
      messages: [
        {
          role: "system",
          content: "You are a skilled academic writer who creates research summaries that tell compelling stories about researchers' careers. You excel at identifying connections between publications, finding recurring themes, and weaving individual studies into coherent narratives that show how a researcher's work has evolved and built upon itself over time."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const summary = completion.choices[0]?.message?.content || 'Unable to generate summary';

    // Save summary to database
    try {
      const connection = await mysql.createConnection(dbConfig);
      
      // Prepare the data payload for storage
      const dataPayload = {
        selectedPublications,
        selectedGrants,
        selectedSpecialties,
        selectedTrials,
        includeAbstracts,
        includeTrialSummaries
      };

      // Detect LLM provider from the completion object
      const getLLMProvider = (completion: any) => {
        if (completion.model?.includes('gpt') || completion.model?.includes('text-')) {
          return 'OpenAI';
        } else if (completion.model?.includes('claude') || completion.model?.includes('anthropic')) {
          return 'Anthropic';
        } else if (completion.model?.includes('gemini') || completion.model?.includes('google')) {
          return 'Google';
        } else {
          return 'Unknown';
        }
      };

      await connection.execute(
        `INSERT INTO research_summary (
          cwid, 
          output,
          constructedPrompt,
          LLM, 
          modelUsed, 
          userSpecifiedOutputLength, 
          userSpecifiedTimeFrame, 
          userSpecifiedVoice, 
          userSpecifiedTone, 
          userSpecifiedAudience, 
          userSpecifiedAdditionalInstructions, 
          userSpecifiedElementsToHighlight, 
          userSpecifiedDataPayload
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cwid,
          summary,
          prompt,
          getLLMProvider(completion),
          completion.model,
          length,
          timeframe,
          voice,
          tone,
          audience,
          additionalInstructions || null,
          keyElements.join(', ') || null,
          JSON.stringify(dataPayload)
        ]
      );

      await connection.end();
      console.log('Summary saved to database successfully');
    } catch (dbError) {
      console.error('Error saving to database:', dbError);
      // Don't fail the request if database save fails, just log the error
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
} 