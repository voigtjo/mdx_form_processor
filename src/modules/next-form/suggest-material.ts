import { env } from "../../config/env.js";
import type { NextFormElement } from "./types.js";
import type { NextFormActionState, NextFormFieldValues } from "./load-customer.js";

type ErpProduct = {
  id: string;
  name: string;
  valid: boolean;
  product_type: string;
};

const normalizeText = (value: string | undefined): string => value?.trim() ?? "";

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`ERP-SIM antwortete mit ${response.status}.`);
  }

  return (await response.json()) as T;
};

const tokenize = (value: string): string[] => {
  return normalizeText(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
};

const scoreProductMatch = (description: string, product: ErpProduct): number => {
  const descriptionTokens = new Set(tokenize(description));
  const productTokens = tokenize(`${product.name} ${product.product_type}`);
  let score = 0;

  for (const token of productTokens) {
    if (descriptionTokens.has(token)) {
      score += 2;
    }
  }

  if (descriptionTokens.has(product.product_type.toLowerCase())) {
    score += 4;
  }

  if (description.toLowerCase().includes("batch") && product.product_type === "batch") {
    score += 3;
  }

  if (description.toLowerCase().includes("serial") && product.product_type === "serial") {
    score += 3;
  }

  return score;
};

const lookupProductSuggestion = async (workDescription: string): Promise<ErpProduct | undefined> => {
  const productsResponse = await fetchJson<{ items: ErpProduct[] }>(`${env.erpSimBaseUrl}/api/products?valid=true`);
  const scoredProducts = productsResponse.items
    .map((product) => ({
      product,
      score: scoreProductMatch(workDescription, product),
    }))
    .sort((left, right) => right.score - left.score || left.product.name.localeCompare(right.product.name));

  const bestMatch = scoredProducts[0];
  return bestMatch && bestMatch.score > 0 ? bestMatch.product : undefined;
};

export const executeSuggestMaterialAction = async (input: {
  action: NextFormElement;
  fieldValues: NextFormFieldValues;
}): Promise<{ fieldValues: NextFormFieldValues; actionState: NextFormActionState }> => {
  const workDescriptionField = input.action.args?.[0] ?? "work_description";
  const workDescription = normalizeText(input.fieldValues[workDescriptionField]);

  if (!workDescription) {
    return {
      fieldValues: input.fieldValues,
      actionState: {
        type: "error",
        title: "Taetigkeitsbeschreibung fehlt",
        message: "Bitte zuerst eine Taetigkeitsbeschreibung eingeben, bevor ein Materialvorschlag geholt wird.",
        actionName: input.action.name,
      },
    };
  }

  if (input.action.ref !== "products.suggest") {
    return {
      fieldValues: input.fieldValues,
      actionState: {
        type: "error",
        title: "Lookup nicht unterstuetzt",
        message: `Aktuell ist nur products.suggest verfuegbar, nicht ${input.action.ref ?? "ohne Ref"}.`,
        actionName: input.action.name,
      },
    };
  }

  try {
    const matchedProduct = await lookupProductSuggestion(workDescription);

    if (!matchedProduct) {
      return {
        fieldValues: input.fieldValues,
        actionState: {
          type: "info",
          title: "Kein Product-Vorschlag",
          message: `Im laufenden ERP-SIM wurde fuer "${workDescription}" kein passendes Product gefunden.`,
          actionName: input.action.name,
        },
      };
    }

    const nextFieldValues: NextFormFieldValues = { ...input.fieldValues };

    for (const bindTarget of input.action.bind ?? []) {
      if (bindTarget === "material") {
        nextFieldValues.material = matchedProduct.name;
      }
    }

    nextFieldValues.product_master_id = matchedProduct.id;
    nextFieldValues.product_master_type = matchedProduct.product_type;
    nextFieldValues.product_master_status = matchedProduct.valid ? "Aktiv" : "Inaktiv";

    return {
      fieldValues: nextFieldValues,
      actionState: {
        type: "info",
        title: "Materialvorschlag geladen",
        message: `Materialvorschlag fuer "${workDescription}": ${matchedProduct.name}.`,
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
