import { NextResponse } from 'next/server';
import db from '@/lib/db';
import jwt from 'jsonwebtoken';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// 1. JWT Payload ke liye interface
interface AuthUser {
  user_id: number;
  tenant_id: number;
  email: string;
}

// 2. Buyer data ke liye interface
// RowDataPacket ko extend karna zaroori hai taake mysql2 query mein use ho sakay
interface Buyer extends RowDataPacket {
  id: number;
  tenant_id: number;
  buyer_name: string;
  ntn_cnic: string;
  buyer_email: string | null;
  buyer_address: string | null;
  buyer_phone: string | null;
  created_at: Date;
}

// Helper function to verify token with proper typing
const verifyAuth = (req: Request): AuthUser => {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) throw new Error("Unauthorized");
  
  return jwt.verify(token, process.env.JWT_SECRET!) as unknown as AuthUser;
};

export async function GET(req: Request) {
  try {
    const user = verifyAuth(req);
    
    // Yahan 'Buyer[]' use karne se "unused" error khatam ho jayega
    const [buyers] = await db.query<Buyer[]>(
      "SELECT * FROM buyers WHERE tenant_id = ? ORDER BY created_at DESC",
      [user.tenant_id]
    );
    
    return NextResponse.json(buyers);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = verifyAuth(req);
    const { buyer_name, ntn_cnic, email, address, phone } = await req.json();

    if (!buyer_name || !ntn_cnic) {
      return NextResponse.json({ error: "Name and NTN/CNIC are required" }, { status: 400 });
    }

    const [result] = await db.query<ResultSetHeader>(
      "INSERT INTO buyers (tenant_id, buyer_name, ntn_cnic, buyer_email, buyer_address, buyer_phone) VALUES (?, ?, ?, ?, ?, ?)",
      [user.tenant_id, buyer_name, ntn_cnic, email, address, phone]
    );

    return NextResponse.json({ 
      message: "Buyer added successfully", 
      id: result.insertId 
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Bad Request";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}