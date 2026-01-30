import axios from 'axios';
import https from 'https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// 1. Invoice Item ke liye interface define karein
interface FBRInvoiceItem {
  hs_code: string;
  product_description: string;
  quantity: number;
  rate: number;
  value_excluding_st?: number;
  sales_tax_applicable?: number;
}

// 2. Main Invoice ke liye interface define karein
interface FBRInvoice {
  invoice_type?: string;
  invoice_date: string | Date;
  seller_ntn?: string;
  seller_name: string;
  ntn_cnic?: string;
}

// 3. Service function ko typed parameters ke saath update karein
export async function submitInvoiceToFBR(
  invoice: FBRInvoice, 
  items: FBRInvoiceItem[], 
  apiUrl: string, 
  bearerToken: string
) {
  const payload = {
    invoiceType: invoice.invoice_type || "Sale Invoice",
    invoiceDate: new Date(invoice.invoice_date).toISOString().split('T')[0],
    sellerNTNCNIC: invoice.seller_ntn?.replace(/-/g, "").substring(0, 7),
    sellerBusinessName: invoice.seller_name,
    buyerNTNCNIC: invoice.ntn_cnic || "9999999999999",
    items: items.map(item => ({
      hsCode: item.hs_code,
      productDescription: item.product_description,
      quantity: item.quantity,
      rate: item.rate,
      valueExcludingSalesTax: item.value_excluding_st || (item.quantity * item.rate),
      salesTaxApplicable: item.sales_tax_applicable || 0,
      netValueExcludingST: item.value_excluding_st || (item.quantity * item.rate)
    }))
  };

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: { 
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      },
      httpsAgent
    });
    return { success: true, data: response.data };
  } catch (error: unknown) {
    // 4. Catch block mein 'any' ki jagah 'unknown' use karein
    if (axios.isAxiosError(error)) {
      return { 
        success: false, 
        reason: error.response?.data?.message || error.message 
      };
    }
    return { 
      success: false, 
      reason: error instanceof Error ? error.message : "An unknown error occurred" 
    };
  }
}