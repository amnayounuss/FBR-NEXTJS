import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const [rows]: any = await db.query(
      `SELECT u.*, t.business_name, t.ntn, t.status 
       FROM users u JOIN tenants t ON u.tenant_id = t.id 
       WHERE u.email = ?`,
      [email]
    );

    const user = rows[0];

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });
    if (user.status !== "ACTIVE") return NextResponse.json({ error: "Account suspended" }, { status: 403 });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return NextResponse.json({ error: "Invalid password" }, { status: 401 });

    const token = jwt.sign(
      { user_id: user.id, tenant_id: user.tenant_id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, business_name: user.business_name }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}