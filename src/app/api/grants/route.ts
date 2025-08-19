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
      `SELECT * FROM reporting_infoed_all_cleaned WHERE cwid = ? ORDER BY begin_date DESC, end_date DESC`,
      [cwid]
    );

    await connection.end();

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching grants:', error);
    return NextResponse.json({ error: 'Failed to fetch grants' }, { status: 500 });
  }
} 