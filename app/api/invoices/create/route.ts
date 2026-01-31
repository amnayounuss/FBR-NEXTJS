import { NextResponse } from 'next/server';
import db from '@/lib/db';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { ResultSetHeader } from 'mysql2';

interface AuthUser extends JwtPayload {
  userId: number;
  tenantId: number;
}

interface InvoiceItem {
  hsCode: string;
  prodCode: string;
  name: string;
  qty: number;
  price: number;
  uoM: string;
  tax_rate: number;
  salesTaxApplicable: number;
  totalValues: number;
}

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader?.split('token=')[1]?.split(';')[0];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = jwt.verify(token, process.env.JWT_SECRET || 'secret_123') as AuthUser;
    const body = await req.json();

    const {
      invoiceType, invoiceDate, invoiceRefNo, buyerNTNCNIC,
      buyerBusinessName, buyerAddress, status, totalAmount, taxAmount, items
    } = body;

    // 1. Insert Invoice
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO invoices (
        tenant_id, invoice_type, invoice_date, invoice_ref_no, 
        buyer_ntn, buyer_name, buyer_address, status, 
        total_amount, tax_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.tenantId, invoiceType, invoiceDate, invoiceRefNo, 
        buyerNTNCNIC, buyerBusinessName, buyerAddress, status || 'Draft', 
        totalAmount, taxAmount
      ]
    );

    const invoiceId = result.insertId;

    // 2. Insert Items
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items as InvoiceItem[]) {
        await db.query(
          `INSERT INTO invoice_items (
            invoice_id, hs_code, product_code, description, 
            quantity, price, uom, tax_rate, sales_tax, total
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            invoiceId, item.hsCode, item.prodCode, item.name, 
            item.qty, item.price, item.uoM, item.tax_rate, 
            item.salesTaxApplicable, item.totalValues
          ]
        );
      }
    }

    return NextResponse.json({ message: "Invoice saved successfully", id: invoiceId, status });

  } catch (error: unknown) {
    console.error("DATABASE_ERROR:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create invoice";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}