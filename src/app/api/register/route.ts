import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { FieldPacket, ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '@/app/lib/db';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('Request received');
    const body = await request.json();

    const { email, name, password } = body as { email: string; name: string; password: string };
    console.log('Received body:', body);
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('Hashed password:', hashedPassword);

    const [result]: [ResultSetHeader, FieldPacket[]] = await pool.query(
      'INSERT INTO users(email, name, hashed_password) VALUES (?,?,?)',
      [email, name, hashedPassword]
    );

    const user = {
      id: result.insertId,
      email,
      name,
      hashedPassword,
    };

    console.log('User created', user);

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error in POST request', error);
    return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
  }
}
