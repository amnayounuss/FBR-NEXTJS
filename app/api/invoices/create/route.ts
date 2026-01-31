import { NextResponse } from 'next/server';
import db from '@/lib/db';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ResultSetHeader } from 'mysql2';

// 1. Token payload ke liye interface
interface AuthToken extends JwtPayload {
  tenantId: number;
  userId: number;
}

// 2. Invoice Item ke liye interface
interface InvoiceItem {
  name: string;
  qty: number;
  price: number;
  tax_rate: number;
}

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader?.split('token=')[1]?.split(';')[0];
    
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    // 3. 'any' ki jagah AuthToken interface ka istemal
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_123') as AuthToken;
    
    const body = await req.json();
    const { buyer_id, items, total_amount, tax_amount }: {
      buyer_id: string | number;
      items: InvoiceItem[];
      total_amount: number;
      tax_amount: number;
    } = body;

    // 1. Insert Invoice Header
    const [invoiceResult] = await db.query<ResultSetHeader>(
      'INSERT INTO invoices (tenant_id, buyer_id, total_amount, tax_amount, status) VALUES (?, ?, ?, ?, ?)',
      [decoded.tenantId, buyer_id, total_amount, tax_amount, 'PENDING']
    );
    const invoiceId = invoiceResult.insertId;

    // 2. Insert Invoice Items (Loop)
    for (const item of items) {
      await db.query(
        'INSERT INTO invoice_items (invoice_id, product_name, quantity, price, tax_rate) VALUES (?, ?, ?, ?, ?)',
        [invoiceId, item.name, item.qty, item.price, item.tax_rate]
      );
    }

    return NextResponse.json({ message: "Invoice created successfully", invoiceId }, { status: 201 });
  } catch (error) {
    console.error("INVOICE_CREATE_ERROR:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create invoice";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}