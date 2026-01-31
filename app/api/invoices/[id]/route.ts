import { NextResponse } from 'next/server';
import db from '@/lib/db';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader?.split('token=')[1]?.split(';')[0];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'secret_123');

    // Fetch Invoice
    const [invoices] = await db.query<RowDataPacket[]>("SELECT * FROM invoices WHERE id = ?", [id]);
    
    if (invoices.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Fetch Items
    const [items] = await db.query<RowDataPacket[]>("SELECT * FROM invoice_items WHERE invoice_id = ?", [id]);

    return NextResponse.json({ ...invoices[0], items });
    
  } catch (error) {
    // Error ko console mein log karne se warning khatam ho jayegi aur debugging aasaan hogi
    console.error("View Invoice API Error:", error);
    
    return NextResponse.json(
      { error: "Server Error" }, 
      { status: 500 }
    );
  }
}