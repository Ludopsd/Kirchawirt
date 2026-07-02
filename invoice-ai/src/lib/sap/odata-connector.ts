import "server-only";
import type { SapConnector, SapPostingResult, SupplierInvoicePostingPayload } from "./connector";

/**
 * Anbindung an eine echte SAP S/4HANA OData-Schnittstelle (z.B. API_SUPPLIERINVOICE_PROCESS_SRV).
 *
 * Noch nicht implementiert — es lagen bei der Erstellung keine echten SAP-Zugangsdaten oder eine
 * bestätigte Schnittstellenbeschreibung vor. Sobald diese vorliegen:
 *   1. SAP_ODATA_BASE_URL / SAP_ODATA_USERNAME / SAP_ODATA_PASSWORD (oder OAuth2 Client-Credentials) in .env eintragen.
 *   2. Das exakte Payload-Mapping von SupplierInvoicePostingPayload auf den OData-Entity-Typ des gewählten
 *      Service (z.B. A_SupplierInvoice) ergänzen, inkl. CSRF-Token-Handling für POST-Requests.
 *   3. postSupplierInvoice() unten implementieren; testConnection() sollte einen einfachen GET auf den
 *      Service-Root oder $metadata durchführen.
 * Der Rest der App muss dafür nicht verändert werden — SAP_CONNECTOR=odata in .env genügt, um umzuschalten.
 */
export class ODataConnector implements SapConnector {
  readonly name = "SAP OData API";
  readonly type = "ODATA" as const;

  private readonly baseUrl = process.env.SAP_ODATA_BASE_URL;
  private readonly username = process.env.SAP_ODATA_USERNAME;
  private readonly password = process.env.SAP_ODATA_PASSWORD;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Payload-Mapping folgt, sobald echte SAP-Zugangsdaten vorliegen (siehe Klassenkommentar).
  async postSupplierInvoice(payload: SupplierInvoicePostingPayload): Promise<SapPostingResult> {
    if (!this.baseUrl || !this.username || !this.password) {
      return {
        success: false,
        errorCode: "SAP_ODATA_NOT_CONFIGURED",
        errorMessage:
          "SAP-OData-Zugangsdaten fehlen (SAP_ODATA_BASE_URL/_USERNAME/_PASSWORD). " +
          "Bitte in .env eintragen oder SAP_CONNECTOR=export verwenden.",
      };
    }
    return {
      success: false,
      errorCode: "SAP_ODATA_NOT_IMPLEMENTED",
      errorMessage:
        "Der OData-Connector ist noch nicht implementiert (siehe Kommentar in src/lib/sap/odata-connector.ts). " +
        "Payload-Mapping und CSRF-Token-Handling für den konkreten SAP-Service müssen noch ergänzt werden.",
    };
  }

  async testConnection(): Promise<{ ok: boolean; message?: string }> {
    if (!this.baseUrl || !this.username || !this.password) {
      return { ok: false, message: "SAP-OData-Zugangsdaten sind nicht vollständig konfiguriert." };
    }
    return { ok: false, message: "OData-Connector ist noch nicht implementiert." };
  }
}
