import { NextResponse } from 'next/server';
import db from '@/lib/db';
import jwt from 'jsonwebtoken';
import { submitInvoiceToFBR } from '@/lib/fbr-service';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const invoiceId = params.id;
    const { environment } = await req.json(); // 'sandbox' or 'production'

    // 1. Get Tenant Settings (API URL & Token)
    const [settings]: any = await db.query(
      `SELECT fbr_sandbox_api_url, fbr_sandbox_bearer_token, fbr_prod_api_url, fbr_prod_bearer_token 
       FROM tenants WHERE id = ?`,
      [decoded.tenant_id]
    );

    const config = settings[0];
    const apiUrl = environment === 'production' ? config.fbr_prod_api_url : config.fbr_sandbox_api_url;
    const bearerToken = environment === 'production' ? config.fbr_prod_bearer_token : config.fbr_sandbox_bearer_token;

    if (!apiUrl || !bearerToken) {
      return NextResponse.json({ error: `FBR ${environment} settings are missing.` }, { status: 400 });
    }

    // 2. Get Invoice & Items Data
    const [invoices]: any = await db.query(
      `SELECT i.*, b.ntn_cnic, b.buyer_name FROM invoices i 
       JOIN buyers b ON i.buyer_id = b.id WHERE i.id = ? AND i.tenant_id = ?`,
      [invoiceId, decoded.tenant_id]
    );

    if (!invoices.length) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const [items]: any = await db.query("SELECT * FROM invoice_items WHERE invoice_id = ?", [invoiceId]);

    // 3. Submit to FBR using our Service
    const result = await submitInvoiceToFBR(invoices[0], items, apiUrl, bearerToken);

    if (result.success) {
      // Update Database on Success
      await db.query(
        `UPDATE invoices SET status='APPROVED', fbr_invoice_number=?, fbr_qr_payload=?, submitted_at=NOW() WHERE id=?`,
        [result.data.InvoiceNumber, result.data.QRLink, invoiceId]
      );
      return NextResponse.json({ message: "Successfully submitted to FBR", data: result.data });
    } else {
      // Update Database on Failure
      await db.query(
        `UPDATE invoices SET status='REJECTED', rejection_reason=? WHERE id=?`,
        [result.reason?.substring(0, 255), invoiceId]
      );
      return NextResponse.json({ error: "FBR Rejected", details: result.reason }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}