import { NextResponse } from 'next/server';
import db from '@/lib/db';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';

interface FBRItem {
  hsCode: string;
  productDescription: string;
  rate: string;
  uoM: string;
  quantity: number;
  totalValues: number;
  valueSalesExcludingST: number;
  fixedNotifiedValueOrRetailPrice: number;
  salesTaxApplicable: number;
  salesTaxWithheldAtSource: number;
  extraTax: string;
  furtherTax: number;
  sroScheduleNo: string;
  fedPayable: number;
  discount: number;
  saleType: string;
  sroItemSerialNo: string;
}

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

// Settings table mein ab seller details bhi honi chahiye
interface FbrSettings extends RowDataPacket {
  fbr_api_url: string;
  fbr_access_token: string;
  seller_ntn?: string;
  seller_name?: string;
  seller_address?: string;
  seller_province?: string;
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
    const { status, items, scenarioId } = body; // Scenario ID ab frontend se aayega

    if (status === "Submitted") {
      try {
        const [settingsRows] = await db.query<FbrSettings[]>("SELECT * FROM settings LIMIT 1");
        
        if (!settingsRows || settingsRows.length === 0 || !settingsRows[0].fbr_api_url) {
          return NextResponse.json({ error: "FBR API settings missing in Setup." }, { status: 400 });
        }

        const settings = settingsRows[0];
        const fbrUrl = settings.fbr_api_url.trim();
        const fbrToken = settings.fbr_access_token.trim();

        // DYNAMIC PAYLOAD (No hardcoded strings)
        const fbrPayload = {
          invoiceType: body.invoiceType,
          invoiceDate: body.invoiceDate,
          sellerNTNCNIC: settings.seller_ntn || "0000000-0", // Setup se aayega
          sellerBusinessName: settings.seller_name || "Business Name",
          sellerProvince: settings.seller_province || "Punjab",
          sellerAddress: settings.seller_address || "Address",
          buyerNTNCNIC: body.buyerNTNCNIC,
          buyerBusinessName: body.buyerBusinessName,
          buyerProvince: body.buyerProvince || "Punjab",
          buyerAddress: body.buyerAddress,
          buyerRegistrationType: body.buyerRegistrationType || "Registered",
          invoiceRefNo: body.invoiceRefNo,
          scenarioId: scenarioId || "SN000", // Dynamic from Frontend
          items: (items as InvoiceItemPayload[]).map((item): FBRItem => ({
            hsCode: item.hsCode,
            productDescription: item.name,
            rate: `${item.tax_rate}%`,
            uoM: item.uoM,
            quantity: item.qty,
            totalValues: item.totalValues,
            valueSalesExcludingST: item.qty * item.price,
            fixedNotifiedValueOrRetailPrice: 0,
            salesTaxApplicable: item.salesTaxApplicable,
            salesTaxWithheldAtSource: 0,
            extraTax: String(item.extraTax || ""),
            furtherTax: item.furtherTax || 0,
            sroScheduleNo: "",
            fedPayable: 0,
            discount: item.discount || 0,
            saleType: item.saleType,
            sroItemSerialNo: ""
          }))
        };

        const fbrRes = await fetch(fbrUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${fbrToken}`,
            'Content-Type': 'application/json; charset=UTF-8'
          },
          body: JSON.stringify(fbrPayload)
        });

        const fbrData = (await fbrRes.json()) as FbrErrorResponse;

        if (!fbrRes.ok) {
          const errorMsg = fbrData.Errors?.[0]?.Message || fbrData.message || fbrData.Message || "FBR Rejected";
          return NextResponse.json({ error: errorMsg }, { status: 400 });
        }

      } catch (fbrErr: unknown) {
        const errorMsg = fbrErr instanceof Error ? fbrErr.message : "FBR connection failed";
        return NextResponse.json({ error: `Network Error: ${errorMsg}` }, { status: 502 });
      }
    }

    // Database Update
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
    return NextResponse.json({ error: "Operation Failed" }, { status: 500 });
  }
}