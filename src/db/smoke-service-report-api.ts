import assert from "node:assert/strict";
import type { FormRuntimeElement } from "../modules/forms/types.js";
import { executePublishedOperationByKey } from "../modules/operations/runtime.js";
import { closePool } from "./pool.js";
import { seedServiceReportInstance } from "./seed-service-report.js";

const action: FormRuntimeElement = {
  kind: "action",
  controlType: "action",
  name: "load_service_order",
  label: "Auftragsdaten laden",
  properties: {},
  ref: "service-report.erp-orders",
  args: ["order_number"],
  bind: ["customer", "customer_order_status", "customer_master_status"],
};

const customersResponse = {
  items: [
    { id: "customer-a", name: "Customer A", valid: true },
  ],
};

const customerOrdersResponse = {
  items: [
    { order_number: "O-ca26a72f-1", status: "received" },
  ],
};

const createFetchJsonMock = (input?: {
  customers?: unknown;
  customerOrders?: unknown;
  error?: Error;
}) => {
  return async ({ url }: { url: string }) => {
    if (input?.error) {
      throw input.error;
    }

    if (url.includes("/api/customers")) {
      return input?.customers ?? customersResponse;
    }

    if (url.includes("/api/customer-orders")) {
      return input?.customerOrders ?? customerOrdersResponse;
    }

    throw new Error(`Unerwartete URL im API-Test: ${url}`);
  };
};

const main = async (): Promise<void> => {
  await seedServiceReportInstance();

  try {
    const dropdownResult = await executePublishedOperationByKey({
      operationKey: "service-report.erp-orders",
      executionInput: {
        action,
        fieldValues: {},
        templateKey: "service-report",
      },
      runtimeOverrides: {
        fetchJson: createFetchJsonMock(),
      },
    });

    const options = JSON.parse(dropdownResult.fieldValues.service_order_options_json ?? "[]");
    assert.equal(dropdownResult.actionState.type, "info");
    assert.equal(dropdownResult.actionState.title, "Auftragsliste geladen");
    assert.equal(options.length, 1);
    assert.equal(options[0]?.value, "O-ca26a72f-1");
    assert.match(options[0]?.label ?? "", /Customer A/);

    const selectedOrderResult = await executePublishedOperationByKey({
      operationKey: "service-report.erp-orders",
      executionInput: {
        action,
        fieldValues: {
          order_number: "O-ca26a72f-1",
        },
        templateKey: "service-report",
      },
      runtimeOverrides: {
        fetchJson: createFetchJsonMock(),
      },
    });

    assert.equal(selectedOrderResult.actionState.type, "info");
    assert.equal(selectedOrderResult.actionState.title, "Auftragsdaten geladen");
    assert.equal(selectedOrderResult.fieldValues.customer, "Customer A");
    assert.equal(selectedOrderResult.fieldValues.customer_order_status, "received");
    assert.equal(selectedOrderResult.fieldValues.customer_master_status, "gueltig");

    const notFoundResult = await executePublishedOperationByKey({
      operationKey: "service-report.erp-orders",
      executionInput: {
        action,
        fieldValues: {
          order_number: "O-unbekannt",
        },
        templateKey: "service-report",
      },
      runtimeOverrides: {
        fetchJson: createFetchJsonMock(),
      },
    });

    assert.equal(notFoundResult.actionState.type, "error");
    assert.equal(notFoundResult.actionState.title, "Auftrag nicht gefunden");

    const erpUnavailableResult = await executePublishedOperationByKey({
      operationKey: "service-report.erp-orders",
      executionInput: {
        action,
        fieldValues: {},
        templateKey: "service-report",
      },
      runtimeOverrides: {
        fetchJson: createFetchJsonMock({
          error: new Error("ERP-SIM ist aktuell nicht erreichbar."),
        }),
      },
    });

    assert.equal(erpUnavailableResult.actionState.type, "error");
    assert.equal(erpUnavailableResult.actionState.title, "ERP-SIM nicht erreichbar");
    assert.match(erpUnavailableResult.actionState.message, /ERP-SIM/);
  } finally {
    await closePool();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
