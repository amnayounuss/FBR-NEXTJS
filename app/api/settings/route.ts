import { NextResponse } from 'next/server';
import db from '@/lib/db';
import jwt from 'jsonwebtoken';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 1. JWT Payload ke liye interface
interface AuthUser {
  user_id: number;
  tenant_id: number;
  email: string;
}

// 2. Settings row ke liye interface (RowDataPacket extend karna zaroori hai)
interface SettingsRow extends RowDataPacket {
  fbr_sandbox_api_url: string;
  fbr_sandbox_bearer_token: string;
  fbr_prod_api_url: string;
  fbr_prod_bearer_token: string;
}

// 3. Request body ke liye interface
interface SettingsBody {
  fbr_sandbox_api_url: string;
  fbr_sandbox_bearer_token: string;
  fbr_prod_api_url: string;
  fbr_prod_bearer_token: string;
}

// Helper function to verify token with proper typing
const verifyToken = (req: Request): AuthUser => {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) throw new Error("Unauthorized");
  
  // jwt.verify ko explicitly AuthUser type mein cast karein
  return jwt.verify(token, process.env.JWT_SECRET!) as unknown as AuthUser;
};

export async function PUT(req: Request) {
  try {
    const decoded = verifyToken(req);
    const body = await req.json() as SettingsBody;

    // ResultSetHeader ka istemal karein UPDATE query ke liye
    await db.query<ResultSetHeader>(
      `UPDATE tenants SET 
       fbr_sandbox_api_url = ?, fbr_sandbox_bearer_token = ?, 
       fbr_prod_api_url = ?, fbr_prod_bearer_token = ? 
       WHERE id = ?`,
      [
        body.fbr_sandbox_api_url, 
        body.fbr_sandbox_bearer_token, 
        body.fbr_prod_api_url, 
        body.fbr_prod_bearer_token, 
        decoded.tenant_id
      ]
    );

    return NextResponse.json({ message: "Settings Updated" });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }
}

export async function GET(req: Request) {
  try {
    const decoded = verifyToken(req);
    
    // SettingsRow[] ka istemal karein SELECT query ke liye
    const [rows] = await db.query<SettingsRow[]>(
      "SELECT fbr_sandbox_api_url, fbr_sandbox_bearer_token, fbr_prod_api_url, fbr_prod_bearer_token FROM tenants WHERE id = ?",
      [decoded.tenant_id]
    );
    
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Settings not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Fetch failed";
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }
}