import { NextResponse } from 'next/server';
import db from '@/lib/db';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';

// 1. JWT Payload ke liye interface
interface AuthUser {
  user_id: number;
  tenant_id: number;
  email: string;
}

// 2. Invoice aur Buyer data ke liye interface (RowDataPacket extend karna zaroori hai)
interface InvoiceRow extends RowDataPacket {
  id: number;
  tenant_id: number;
  buyer_id: number;
  buyer_name: string;
  ntn_cnic: string;
  internal_invoice_number: string;
  invoice_date: Date;
  status: string;
}

// 3. Invoice items ke liye interface
interface InvoiceItem extends RowDataPacket {
  id: number;
  invoice_id: number;
  hs_code: string;
  product_description: string;
  quantity: number;
  rate: number;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) throw new Error("No token provided");

    // Decoded token ko AuthUser type mein cast karein
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as unknown as AuthUser;

    // 4. Query mein InvoiceRow[] ka istemal karein (any ki jagah)
    const [invoices] = await db.query<InvoiceRow[]>(
      `SELECT i.*, b.buyer_name, b.ntn_cnic FROM invoices i 
       JOIN buyers b ON i.buyer_id = b.id 
       WHERE i.id = ? AND i.tenant_id = ?`,
      [params.id, decoded.tenant_id]
    );

    if (!invoices.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 5. Items query mein InvoiceItem[] ka istemal karein
    const [items] = await db.query<InvoiceItem[]>(
      "SELECT * FROM invoice_items WHERE invoice_id = ?", 
      [params.id]
    );
    
    const invoiceData = { ...invoices[0], items };
    return NextResponse.json(invoiceData);

  } catch (error: unknown) {
    // 6. Catch block mein 'any' ki jagah 'unknown' behtar practice hai
    const errorMessage = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }
}