export type AuthStrategy =
  | { strategy: "none" }
  | { strategy: "apiKey"; keyName: string }
  | { strategy: "basic" }
  | { strategy: "bearerToken" }
  | { strategy: "oauth2ClientCredentials"; tokenUrl: string; clientIdRef: string; clientSecretRef: string };

export interface OperationContext {
  document: { id: string; status: string };
  template: { key: string; version: number };
  workflow: { key: string; version: number };
  currentUser: { key: string; displayName: string };
  data: Record<string, unknown>;
  external: Record<string, unknown>;
  snapshot: Record<string, unknown>;
  integrationContext: Record<string, unknown>;
  request: Record<string, unknown>;
  http: {
    post: (path: string, body: unknown) => Promise<any>;
  };
  writeData: (key: string, value: unknown) => void;
  writeExternal: (key: string, value: unknown) => void;
  writeSnapshot: (key: string, value: unknown) => void;
  writeIntegrationContext: (key: string, value: unknown) => void;
}

export const operation = {
  operationRef: "customerOrders.create",
  meta: {
    name: "Create Customer Order",
    description: "Creates a customer order in the ERP simulation and stores the resulting reference for later workflow hooks.",
    connector: "erp-sim",
    useCases: ["form-action"],
    tags: ["customer-order", "erp", "create"]
  },
  auth: {
    strategy: "none"
  } as AuthStrategy,
  async execute(ctx: OperationContext) {
    const customerId = String(ctx.request.customerId ?? ctx.data.customer_id ?? "");
    const notes = String(ctx.request.notes ?? ctx.data.review_notes ?? "");

    if (!customerId) {
      throw new Error("customer_id is required to create a customer order.");
    }

    const result = await ctx.http.post("/erp/customer-orders", {
      customerId,
      notes,
      documentId: ctx.document.id,
      templateKey: ctx.template.key,
      actor: ctx.currentUser.key
    });

    ctx.writeIntegrationContext("customer_order_id", result.id);
    ctx.writeExternal("customer_order_number", result.orderNumber);
    ctx.writeSnapshot("customer_order_created_ok", result.ok === true);

    return result;
  }
};

export default operation;
