import { NextResponse } from 'next/server';
import db from '@/lib/db';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';

// 1. Types define karein taake ESLint issues na aayen
interface InvoiceItemPayload {
  hsCode: string;
  prodCode: string;
  name: string;
  qty: number;
  price: number;
  uoM: string;
  tax_rate: number;
  discount: number;
  furtherTax: number;
  extraTax: number;
  totalValues: number;
  salesTaxApplicable: number;
  saleType: string;
}

interface FbrSettings extends RowDataPacket {
  fbr_api_url: string;
  fbr_access_token: string;
}

interface FbrErrorResponse {
  Errors?: Array<{ Message: string }>;
  message?: string;
  Message?: string;
}

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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, items } = body;

    // --- STEP 1: FBR API HIT (Directly using setup data) ---
    if (status === "Submitted") {
      try {
        // Table exists check and fetch
        const [settingsRows] = await db.query<FbrSettings[]>("SELECT fbr_api_url, fbr_access_token FROM settings LIMIT 1");
        
        if (!settingsRows || settingsRows.length === 0 || !settingsRows[0].fbr_api_url) {
          return NextResponse.json({ error: "FBR API settings missing in Dashboard Setup." }, { status: 400 });
        }

        const fbrUrl = settingsRows[0].fbr_api_url.trim();
        const fbrToken = settingsRows[0].fbr_access_token.trim();

        // Exactly like HTML project logic
        const fbrRes = await fetch(fbrUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${fbrToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        const fbrData = (await fbrRes.json()) as FbrErrorResponse;

        if (!fbrRes.ok) {
          // Extracting exact error from FBR
          const errorMsg = fbrData.Errors?.[0]?.Message || fbrData.message || fbrData.Message || "FBR Rejected: Validation Failed";
          return NextResponse.json({ error: errorMsg }, { status: 400 });
        }
      } catch (fbrErr: unknown) {
        // Handling ESLint type safety for catch
        const errorMsg = fbrErr instanceof Error ? fbrErr.message : "FBR Server not responding";
        return NextResponse.json({ error: `Connection Issue: ${errorMsg}` }, { status: 502 });
      }
    }

    // --- STEP 2: DB UPDATE (Only if FBR succeeded) ---
    await db.query(
      `UPDATE invoices SET invoice_type=?, invoice_date=?, buyer_ntn=?, buyer_name=?, buyer_address=?, status=?, total_amount=?, tax_amount=? WHERE id=?`,
      [body.invoiceType, body.invoiceDate, body.buyerNTNCNIC, body.buyerBusinessName, body.buyerAddress, status, body.totalAmount, body.taxAmount, id]
    );

    await db.query("DELETE FROM invoice_items WHERE invoice_id = ?", [id]);
    const itemsArray = items as InvoiceItemPayload[];
    for (const item of itemsArray) {
      await db.query(
        `INSERT INTO invoice_items (invoice_id, hs_code, product_code, description, quantity, price, uom, tax_rate, sales_tax, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, item.hsCode, item.prodCode, item.name, item.qty, item.price, item.uoM, item.tax_rate, item.salesTaxApplicable, item.totalValues]
      );
    }

    return NextResponse.json({ message: "Invoice processed successfully" });
  } catch (error) {
    console.error("GLOBAL_PUT_ERROR:", error);
    return NextResponse.json({ error: "Database operation failed" }, { status: 500 });
  }
}