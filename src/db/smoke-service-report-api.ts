import assert from "node:assert/strict";
import type { FormRuntimeElement } from "../modules/forms/types.js";
import { executePublishedOperationByKey } from "../modules/operations/runtime.js";
import { closePool } from "./pool.js";
import { seedServiceReportInstance } from "./seed-service-report.js";

const orderAction: FormRuntimeElement = {
  kind: "lookup",
  controlType: "lookup",
  name: "lookup_1",
  label: "Auftragsdaten laden",
  properties: {},
  ref: "service-report.erp-orders",
  args: ["order_number"],
  bind: ["customer", "customer_order_status", "customer_master_status"],
};

const productAction: FormRuntimeElement = {
  kind: "lookup",
  controlType: "lookup",
  name: "lookup_1",
  label: "Produktdaten laden",
  properties: {},
  ref: "service-report.erp-products",
  args: ["product_number"],
  bind: ["product_name", "production_line", "product_status"],
};

const batchAction: FormRuntimeElement = {
  kind: "action",
  controlType: "action",
  name: "action_2",
  label: "Batchnummer erzeugen",
  properties: {},
  ref: "service-report.erp-batches",
  args: ["product_number"],
  bind: ["batch_id", "batch_status"],
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

const productsResponse = {
  items: [
    { id: "867e3340-0909-460d-80df-34f3e18fd996", name: "Batch Product A", valid: true, product_type: "batch" },
    { id: "c4d628dc-0532-4500-9c7f-c014e8cfa33", name: "Serial Product B", valid: true, product_type: "serial" },
  ],
};

const batchResponse = {
  id: "88888888-1111-1111-1111-111111111111",
  product_id: "867e3340-0909-460d-80df-34f3e18fd996",
  batch_number: "B-867E3340-TEST1",
  status: "ordered",
  created_at: "2026-04-13T19:00:00.000Z",
};

const createFetchJsonMock = (input?: {
  customers?: unknown;
  customerOrders?: unknown;
  products?: unknown;
  batch?: unknown;
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

    if (url.includes("/api/products")) {
      return input?.products ?? productsResponse;
    }

    if (url.includes("/api/batches")) {
      return input?.batch ?? batchResponse;
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
        action: orderAction,
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
        action: orderAction,
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
        action: orderAction,
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
        action: orderAction,
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

    const productDropdownResult = await executePublishedOperationByKey({
      operationKey: "service-report.erp-products",
      executionInput: {
        action: productAction,
        fieldValues: {},
        templateKey: "production-report",
      },
      runtimeOverrides: {
        fetchJson: createFetchJsonMock(),
      },
    });

    const productOptions = JSON.parse(productDropdownResult.fieldValues.product_options_json ?? "[]");
    assert.equal(productDropdownResult.actionState.type, "info");
    assert.equal(productDropdownResult.actionState.title, "Produktliste geladen");
    assert.equal(productOptions.length, 1);
    assert.equal(productOptions[0]?.value, "867e3340-0909-460d-80df-34f3e18fd996");
    assert.match(productOptions[0]?.label ?? "", /Batch Product A/);
    assert.doesNotMatch(JSON.stringify(productOptions), /Serial Product B/);

    const selectedProductResult = await executePublishedOperationByKey({
      operationKey: "service-report.erp-products",
      executionInput: {
        action: productAction,
        fieldValues: {
          product_number: "867e3340-0909-460d-80df-34f3e18fd996",
        },
        templateKey: "production-report",
      },
      runtimeOverrides: {
        fetchJson: createFetchJsonMock(),
      },
    });

    assert.equal(selectedProductResult.actionState.type, "info");
    assert.equal(selectedProductResult.actionState.title, "Produktdaten geladen");
    assert.equal(selectedProductResult.fieldValues.product_name, "Batch Product A");
    assert.equal(selectedProductResult.fieldValues.production_line, "batch");
    assert.equal(selectedProductResult.fieldValues.product_status, "gueltig");
    assert.equal(selectedProductResult.fieldValues.batch_id ?? "", "");
    assert.equal(selectedProductResult.fieldValues.batch_status ?? "", "");

    const productNotFoundResult = await executePublishedOperationByKey({
      operationKey: "service-report.erp-products",
      executionInput: {
        action: productAction,
        fieldValues: {
          product_number: "P-unbekannt",
        },
        templateKey: "production-report",
      },
      runtimeOverrides: {
        fetchJson: createFetchJsonMock(),
      },
    });

    assert.equal(productNotFoundResult.actionState.type, "error");
    assert.equal(productNotFoundResult.actionState.title, "Produkt nicht gefunden");

    const batchCreateResult = await executePublishedOperationByKey({
      operationKey: "service-report.erp-batches",
      executionInput: {
        action: batchAction,
        fieldValues: {
          product_number: "867e3340-0909-460d-80df-34f3e18fd996",
        },
        templateKey: "production-report",
      },
      runtimeOverrides: {
        fetchJson: createFetchJsonMock(),
      },
    });

    assert.equal(batchCreateResult.actionState.type, "info");
    assert.equal(batchCreateResult.actionState.title, "Batchnummer erzeugt");
    assert.equal(batchCreateResult.fieldValues.batch_id, "B-867E3340-TEST1");
    assert.equal(batchCreateResult.fieldValues.batch_status, "ordered");

    const batchSerialRejectedResult = await executePublishedOperationByKey({
      operationKey: "service-report.erp-batches",
      executionInput: {
        action: batchAction,
        fieldValues: {
          product_number: "c4d628dc-0532-4500-9c7f-c014e8cfa33",
        },
        templateKey: "production-report",
      },
      runtimeOverrides: {
        fetchJson: createFetchJsonMock(),
      },
    });

    assert.equal(batchSerialRejectedResult.actionState.type, "error");
    assert.equal(batchSerialRejectedResult.actionState.title, "Batchnummer nicht moeglich");

    const batchMissingProductResult = await executePublishedOperationByKey({
      operationKey: "service-report.erp-batches",
      executionInput: {
        action: batchAction,
        fieldValues: {},
        templateKey: "production-report",
      },
      runtimeOverrides: {
        fetchJson: createFetchJsonMock(),
      },
    });

    assert.equal(batchMissingProductResult.actionState.type, "error");
    assert.equal(batchMissingProductResult.actionState.title, "Produktnummer fehlt");
  } finally {
    await closePool();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
