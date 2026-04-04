import { listReferenceEntities } from "../entities/read.js";
import type { FormRuntimeActionState, FormRuntimeElement, FormRuntimeFieldValues } from "../forms/types.js";
import { richTextHtmlToPlainText } from "../forms/rich-text.js";

const normalizeText = (value: string | undefined): string => value?.trim() ?? "";

const tokenize = (value: string): string[] =>
  normalizeText(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);

const scoreProductMatch = (description: string, product: { displayName: string; dataJson: Record<string, unknown> }): number => {
  const descriptionTokens = new Set(tokenize(description));
  const keywordTokens = tokenize(
    [
      product.displayName,
      typeof product.dataJson.product_type === "string" ? product.dataJson.product_type : "",
      typeof product.dataJson.match_terms === "string" ? product.dataJson.match_terms : "",
    ].join(" "),
  );
  let score = 0;

  for (const token of keywordTokens) {
    if (descriptionTokens.has(token)) {
      score += 2;
    }
  }

  if (descriptionTokens.has("wartung") && keywordTokens.includes("wartung")) {
    score += 3;
  }

  if (descriptionTokens.has("pruefung") && keywordTokens.includes("pruefung")) {
    score += 3;
  }

  if (descriptionTokens.has("montage") && keywordTokens.includes("montage")) {
    score += 3;
  }

  return score;
};

export const executeSuggestMaterialAction = async (input: {
  action: FormRuntimeElement;
  fieldValues: FormRuntimeFieldValues;
}): Promise<{ fieldValues: FormRuntimeFieldValues; actionState: FormRuntimeActionState }> => {
  const workDescriptionField = input.action.args?.[0] ?? "work_description";
  const workDescription = richTextHtmlToPlainText(input.fieldValues[workDescriptionField]);

  if (!workDescription) {
    return {
      fieldValues: input.fieldValues,
      actionState: {
        type: "error",
        title: "Taetigkeitsbeschreibung fehlt",
        message: "Bitte zuerst eine Taetigkeitsbeschreibung eingeben, bevor ein Produktvorschlag geholt wird.",
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

  const activeProducts = (await listReferenceEntities("product")).filter((product) => product.status === "active");
  const scoredProducts = activeProducts
    .map((product) => ({
      product,
      score: scoreProductMatch(workDescription, product),
    }))
    .sort((left, right) => right.score - left.score || left.product.displayName.localeCompare(right.product.displayName));
  const bestMatch = scoredProducts[0];
  const matchedProduct = bestMatch && bestMatch.score > 0 ? bestMatch.product : undefined;

  if (!matchedProduct) {
    return {
      fieldValues: input.fieldValues,
      actionState: {
        type: "info",
        title: "Kein Produktvorschlag",
        message: `In den internen Produktstammdaten wurde fuer "${workDescription}" kein passendes Produkt gefunden.`,
        actionName: input.action.name,
      },
    };
  }

  const nextFieldValues: FormRuntimeFieldValues = { ...input.fieldValues };

  for (const bindTarget of input.action.bind ?? []) {
    if (bindTarget === "material") {
      nextFieldValues.material = matchedProduct.displayName;
    }
  }

  nextFieldValues.product_master_id = matchedProduct.entityKey;
  nextFieldValues.product_master_type =
    typeof matchedProduct.dataJson.product_type === "string" ? matchedProduct.dataJson.product_type : "";
  nextFieldValues.product_master_status = matchedProduct.status === "active" ? "Aktiv" : "Inaktiv";

  return {
    fieldValues: nextFieldValues,
    actionState: {
      type: "info",
      title: "Produktvorschlag geladen",
      message: `Produktvorschlag fuer "${workDescription}": ${matchedProduct.displayName}.`,
      actionName: input.action.name,
    },
  };
};
