import { randomUUID } from "node:crypto";
import { withDbTransaction } from "../../db/pool.js";

const buildDraftTemplateMdx = (input: {
  key: string;
  name: string;
  description?: string;
  workflowTemplateKey: string;
}): string => {
  return `---
key: ${input.key}
name: ${input.name}
version: 1
status: draft
workflowTemplateKey: ${input.workflowTemplateKey}
description: ${input.description ?? "Draft template created from the Templates screen."}
---

<Fields>
</Fields>

# ${input.name}

<Section title="Overview">
  <p>Draft template created from the Templates screen.</p>
</Section>
`;
};

export const createTemplateDraft = async (input: {
  name: string;
  key: string;
  description?: string;
  workflowTemplateId: string;
  formType: "customer_order" | "production_record" | "qualification_record" | "generic_form";
}): Promise<{ id: string }> => {
  const name = input.name.trim();
  const key = input.key.trim();

  if (!name || !key) {
    throw new Error("Name und Key sind fuer neue Templates erforderlich.");
  }

  return withDbTransaction(async (client) => {
    const existingTemplate = await client.query<{ id: string }>(
      `select id from form_templates where key = $1 limit 1`,
      [key],
    );

    if (existingTemplate.rowCount) {
      throw new Error("Der Template-Key ist bereits vergeben. Neue Versionen folgen in einem spaeteren Schritt.");
    }

    const workflowResult = await client.query<{ id: string; key: string }>(
      `select id, key from workflow_templates where id = $1 limit 1`,
      [input.workflowTemplateId],
    );

    const workflow = workflowResult.rows[0];

    if (!workflow) {
      throw new Error("Bitte ein gueltiges Workflow Template auswaehlen.");
    }

    const id = randomUUID();
    const mdxBody = buildDraftTemplateMdx({
      key,
      name,
      ...(input.description?.trim() ? { description: input.description.trim() } : {}),
      workflowTemplateKey: workflow.key,
    });

    await client.query(
      `insert into form_templates (
         id, key, name, form_type, description, version, status, workflow_template_id, mdx_body,
         template_keys, document_keys, table_fields, visibility_rules
       )
       values ($1, $2, $3, $4, $5, 1, 'draft', $6, $7, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '{}'::jsonb)`,
      [id, key, name, input.formType, input.description?.trim() || null, workflow.id, mdxBody],
    );

    return { id };
  });
};
