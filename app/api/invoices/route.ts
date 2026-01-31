import { NextResponse } from 'next/server';
import db from '@/lib/db';
import jwt, { JwtPayload } from 'jsonwebtoken';

interface AuthUser extends JwtPayload {
  tenantId: number;
}

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader?.split('token=')[1]?.split(';')[0];
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = jwt.verify(token, process.env.JWT_SECRET || 'secret_123') as AuthUser;

    // Invoices fetch karna optimized query ke saath
    const [rows] = await db.query(
      "SELECT id, invoice_ref_no, buyer_name, invoice_date, total_amount, status FROM invoices WHERE tenant_id = ? ORDER BY id DESC",
      [user.tenantId]
    );

    return NextResponse.json(rows);
  } catch (error) {
    // Error ko console mein log kar rahe hain taake warning khatam ho jaye aur debugging mein help mile
    console.error("FETCH_INVOICES_ERROR:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch invoices" }, 
      { status: 500 }
    );
  }
}