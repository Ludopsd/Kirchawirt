-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'AP_CLERK');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('UPLOADED', 'EXTRACTING', 'EXTRACTED', 'PENDING_REVIEW', 'CONFIRMED', 'BOOKED', 'SAP_ERROR');

-- CreateEnum
CREATE TYPE "BoundingBoxSource" AS ENUM ('NONE', 'LLM_APPROXIMATE', 'OCR_MATCHED');

-- CreateEnum
CREATE TYPE "BoundingBoxConfidence" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "SapConnectorType" AS ENUM ('EXPORT_CSV', 'ODATA');

-- CreateEnum
CREATE TYPE "SapExportStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'AP_CLERK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ibans" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "taxId" TEXT,
    "vatId" TEXT,
    "kreditorenkonto" TEXT NOT NULL,
    "defaultSachkonto" TEXT,
    "street" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'DE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChartOfAccountsEntry" (
    "id" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ChartOfAccountsEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "pageCount" INTEGER NOT NULL DEFAULT 1,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UPLOADED',
    "uploadedByUserId" TEXT NOT NULL,
    "matchedSupplierId" TEXT,
    "supplierMatchConfidence" DOUBLE PRECISION,
    "supplierMatchMethod" TEXT,
    "vendorName" TEXT,
    "invoiceNumber" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "grossAmount" DECIMAL(12,2),
    "netAmount" DECIMAL(12,2),
    "iban" TEXT,
    "taxId" TEXT,
    "kreditorenkonto" TEXT,
    "sachkonto" TEXT,
    "sapDocumentNumber" TEXT,
    "sapErrorMessage" TEXT,
    "extractionRaw" JSONB,
    "extractionError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extractedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "confirmedByUserId" TEXT,
    "bookedAt" TIMESTAMP(3),

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceVatEntry" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "vatAmount" DECIMAL(12,2) NOT NULL,
    "taxCode" TEXT,

    CONSTRAINT "InvoiceVatEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLineItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "vatRate" DECIMAL(5,2) NOT NULL,
    "sachkonto" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractedField" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "rawValue" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "pageNumber" INTEGER NOT NULL DEFAULT 1,
    "boxX" DOUBLE PRECISION,
    "boxY" DOUBLE PRECISION,
    "boxWidth" DOUBLE PRECISION,
    "boxHeight" DOUBLE PRECISION,
    "boundingBoxSource" "BoundingBoxSource" NOT NULL DEFAULT 'NONE',
    "boundingBoxConfidence" "BoundingBoxConfidence" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtractedField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SapExportRecord" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "connectorType" "SapConnectorType" NOT NULL,
    "status" "SapExportStatus" NOT NULL,
    "requestPayload" JSONB NOT NULL,
    "responsePayload" JSONB,
    "sapDocumentNumber" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SapExportRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Supplier_normalizedName_idx" ON "Supplier"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "ChartOfAccountsEntry_accountNumber_key" ON "ChartOfAccountsEntry"("accountNumber");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "ExtractedField_invoiceId_idx" ON "ExtractedField"("invoiceId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_matchedSupplierId_fkey" FOREIGN KEY ("matchedSupplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceVatEntry" ADD CONSTRAINT "InvoiceVatEntry_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractedField" ADD CONSTRAINT "ExtractedField_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SapExportRecord" ADD CONSTRAINT "SapExportRecord_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
