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
  const cwid = searchParams.get('cwid');
  
  if (!cwid) {
    return NextResponse.json({ error: 'Missing cwid parameter' }, { status: 400 });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute(
      `SELECT
        ps.cwid,
        ps.specialtyName AS personMesh,
        (
            CASE WHEN LOWER(ps.specialtyName) LIKE '%board%' THEN 2 ELSE 1 END *
            CASE WHEN ps.isPrimary = 1 THEN 2.5 ELSE 1 END
        ) * 30 AS scoreBestMatch
      FROM (
          SELECT
              cwid,
              specialtyName,
              MAX(isPrimary) AS isPrimary
          FROM pops_specialties
          WHERE specialtyName IS NOT NULL
          GROUP BY cwid, specialtyName
      ) ps
      WHERE ps.cwid = ?
      ORDER BY scoreBestMatch DESC`,
      [cwid]
    );

    await connection.end();

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching clinical specialties:', error);
    return NextResponse.json({ error: 'Failed to fetch clinical specialties' }, { status: 500 });
  }
} 