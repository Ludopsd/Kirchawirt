import "server-only";
import type { SapConnector } from "./connector";
import { ExportConnector } from "./export-connector";
import { ODataConnector } from "./odata-connector";

export function getSapConnector(): SapConnector {
  const type = process.env.SAP_CONNECTOR || "export";
  switch (type) {
    case "odata":
      return new ODataConnector();
    case "export":
    default:
      return new ExportConnector();
  }
}
