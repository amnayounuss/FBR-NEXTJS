import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// User search ke liye interface
interface UserRow extends RowDataPacket {
  id: number;
}

export async function POST(req: Request) {
  try {
    const { business_name, ntn, email, password } = await req.json();

    if (!email || !password || !business_name || !ntn) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Check if user already exists
    // [existingUser] ko UserRow[] type di hai
    const [existingUser] = await db.query<UserRow[]>(
      'SELECT id FROM users WHERE email = ?', 
      [email]
    );

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // 1. Create Tenant
    // INSERT operation ke liye ResultSetHeader use hota hai
    const [tenantResult] = await db.query<ResultSetHeader>(
      'INSERT INTO tenants (business_name, ntn, status) VALUES (?, ?, ?)',
      [business_name, ntn, 'ACTIVE']
    );
    const tenantId = tenantResult.insertId;

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create User
    await db.query<ResultSetHeader>(
      'INSERT INTO users (tenant_id, email, password_hash) VALUES (?, ?, ?)',
      [tenantId, email, hashedPassword]
    );

    return NextResponse.json({ message: "Registration successful" }, { status: 201 });
  } catch (error: unknown) {
    // Error ko 'unknown' rakh kar message nikalna behtar practice hai
    const errorMessage = error instanceof Error ? error.message : "Unknown database error";
    console.error("REGISTRATION_ERROR:", error);
    return NextResponse.json({ error: "Database error: " + errorMessage }, { status: 500 });
  }
}