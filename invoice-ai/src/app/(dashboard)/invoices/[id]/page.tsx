import { notFound } from "next/navigation";
import { getInvoiceReviewData } from "@/lib/invoices/review-data";
import { InvoiceReview } from "@/components/invoice/invoice-review";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getInvoiceReviewData(id);
  if (!data) notFound();

  return <InvoiceReview invoice={data.invoice} suppliers={data.suppliers} accounts={data.accounts} />;
}
