import { NextResponse } from 'next/server';
import db from '@/lib/db';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// 1. JWT Payload ke liye sahi interface
interface AuthUser extends JwtPayload {
  userId: number; 
  tenantId: number;
}

// 2. Buyer data ke liye interface
interface Buyer extends RowDataPacket {
  id: number;
  tenant_id: number;
  buyer_name: string;
  ntn_cnic: string;
  buyer_address: string | null;
}

// Helper function to verify token
const verifyAuth = (req: Request): AuthUser => {
  const cookieHeader = req.headers.get('cookie');
  const token = cookieHeader?.split('token=')[1]?.split(';')[0];
  
  if (!token) throw new Error("Unauthorized");
  
  // env variable check aur cast
  return jwt.verify(token, process.env.JWT_SECRET || 'secret_123') as AuthUser;
};

export async function GET(req: Request) {
  try {
    const user = verifyAuth(req);
    const [buyers] = await db.query<Buyer[]>(
      "SELECT id, buyer_name as name, ntn_cnic as ntn, buyer_address as address FROM buyers WHERE tenant_id = ? ORDER BY created_at DESC",
      [user.tenantId]
    );
    return NextResponse.json(buyers);
  } catch (error: unknown) {
    // Error log karna zaroori hai taake 'unused' error na aaye
    console.error("GET_BUYERS_ERROR:", error);
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = verifyAuth(req);
    const body = await req.json();

    // Frontend se 'name', 'ntn', aur 'address' receive ho raha hai
    const { name, ntn, address } = body;

    if (!name || !ntn) {
      return NextResponse.json({ error: "Name and NTN are required" }, { status: 400 });
    }

    // Database columns: buyer_name, ntn_cnic, buyer_address
    const [result] = await db.query<ResultSetHeader>(
      "INSERT INTO buyers (tenant_id, buyer_name, ntn_cnic, buyer_address) VALUES (?, ?, ?, ?)",
      [user.tenantId, name, ntn, address || null]
    );

    return NextResponse.json({ 
      message: "Buyer added successfully", 
      id: result.insertId,
      name,
      ntn,
      address
    }, { status: 201 });

  } catch (error: unknown) {
    // Console log se 'error is defined but never used' solve hoga
    console.error("POST_BUYER_ERROR:", error);
    
    const message = error instanceof Error ? error.message : "Failed to add buyer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}