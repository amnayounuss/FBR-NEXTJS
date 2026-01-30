import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export async function POST(req: Request) {
  try {
    const { business_name, ntn, province, address, contact_email, contact_mobile, password } = await req.json();

    if (!business_name || !ntn || !province || !contact_email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // 1. SELECT query ke liye RowDataPacket[] ka istemal (any ki jagah)
    const [existing] = await db.query<RowDataPacket[]>("SELECT id FROM tenants WHERE ntn = ?", [ntn]);
    if (existing.length > 0) {
      return NextResponse.json({ error: "NTN already registered" }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      // 2. INSERT query ke liye ResultSetHeader ka istemal (any ki jagah)
      const [tRes] = await conn.query<ResultSetHeader>(
        "INSERT INTO tenants (business_name, ntn, province, address, contact_email, contact_mobile) VALUES (?, ?, ?, ?, ?, ?)",
        [business_name, ntn, province, address, contact_email, contact_mobile]
      );

      await conn.query<ResultSetHeader>(
        "INSERT INTO users (tenant_id, email, password_hash) VALUES (?, ?, ?)",
        [tRes.insertId, contact_email, password_hash]
      );

      await conn.commit();
      return NextResponse.json({ message: "Registration successful" }, { status: 201 });
    } catch (err: unknown) {
      await conn.rollback();
      // Error type handling
      const errorMessage = err instanceof Error ? err.message : "Database transaction failed";
      throw new Error(errorMessage);
    } finally {
      conn.release();
    }
  } catch (error: unknown) {
    // 3. Catch block mein unknown type aur instance check ka istemal
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}