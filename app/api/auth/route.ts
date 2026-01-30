import { NextResponse } from 'next/server';
import db from '@/lib/db';
import jwt from 'jsonwebtoken';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 1. JWT Payload ke liye interface
interface AuthUser {
  user_id: number;
  tenant_id: number;
  email: string;
}

// 2. Tenant details ke liye interface (RowDataPacket extend karna zaroori hai)
interface TenantRow extends RowDataPacket {
  business_name: string;
  ntn: string;
}

// 3. Invoice items ke liye interface
interface InvoiceItem {
  hs_code: string;
  description: string;
  quantity: number;
  unit_price: number;
}

// Helper function to verify token with proper typing
const verifyAuth = (req: Request): AuthUser => {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) throw new Error("Unauthorized");
  
  // jwt.verify ko explicitly AuthUser type mein cast karein
  return jwt.verify(token, process.env.JWT_SECRET!) as unknown as AuthUser;
};

export async function POST(req: Request) {
  try {
    const user = verifyAuth(req);
    const body = await req.json();
    
    // Body variables ko type dein
    const { internal_invoice_number, invoice_date, buyer_id, items } = body as {
      internal_invoice_number: string;
      invoice_date: string;
      buyer_id: number;
      items: InvoiceItem[];
    };

    // Strict Validation
    if (!items || items.length === 0) throw new Error("Invoice must have items.");

    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      // 4. Query mein TenantRow[] ka istemal karein (any ki jagah)
      const [tenants] = await conn.query<TenantRow[]>(
        "SELECT business_name, ntn FROM tenants WHERE id = ?", 
        [user.tenant_id]
      );
      
      const seller = tenants[0];
      if (!seller) throw new Error("Seller (tenant) not found.");

      // 5. INSERT query ke liye ResultSetHeader ka istemal karein
      const [resInv] = await conn.query<ResultSetHeader>(
        `INSERT INTO invoices (tenant_id, buyer_id, internal_invoice_number, invoice_date, seller_name, seller_ntn, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'DRAFT')`,
        [user.tenant_id, buyer_id, internal_invoice_number, invoice_date, seller.business_name, seller.ntn]
      );

      const invoiceId = resInv.insertId;

      for (const item of items) {
        await conn.query<ResultSetHeader>(
          `INSERT INTO invoice_items (invoice_id, hs_code, product_description, quantity, rate) VALUES (?, ?, ?, ?, ?)`,
          [invoiceId, item.hs_code, item.description, item.quantity, item.unit_price]
        );
      }

      await conn.commit();
      return NextResponse.json({ message: "Draft Saved", id: invoiceId });
    } catch (err: unknown) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error: unknown) {
    // 6. Catch blocks mein 'any' ki jagah 'unknown' behtar practice hai
    const errorMessage = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}