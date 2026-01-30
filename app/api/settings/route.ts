import { NextResponse } from 'next/server';
import db from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function PUT(req: Request) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = jwt.verify(token!, process.env.JWT_SECRET!);
    const body = await req.json();

    await db.query(
      `UPDATE tenants SET 
       fbr_sandbox_api_url = ?, fbr_sandbox_bearer_token = ?, 
       fbr_prod_api_url = ?, fbr_prod_bearer_token = ? 
       WHERE id = ?`,
      [body.fbr_sandbox_api_url, body.fbr_sandbox_bearer_token, body.fbr_prod_api_url, body.fbr_prod_bearer_token, decoded.tenant_id]
    );

    return NextResponse.json({ message: "Settings Updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

// GET method to fetch existing settings
export async function GET(req: Request) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = jwt.verify(token!, process.env.JWT_SECRET!);
    const [rows]: any = await db.query(
      "SELECT fbr_sandbox_api_url, fbr_sandbox_bearer_token, fbr_prod_api_url, fbr_prod_bearer_token FROM tenants WHERE id = ?",
      [decoded.tenant_id]
    );
    return NextResponse.json(rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}