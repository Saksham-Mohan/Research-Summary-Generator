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
        cwid,
        title,
        protocolType,
        c.nctNumber,
        overallCurrentStatus,
        phases,
        briefSummary
      FROM clinical_trials c
      LEFT JOIN clinical_trials_details d
        ON c.nctNumber COLLATE utf8mb4_general_ci = d.nctNumber
      WHERE cwid = ?`,
      [cwid]
    );

    await connection.end();

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching clinical trials:', error);
    return NextResponse.json({ error: 'Failed to fetch clinical trials' }, { status: 500 });
  }
} 