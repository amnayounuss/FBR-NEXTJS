import { NextResponse } from 'next/server';
import db from '@/lib/db';
import jwt from 'jsonwebtoken';

const verifyAuth = (req: Request) => {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) throw new Error("Unauthorized");
  return jwt.verify(token, process.env.JWT_SECRET!) as any;
};

export async function POST(req: Request) {
  try {
    const user = verifyAuth(req);
    const body = await req.json();
    const { internal_invoice_number, invoice_date, buyer_id, items } = body;

    // Strict Validation
    if (!items || items.length === 0) throw new Error("Invoice must have items.");

    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      // Get Seller Details
      const [tenants]: any = await conn.query("SELECT business_name, ntn FROM tenants WHERE id = ?", [user.tenant_id]);
      const seller = tenants[0];

      const [resInv]: any = await conn.query(
        `INSERT INTO invoices (tenant_id, buyer_id, internal_invoice_number, invoice_date, seller_name, seller_ntn, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'DRAFT')`,
        [user.tenant_id, buyer_id, internal_invoice_number, invoice_date, seller.business_name, seller.ntn]
      );

      const invoiceId = resInv.insertId;

      for (const item of items) {
        await conn.query(
          `INSERT INTO invoice_items (invoice_id, hs_code, product_description, quantity, rate) VALUES (?, ?, ?, ?, ?)`,
          [invoiceId, item.hs_code, item.description, item.quantity, item.unit_price]
        );
      }

      await conn.commit();
      return NextResponse.json({ message: "Draft Saved", id: invoiceId });
    } catch (err: any) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}