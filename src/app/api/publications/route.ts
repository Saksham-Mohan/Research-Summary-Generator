import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'reciter-analysis-report-db.cetg9yc1lyuf.us-east-1.rds.amazonaws.com',
  user: 'sam4075',
  password: 'sneezemousepancake',
  database: 'reciterdb',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const personIdentifier = searchParams.get('personIdentifier');
  if (!personIdentifier) {
    return NextResponse.json({ error: 'Missing personIdentifier' }, { status: 400 });
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // First, let's test a simple query to see if the basic tables exist
    const [rows] = await connection.execute(
      `SELECT 
        a.pmid,
        a.authorPosition,
        r.articleTitle,
        r.articleYear,
        r.publicationTypeCanonical,
        r.doi,
        r.percentileNIH,
        r.journalImpactScore2,
        b.abstractVarchar,
        ROUND(
          100 *
          (
            (1 + (r.articleYear - 2000) / 10) *
            (CASE 
                WHEN r.publicationTypeCanonical = 'Academic Article' THEN 1.0
                WHEN r.publicationTypeCanonical = 'Guideline' THEN 0.8
                WHEN r.publicationTypeCanonical = 'Review' THEN 0.5
                ELSE 0.3
             END) *
            (CASE 
                WHEN (a.authorPosition = 'first' OR a.authorPosition = 'last')
                    THEN 1.5
                ELSE 0.8
             END) *
            (1 + LOG10(GREATEST(COALESCE(r.journalImpactScore2, 1), 1))) *
            (
              CASE
                WHEN IFNULL(r.percentileNIH,0) > 0 THEN IFNULL(r.percentileNIH,0) / 100
                WHEN r.articleYear >= YEAR(CURDATE()) - 1 THEN 0.6
                ELSE 0.2
              END
            )
          )
        ) AS significanceScore
      FROM analysis_summary_author a
      JOIN analysis_summary_article r ON r.pmid = a.pmid
      LEFT JOIN reporting_abstracts b ON b.pmid = a.pmid AND b.abstractVarchar != ''
      WHERE a.personIdentifier = ?
      ORDER BY significanceScore DESC`,
      [personIdentifier]
    );
    
    await connection.end();
    console.log('Query result:', rows); // Debug log
    return NextResponse.json(rows);
  } catch (error) {
    console.error('DB error details:', error);
    return NextResponse.json({ error: 'Database error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 