import { NextResponse } from 'next/server';
import db from '@/lib/db';
import jwt from 'jsonwebtoken';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 1. GET Method (View Details ke liye)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader?.split('token=')[1]?.split(';')[0];

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'secret_123');

    const [invoices] = await db.query<RowDataPacket[]>("SELECT * FROM invoices WHERE id = ?", [id]);
    if (invoices.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [items] = await db.query<RowDataPacket[]>("SELECT * FROM invoice_items WHERE invoice_id = ?", [id]);

    return NextResponse.json({ ...invoices[0], items });
  } catch (error) {
    console.error("GET_ERROR:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// 2. PUT Method (Update Draft ke liye)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      invoiceType, invoiceDate, buyerNTNCNIC, buyerBusinessName,
      buyerAddress, status, totalAmount, taxAmount, items
    } = body;

    // Update main invoice table
    await db.query(
      `UPDATE invoices SET 
        invoice_type = ?, invoice_date = ?, buyer_ntn = ?, 
        buyer_name = ?, buyer_address = ?, status = ?, 
        total_amount = ?, tax_amount = ? 
      WHERE id = ?`,
      [invoiceType, invoiceDate, buyerNTNCNIC, buyerBusinessName, buyerAddress, status, totalAmount, taxAmount, id]
    );

    // Delete old items and insert updated ones
    await db.query("DELETE FROM invoice_items WHERE invoice_id = ?", [id]);

    if (items && Array.isArray(items)) {
      for (const item of items) {
        await db.query(
          `INSERT INTO invoice_items (
            invoice_id, hs_code, product_code, description, 
            quantity, price, uom, tax_rate, sales_tax, total
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, item.hsCode, item.prodCode, item.name, 
            item.qty, item.price, item.uoM, item.tax_rate, 
            item.salesTaxApplicable, item.totalValues
          ]
        );
      }
    }

    return NextResponse.json({ message: "Invoice updated successfully" });
  } catch (error) {
    console.error("PUT_ERROR:", error);
    return NextResponse.json({ error: "Failed to update database" }, { status: 500 });
  }
}