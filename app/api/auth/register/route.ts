import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { business_name, ntn, province, address, contact_email, contact_mobile, password } = await req.json();

    if (!business_name || !ntn || !province || !contact_email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Check existing NTN
    const [existing]: any = await db.query("SELECT id FROM tenants WHERE ntn = ?", [ntn]);
    if (existing.length > 0) return NextResponse.json({ error: "NTN already registered" }, { status: 400 });

    const password_hash = await bcrypt.hash(password, 10);
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      const [tRes]: any = await conn.query(
        "INSERT INTO tenants (business_name, ntn, province, address, contact_email, contact_mobile) VALUES (?, ?, ?, ?, ?, ?)",
        [business_name, ntn, province, address, contact_email, contact_mobile]
      );

      await conn.query(
        "INSERT INTO users (tenant_id, email, password_hash) VALUES (?, ?, ?)",
        [tRes.insertId, contact_email, password_hash]
      );

      await conn.commit();
      return NextResponse.json({ message: "Registration successful" }, { status: 201 });
    } catch (err: any) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}