import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';

// User aur Tenant data ki shape define karein
interface UserRow extends RowDataPacket {
  id: number;
  tenant_id: number;
  email: string;
  password_hash: string;
  business_name: string;
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Find user with tenant info
    // [users] ko UserRow[] type di hai taake 'any' ki zaroorat na paray
    const [users] = await db.query<UserRow[]>(
      'SELECT u.*, t.business_name FROM users u JOIN tenants t ON u.tenant_id = t.id WHERE u.email = ?',
      [email]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, email: user.email },
      process.env.JWT_SECRET || 'secret_123',
      { expiresIn: '1d' }
    );

    const response = NextResponse.json({
      message: "Login successful",
      user: { 
        id: user.id, 
        email: user.email, 
        tenantId: user.tenant_id, 
        businessName: user.business_name 
      }
    });

    // Set cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 86400,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Login failed";
    console.error("LOGIN_ERROR:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}