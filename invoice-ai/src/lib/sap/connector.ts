export interface SupplierInvoicePostingPayload {
  invoiceId: string;
  companyCode: string; // SAP BUKRS
  kreditorenkonto: string; // Kreditorenkonto / SAP LIFNR
  sachkonto: string; // Sachkonto / SAP HKONT
  invoiceNumber: string;
  invoiceDate: string; // ISO 8601
  postingDate: string; // ISO 8601
  dueDate: string | null; // ISO 8601
  currency: string;
  grossAmount: number;
  netAmount: number;
  vatEntries: { rate: number; netAmount: number; vatAmount: number; taxCode: string | null }[];
  vendorName: string;
  vendorTaxId: string | null;
  vendorIban: string | null;
  lineItems: {
    description: string;
    sachkonto: string | null;
    netAmount: number;
    vatRate: number;
  }[];
  reference: string | null;
}

export interface SapPostingResult {
  success: boolean;
  sapDocumentNumber?: string;
  errorCode?: string;
  errorMessage?: string;
  rawResponse?: unknown;
}

export interface SapConnector {
  readonly name: string;
  readonly type: "EXPORT_CSV" | "ODATA";
  postSupplierInvoice(payload: SupplierInvoicePostingPayload): Promise<SapPostingResult>;
  testConnection(): Promise<{ ok: boolean; message?: string }>;
}
