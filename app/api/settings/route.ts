import { NextResponse } from 'next/server';
import db from '@/lib/db';
import jwt from 'jsonwebtoken';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface AuthUser {
  userId: number;
  tenantId: number;
}

interface SettingsRow extends RowDataPacket {
  business_name: string;
  ntn: string;
  address: string;
  contact_email: string;
  contact_mobile: string;
  fbr_sandbox_api_url: string;
  fbr_sandbox_bearer_token: string;
  fbr_prod_api_url: string; // Added Production field
  fbr_prod_bearer_token: string; // Added Production field
}

const getAuth = (req: Request) => {
  const token = req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
  if (!token) throw new Error("Unauthorized");
  return jwt.verify(token, process.env.JWT_SECRET || 'secret_123') as AuthUser;
};

export async function GET(req: Request) {
  try {
    const decoded = getAuth(req);
    const [rows] = await db.query<SettingsRow[]>(
      `SELECT business_name, ntn, address, contact_email, contact_mobile, 
       fbr_sandbox_api_url, fbr_sandbox_bearer_token, 
       fbr_prod_api_url, fbr_prod_bearer_token 
       FROM tenants WHERE id = ?`,
      [decoded.tenantId]
    );
    return NextResponse.json(rows[0] || {});
  } catch (error) {
    console.error("GET_SETTINGS_ERROR:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const decoded = getAuth(req);
    const body = await req.json();

    await db.query<ResultSetHeader>(
      `UPDATE tenants SET 
       business_name = ?, ntn = ?, address = ?, 
       contact_email = ?, contact_mobile = ?,
       fbr_sandbox_api_url = ?, fbr_sandbox_bearer_token = ?,
       fbr_prod_api_url = ?, fbr_prod_bearer_token = ?
       WHERE id = ?`,
      [
        body.business_name, body.ntn, body.address,
        body.contact_email, body.contact_mobile,
        body.fbr_sandbox_api_url, body.fbr_sandbox_bearer_token,
        body.fbr_prod_api_url, body.fbr_prod_bearer_token,
        decoded.tenantId
      ]
    );

    return NextResponse.json({ message: "Settings Updated Successfully" });
  } catch (error) {
    console.error("POST_SETTINGS_ERROR:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 401 });
  }
}