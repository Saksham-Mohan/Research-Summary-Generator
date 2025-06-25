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
  const query = searchParams.get('query') || '';
  if (!query || query.length < 1) {
    return NextResponse.json([]);
  }
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      `SELECT cwid, surname, givenName FROM identity WHERE fullTimeFaculty = 'yes' AND (surname LIKE ? OR givenName LIKE ? OR cwid LIKE ?) LIMIT 20`,
      [`${query}%`, `${query}%`, `${query}%`]
    );
    await connection.end();
    return NextResponse.json(rows);
  } catch (error) {
    console.error('DB error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
} 