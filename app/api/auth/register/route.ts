import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: number;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Payload se data nikalna (matching your exact payload names)
    const { 
      business_name, 
      ntn, 
      contact_email, 
      password, 
      address, 
      contact_mobile, 
      province, 
      logo 
    } = body;

    // Strict Validation: Sab fields check karein jo aap bhej rahi hain
    if (!contact_email || !password || !business_name || !ntn || !address || !contact_mobile) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // 1. Check if user already exists
    const [existingUser] = await db.query<UserRow[]>(
      'SELECT id FROM users WHERE email = ?', 
      [contact_email]
    );

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // 2. Create Tenant (Business)
    const [tenantResult] = await db.query<ResultSetHeader>(
      'INSERT INTO tenants (business_name, ntn, address, contact_mobile, contact_email, province, logo, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [business_name, ntn, address, contact_mobile, contact_email, province || 'Punjab', logo, 'ACTIVE']
    );
    const tenantId = tenantResult.insertId;

    // 3. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create User linked to Tenant
    await db.query<ResultSetHeader>(
      'INSERT INTO users (tenant_id, email, password_hash) VALUES (?, ?, ?)',
      [tenantId, contact_email, hashedPassword]
    );

    return NextResponse.json({ message: "Registration successful" }, { status: 201 });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown database error";
    console.error("REGISTRATION_ERROR:", error);
    return NextResponse.json({ error: "Database error: " + errorMessage }, { status: 500 });
  }
}