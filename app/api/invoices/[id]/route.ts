import { NextResponse } from 'next/server';
import db from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const decoded: any = jwt.verify(token!, process.env.JWT_SECRET!);

    const [invoices]: any = await db.query(
      `SELECT i.*, b.buyer_name, b.ntn_cnic FROM invoices i 
       JOIN buyers b ON i.buyer_id = b.id 
       WHERE i.id = ? AND i.tenant_id = ?`,
      [params.id, decoded.tenant_id]
    );

    if (!invoices.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [items]: any = await db.query("SELECT * FROM invoice_items WHERE invoice_id = ?", [params.id]);
    
    const invoiceData = { ...invoices[0], items };
    return NextResponse.json(invoiceData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}