import { env } from "../../config/env.js";
import type { NextFormElement } from "./types.js";

export type NextFormFieldValues = Record<string, string>;

export type NextFormActionState = {
  type: "info" | "error";
  title: string;
  message: string;
  actionName: string;
};

type ErpCustomer = {
  id: string;
  name: string;
  valid: boolean;
};

type ErpCustomerOrder = {
  id: string;
  customer_id: string;
  order_number: string;
  status: string;
  created_at: string;
};

const normalizeText = (value: string | undefined): string => value?.trim() ?? "";

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`ERP-SIM antwortete mit ${response.status}.`);
  }

  return (await response.json()) as T;
};

const lookupCustomerByOrderNumber = async (orderNumber: string): Promise<{ customer: ErpCustomer; order: ErpCustomerOrder } | undefined> => {
  const customersResponse = await fetchJson<{ items: ErpCustomer[] }>(`${env.erpSimBaseUrl}/api/customers?valid=true`);
  const normalizedOrderNumber = normalizeText(orderNumber).toUpperCase();

  const customerOrders = await Promise.all(
    customersResponse.items.map(async (customer) => {
      const ordersResponse = await fetchJson<{ items: ErpCustomerOrder[] }>(
        `${env.erpSimBaseUrl}/api/customer-orders?customer_id=${encodeURIComponent(customer.id)}`,
      );

      return {
        customer,
        order: ordersResponse.items.find((item) => normalizeText(item.order_number).toUpperCase() === normalizedOrderNumber),
      };
    }),
  );

  const matched = customerOrders.find((entry) => entry.order);
  return matched?.order ? { customer: matched.customer, order: matched.order } : undefined;
};

export const executeLoadCustomerAction = async (input: {
  action: NextFormElement;
  fieldValues: NextFormFieldValues;
}): Promise<{ fieldValues: NextFormFieldValues; actionState: NextFormActionState }> => {
  const orderNumberField = input.action.args?.[0] ?? "order_number";
  const orderNumber = normalizeText(input.fieldValues[orderNumberField]);

  if (!orderNumber) {
    return {
      fieldValues: input.fieldValues,
      actionState: {
        type: "error",
        title: "Auftragsnummer fehlt",
        message: "Bitte zuerst eine Auftragsnummer eingeben, bevor Kundendaten geladen werden.",
        actionName: input.action.name,
      },
    };
  }

  if (input.action.ref !== "customers.lookup") {
    return {
      fieldValues: input.fieldValues,
      actionState: {
        type: "error",
        title: "Lookup nicht unterstuetzt",
        message: `Aktuell ist nur customers.lookup verfuegbar, nicht ${input.action.ref ?? "ohne Ref"}.`,
        actionName: input.action.name,
      },
    };
  }

  try {
    const matched = await lookupCustomerByOrderNumber(orderNumber);

    if (!matched) {
      return {
        fieldValues: input.fieldValues,
        actionState: {
          type: "info",
          title: "Kein ERP-SIM-Treffer",
          message: `Im laufenden ERP-SIM wurde kein Auftrag mit der Nummer ${orderNumber} gefunden.`,
          actionName: input.action.name,
        },
      };
    }

    const nextFieldValues: NextFormFieldValues = { ...input.fieldValues };

    for (const bindTarget of input.action.bind ?? []) {
      if (bindTarget === "customer") {
        nextFieldValues.customer = matched.customer.name;
        continue;
      }

      if (bindTarget === "service_location") {
        nextFieldValues.service_location = "Nicht im ERP-SIM vorhanden";
      }
    }

    nextFieldValues.customer_master_id = matched.customer.id;
    nextFieldValues.customer_master_status = matched.customer.valid ? "Aktiv" : "Inaktiv";
    nextFieldValues.customer_order_status = matched.order.status;
    nextFieldValues.customer_order_created_at = matched.order.created_at;

    return {
      fieldValues: nextFieldValues,
      actionState: {
        type: "info",
        title: "Kundendaten geladen",
        message: `Kundendaten fuer ${orderNumber} geladen: ${matched.customer.name}.`,
        actionName: input.action.name,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Der ERP-SIM-Call ist fehlgeschlagen.";

    return {
      fieldValues: input.fieldValues,
      actionState: {
        type: "error",
        title: "ERP-SIM nicht erreichbar",
        message,
        actionName: input.action.name,
      },
    };
  }
};
