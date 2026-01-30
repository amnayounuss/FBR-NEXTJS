import { NextResponse } from 'next/server';
import db from '@/lib/db';
import jwt from 'jsonwebtoken';
import { submitInvoiceToFBR } from '@/lib/fbr-service';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 1. JWT Payload ke liye interface
interface AuthUser {
  user_id: number;
  tenant_id: number;
  email: string;
}

// 2. Tenant Settings ke liye interface
interface TenantSettings extends RowDataPacket {
  fbr_sandbox_api_url: string;
  fbr_sandbox_bearer_token: string;
  fbr_prod_api_url: string;
  fbr_prod_bearer_token: string;
}

// 3. Invoice aur Buyer data ke liye interface
interface InvoiceRow extends RowDataPacket {
  id: number;
  tenant_id: number;
  buyer_id: number;
  ntn_cnic: string;
  buyer_name: string;
  invoice_date: string;
  seller_name: string;
  seller_ntn: string;
  invoice_type?: string;
}

// 4. Invoice Item ke liye interface (any se bachne ke liye)
interface InvoiceItemRow extends RowDataPacket {
  hs_code: string;
  product_description: string;
  quantity: number;
  rate: number;
  value_excluding_st?: number;
  sales_tax_applicable?: number;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as unknown as AuthUser;
    const invoiceId = params.id;
    const { environment } = await req.json() as { environment: 'sandbox' | 'production' };

    // 1. Get Tenant Settings
    const [settings] = await db.query<TenantSettings[]>(
      `SELECT fbr_sandbox_api_url, fbr_sandbox_bearer_token, fbr_prod_api_url, fbr_prod_bearer_token 
       FROM tenants WHERE id = ?`,
      [decoded.tenant_id]
    );

    const config = settings[0];
    if (!config) return NextResponse.json({ error: "Tenant settings not found" }, { status: 404 });

    const apiUrl = environment === 'production' ? config.fbr_prod_api_url : config.fbr_sandbox_api_url;
    const bearerToken = environment === 'production' ? config.fbr_prod_bearer_token : config.fbr_sandbox_bearer_token;

    if (!apiUrl || !bearerToken) {
      return NextResponse.json({ error: `FBR ${environment} settings are missing.` }, { status: 400 });
    }

    // 2. Get Invoice & Items Data
    const [invoices] = await db.query<InvoiceRow[]>(
      `SELECT i.*, b.ntn_cnic, b.buyer_name FROM invoices i 
       JOIN buyers b ON i.buyer_id = b.id WHERE i.id = ? AND i.tenant_id = ?`,
      [invoiceId, decoded.tenant_id]
    );

    if (!invoices.length) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    // items ko RowDataPacket ki jagah InvoiceItemRow[] type dein
    const [items] = await db.query<InvoiceItemRow[]>(
      "SELECT * FROM invoice_items WHERE invoice_id = ?", 
      [invoiceId]
    );

    // 3. Submit to FBR using our Service
    // Ab 'items' ke pass sahi type hai, isliye 'as any[]' likhne ki zaroorat nahi
    const result = await submitInvoiceToFBR(invoices[0], items, apiUrl, bearerToken);

    if (result.success) {
      await db.query<ResultSetHeader>(
        `UPDATE invoices SET status='APPROVED', fbr_invoice_number=?, fbr_qr_payload=?, submitted_at=NOW() WHERE id=?`,
        [result.data.InvoiceNumber, result.data.QRLink, invoiceId]
      );
      return NextResponse.json({ message: "Successfully submitted to FBR", data: result.data });
    } else {
      await db.query<ResultSetHeader>(
        `UPDATE invoices SET status='REJECTED', rejection_reason=? WHERE id=?`,
        [result.reason?.substring(0, 255), invoiceId]
      );
      return NextResponse.json({ error: "FBR Rejected", details: result.reason }, { status: 400 });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}