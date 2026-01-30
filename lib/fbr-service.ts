import axios from 'axios';
import https from 'https';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export async function submitInvoiceToFBR(invoice: any, items: any[], apiUrl: string, bearerToken: string) {
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
      valueExcludingSalesTax: item.value_excluding_st,
      salesTaxApplicable: item.sales_tax_applicable,
      netValueExcludingST: item.value_excluding_st
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
  } catch (error: any) {
    return { 
      success: false, 
      reason: error.response?.data?.message || error.message 
    };
  }
}