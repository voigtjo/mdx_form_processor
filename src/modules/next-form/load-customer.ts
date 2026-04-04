import { findActiveReferenceEntityByDataField } from "../entities/read.js";
import type { NextFormElement } from "./types.js";

export type NextFormFieldValues = Record<string, string>;

export type NextFormActionState = {
  type: "info" | "error";
  title: string;
  message: string;
  actionName: string;
};

const normalizeText = (value: string | undefined): string => value?.trim() ?? "";

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

  const matchedCustomer = await findActiveReferenceEntityByDataField({
    entityType: "customer",
    field: "order_number",
    value: orderNumber,
  });

  if (!matchedCustomer) {
    return {
      fieldValues: input.fieldValues,
      actionState: {
        type: "info",
        title: "Kein Kundentreffer",
        message: `In den internen Stammdaten wurde kein Kundenauftrag mit der Nummer ${orderNumber} gefunden.`,
        actionName: input.action.name,
      },
    };
  }

  const nextFieldValues: NextFormFieldValues = { ...input.fieldValues };

  for (const bindTarget of input.action.bind ?? []) {
    if (bindTarget === "customer") {
      nextFieldValues.customer = matchedCustomer.displayName;
      continue;
    }

    if (bindTarget === "service_location") {
      nextFieldValues.service_location =
        typeof matchedCustomer.dataJson.service_location === "string" ? matchedCustomer.dataJson.service_location : "";
    }
  }

  nextFieldValues.customer_master_id = matchedCustomer.entityKey;
  nextFieldValues.customer_master_status = matchedCustomer.status === "active" ? "Aktiv" : "Inaktiv";
  nextFieldValues.customer_order_status =
    typeof matchedCustomer.dataJson.order_status === "string" ? matchedCustomer.dataJson.order_status : "offen";
  nextFieldValues.customer_order_created_at =
    typeof matchedCustomer.dataJson.order_created_at === "string" ? matchedCustomer.dataJson.order_created_at : "";

  return {
    fieldValues: nextFieldValues,
    actionState: {
      type: "info",
      title: "Kundendaten geladen",
      message: `Kundendaten fuer ${orderNumber} geladen: ${matchedCustomer.displayName}.`,
      actionName: input.action.name,
    },
  };
};
