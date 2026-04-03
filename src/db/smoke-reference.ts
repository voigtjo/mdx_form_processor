import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import { listAttachmentsForDocument } from "../modules/attachments/read.js";
import { listGroups } from "../modules/groups/read.js";
import { listUsers } from "../modules/users/read.js";
import { listFormTemplateVersions, listFormTemplates, listTemplateAssignments } from "../modules/templates/read.js";
import { listWorkflowTemplateVersions, listWorkflowTemplates } from "../modules/workflows/read.js";
import { listAuditEventsForDocument } from "../modules/audit/read.js";
import {
  findDocumentDetailVisibleToUser,
  listDocumentsAssignedToUser,
  listDocumentsVisibleToUser,
  listTasksForDocument,
  listTasksForUser,
} from "../modules/documents/read.js";
import { listAssignments } from "../modules/assignments/read.js";
import { listAuditEvents } from "../modules/audit/read.js";
import { listMemberships } from "../modules/memberships/read.js";
import { buildApp } from "../app.js";
import { closePool } from "./pool.js";
import { rebuildReferenceData } from "./rebuild-reference.js";

const main = async (): Promise<void> => {
  await rebuildReferenceData();

  const [users, groups, templates, workflows, assignments, auditEvents] = await Promise.all([
    listUsers(),
    listGroups(),
    listFormTemplates(),
    listWorkflowTemplates(),
    listAssignments(),
    listAuditEvents(),
  ]);

  assert.equal(users.length, 2, "Expected 2 reference users.");
  assert.equal(groups.length, 2, "Expected 2 reference groups.");
  assert.equal(templates.length, 3, "Expected 3 reference templates.");
  assert.equal(workflows.length, 3, "Expected 3 reference workflows.");
  assert.equal(assignments.length, 6, "Expected 6 reference document assignments.");
  assert.ok(auditEvents.length >= 10, "Expected visible audit events.");

  const alice = users.find((user) => user.key === "alice");
  const bob = users.find((user) => user.key === "bob");

  assert.ok(alice, "Alice must exist.");
  assert.ok(bob, "Bob must exist.");

  const [aliceDocuments, aliceAssignedDocuments, aliceTasks, bobTasks] = await Promise.all([
    listDocumentsVisibleToUser(alice.id),
    listDocumentsAssignedToUser(alice.id),
    listTasksForUser(alice.id),
    listTasksForUser(bob.id),
  ]);

  const erpHealth = await fetch("http://localhost:3001/health");
  assert.equal(erpHealth.status, 200, "ERP-SIM must be reachable on localhost:3001 for the normal next-form document slice.");

  const customersResponse = await fetch("http://localhost:3001/api/customers?valid=true");
  assert.equal(customersResponse.status, 200, "ERP-SIM customers endpoint should respond for the normal document slice.");
  const customersPayload = (await customersResponse.json()) as {
    items: Array<{ id: string; name: string }>;
  };
  const productsResponse = await fetch("http://localhost:3001/api/products?valid=true");
  assert.equal(productsResponse.status, 200, "ERP-SIM products endpoint should respond for the normal document slice.");
  const productsPayload = (await productsResponse.json()) as {
    items: Array<{ id: string; name: string; valid: boolean; product_type: string }>;
  };

  let liveLookupSample:
    | {
        customerId: string;
        orderNumber: string;
        customerName: string;
        customerStatus: string;
        orderStatus: string;
        orderCreatedAt: string;
        productId: string;
        productName: string;
        productType: string;
        productStatus: string;
      }
    | undefined;

  for (const customer of customersPayload.items) {
    const ordersResponse = await fetch(
      `http://localhost:3001/api/customer-orders?customer_id=${encodeURIComponent(customer.id)}`,
    );

    assert.equal(ordersResponse.status, 200, "ERP-SIM customer-orders endpoint should respond for the normal document slice.");
    const ordersPayload = (await ordersResponse.json()) as {
      items: Array<{ order_number: string; status: string; created_at: string }>;
    };
    const firstOrder = ordersPayload.items[0];
    const batchProduct = productsPayload.items.find((item) => item.name === "Batch Product A");

    if (firstOrder && batchProduct) {
      liveLookupSample = {
        customerId: customer.id,
        orderNumber: firstOrder.order_number,
        customerName: customer.name,
        customerStatus: "Aktiv",
        orderStatus: firstOrder.status,
        orderCreatedAt: firstOrder.created_at,
        productId: batchProduct.id,
        productName: batchProduct.name,
        productType: batchProduct.product_type,
        productStatus: batchProduct.valid ? "Aktiv" : "Inaktiv",
      };
      break;
    }
  }

  assert.ok(liveLookupSample, "ERP-SIM should expose at least one order for the normal next-form document slice.");

  assert.ok(aliceDocuments.length >= 3, "Alice should see the reference documents.");
  assert.ok(aliceAssignedDocuments.length >= 2, "Alice should have assigned reference documents.");
  assert.equal(aliceTasks.length, 1, "Alice should have one open reference task.");
  assert.equal(bobTasks.length, 2, "Bob should have two open reference tasks.");

  const app = await buildApp();

  const buildMultipartUpload = (filename: string, mimeType: string, content: Buffer | string) => {
    const boundary = "----codex-attachment-boundary";
    const payload = Buffer.concat([
      Buffer.from(`--${boundary}\r\n`, "utf8"),
      Buffer.from(`Content-Disposition: form-data; name="attachment"; filename="${filename}"\r\n`, "utf8"),
      Buffer.from(`Content-Type: ${mimeType}\r\n\r\n`, "utf8"),
      typeof content === "string" ? Buffer.from(content, "utf8") : content,
      Buffer.from(`\r\n--${boundary}--\r\n`, "utf8"),
    ]);

    return {
      boundary,
      payload,
    };
  };

  const truncateLikeJournalUi = (value: string, maxLength = 160) => {
    const normalized = value.trim();
    return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3).trimEnd()}...` : normalized;
  };

  try {
    const workspace = await app.inject({
      method: "GET",
      url: "/workspace?user=alice",
    });
    const templatesPage = await app.inject({
      method: "GET",
      url: "/templates?user=alice",
    });
    const templateDetailPage = await app.inject({
      method: "GET",
      url: "/templates/77777777-7777-7777-7777-777777777771?user=alice",
    });
    const templateNewPage = await app.inject({
      method: "GET",
      url: "/templates/new?user=alice",
    });
    const workflowsPage = await app.inject({
      method: "GET",
      url: "/workflows?user=alice",
    });
    const workflowDetailPage = await app.inject({
      method: "GET",
      url: "/workflows/66666666-6666-6666-6666-666666666661?user=alice",
    });
    const workflowNewPage = await app.inject({
      method: "GET",
      url: "/workflows/new?user=alice",
    });
    const adminPage = await app.inject({
      method: "GET",
      url: "/admin?user=alice",
    });
    const adminUserNewPage = await app.inject({
      method: "GET",
      url: "/admin/users/new?user=alice",
    });
    const adminGroupNewPage = await app.inject({
      method: "GET",
      url: "/admin/groups/new?user=alice",
    });
    const documentsPage = await app.inject({
      method: "GET",
      url: "/documents?user=alice",
    });
    const searchedDocumentsPage = await app.inject({
      method: "GET",
      url: "/documents?user=alice&q=Evidence",
    });
    const approvedDocumentsPage = await app.inject({
      method: "GET",
      url: "/documents?user=alice&status=approved",
    });
    const documentDetail = await app.inject({
      method: "GET",
      url: "/documents/99999999-9999-9999-9999-999999999991?user=alice",
    });
    const missingDocument = await app.inject({
      method: "GET",
      url: "/documents/00000000-0000-0000-0000-000000000000?user=alice",
    });
    const startDocument = await app.inject({
      method: "POST",
      url: "/documents/start?user=alice",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: "templateId=77777777-7777-7777-7777-777777777772",
    });

    assert.equal(workspace.statusCode, 200, "Workspace should render from DB data.");
    assert.equal(templatesPage.statusCode, 200, "Templates page should render from DB data.");
    assert.equal(templateDetailPage.statusCode, 200, "Template detail page should render from DB data.");
    assert.equal(templateNewPage.statusCode, 200, "Template new page should render.");
    assert.equal(workflowsPage.statusCode, 200, "Workflows page should render from DB data.");
    assert.equal(workflowDetailPage.statusCode, 200, "Workflow detail page should render from DB data.");
    assert.equal(workflowNewPage.statusCode, 200, "Workflow new page should render.");
    assert.equal(adminPage.statusCode, 200, "Admin page should render from DB data.");
    assert.equal(adminUserNewPage.statusCode, 200, "Admin user new page should render.");
    assert.equal(adminGroupNewPage.statusCode, 200, "Admin group new page should render.");
    assert.equal(documentsPage.statusCode, 200, "Documents page should render from DB data.");
    assert.equal(searchedDocumentsPage.statusCode, 200, "Documents search should render from DB data.");
    assert.equal(approvedDocumentsPage.statusCode, 200, "Documents status filter should render from DB data.");
    assert.equal(documentDetail.statusCode, 200, "Document detail should render from DB data.");
    assert.equal(missingDocument.statusCode, 404, "Missing document should render as 404.");
    assert.equal(startDocument.statusCode, 303, "Document start should redirect to the new detail page.");
    assert.match(workspace.body, /Alice/);
    assert.match(workspace.body, /Production Batch/);
    assert.match(workspace.body, /Open Document/);
    assert.match(workspace.body, /\/documents\/99999999-9999-9999-9999-999999999991\?user=alice/);
    assert.match(workspace.body, /Start Document/);
    assert.match(templatesPage.body, /Customer Order Test/);
    assert.match(templatesPage.body, /New Template/);
    assert.match(templatesPage.body, /\/templates\/77777777-7777-7777-7777-777777777771\?user=alice/);
    assert.match(templatesPage.body, /Open Documents/);
    assert.match(templatesPage.body, /Start Document/);
    assert.match(templatesPage.body, /customer-order\.group-submit\.v1 · v1/);
    assert.doesNotMatch(templatesPage.body, /New \.form\.md reference/);
    assert.doesNotMatch(templatesPage.body, /Reference template for customer order processing\./);
    assert.doesNotMatch(templatesPage.body, /Template Review/);
    assert.match(templateDetailPage.body, /Back to Templates/);
    assert.match(templateDetailPage.body, /Customer Order Test/);
    assert.match(templateDetailPage.body, /Template Source/);
    assert.match(templateDetailPage.body, /Header Values/);
    assert.match(templateDetailPage.body, /Source/);
    assert.match(templateDetailPage.body, /Preview/);
    assert.match(templateDetailPage.body, /name="source"/);
    assert.match(templateDetailPage.body, /Save Draft/);
    assert.match(templateDetailPage.body, /Publish/);
    assert.match(templateDetailPage.body, /Unpublish/);
    assert.match(templateDetailPage.body, /Archive/);
    assert.match(templateDetailPage.body, /attachments_enabled: true/);
    assert.match(templateDetailPage.body, /journal_enabled: true/);
    assert.match(templateDetailPage.body, /Auftragsdokumentation fuer Handwerker/);
    assert.match(templateDetailPage.body, /Kundendaten laden/);
    assert.match(templateDetailPage.body, /Materialvorschlag holen/);
    assert.match(templateDetailPage.body, /customers\.lookup/);
    assert.match(templateDetailPage.body, /products\.suggest/);
    assert.match(templateDetailPage.body, /Context/);
    assert.match(templateDetailPage.body, /Customer Order Group Submit v1/);
    assert.match(templateDetailPage.body, /attachments_enabled/);
    assert.match(templateDetailPage.body, /journal_enabled/);
    assert.match(templateDetailPage.body, /<details class="panel panel-collapsible">/);
    assert.doesNotMatch(templateDetailPage.body, /Alt Model \(MDX\)/);
    assert.doesNotMatch(templateDetailPage.body, /MDX Source/);
    assert.doesNotMatch(templateDetailPage.body, /Transition Slice/);
    assert.ok(
      templateDetailPage.body.indexOf("Source") < templateDetailPage.body.indexOf("Preview"),
      "Template detail should render form source above preview for the reference template.",
    );

    const referenceTemplateSource = await readFile(new URL("../../specs/21_example_form_template.mdx", import.meta.url), "utf8");
    const draftTemplateSource = referenceTemplateSource.replace(
      "Auftragsdokumentation fuer Handwerker",
      "Auftragsdokumentation fuer Handwerker Draft",
    );

    const saveReferenceTemplateDraft = await app.inject({
      method: "POST",
      url: "/templates/77777777-7777-7777-7777-777777777771/source?user=alice",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `source=${encodeURIComponent(draftTemplateSource)}&intent=save_draft`,
    });

    assert.equal(saveReferenceTemplateDraft.statusCode, 303, "Saving the reference template draft should redirect to the draft detail.");

    const draftTemplateLocation = String(saveReferenceTemplateDraft.headers.location ?? "");
    const draftTemplateId = draftTemplateLocation.match(/\/templates\/([^?]+)/)?.[1];

    assert.ok(draftTemplateId, "Saving the reference template draft should return a template detail redirect.");

    const draftTemplateDetailPage = await app.inject({
      method: "GET",
      url: draftTemplateLocation,
    });

    assert.equal(draftTemplateDetailPage.statusCode, 200, "Draft template detail should render.");
    assert.match(draftTemplateDetailPage.body, /Draft gespeichert/);
    assert.match(draftTemplateDetailPage.body, /draft · v2/);
    assert.match(draftTemplateDetailPage.body, /Auftragsdokumentation fuer Handwerker Draft/);
    assert.match(draftTemplateDetailPage.body, /attachments_enabled: true/);
    assert.match(draftTemplateDetailPage.body, /journal_enabled: true/);

    const publishReferenceTemplate = await app.inject({
      method: "POST",
      url: `/templates/${draftTemplateId}/source?user=alice`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `source=${encodeURIComponent(draftTemplateSource)}&intent=publish`,
    });

    assert.equal(publishReferenceTemplate.statusCode, 303, "Publishing the reference draft should redirect to the published template detail.");

    const publishTemplateLocation = String(publishReferenceTemplate.headers.location ?? "");
    const publishedTemplateId = publishTemplateLocation.match(/\/templates\/([^?]+)/)?.[1];
    const publishedTemplateDetailPage = await app.inject({
      method: "GET",
      url: publishTemplateLocation,
    });
    const publishedVersions = await listFormTemplateVersions("customer-order-test");

    assert.equal(publishedTemplateDetailPage.statusCode, 200, "Published reference template detail should render.");
    assert.match(publishedTemplateDetailPage.body, /Template publiziert/);
    assert.match(publishedTemplateDetailPage.body, /published · v2/);
    assert.match(publishedTemplateDetailPage.body, /Auftragsdokumentation fuer Handwerker Draft/);
    assert.ok(
      publishedVersions.some((template) => template.version === 2 && template.status === "published"),
      "Publishing should create or promote a published v2 for the reference template.",
    );
    assert.ok(
      publishedVersions.some((template) => template.version === 1 && template.status === "inactive"),
      "The previous reference version should remain visible as an older inactive version.",
    );
    assert.ok(publishedTemplateId, "Publishing should redirect to the active published template detail.");
    assert.match(templateNewPage.body, /Create Draft/);
    assert.match(templateNewPage.body, /Workflow Template/);
    assert.match(workflowsPage.body, /New Workflow/);
    assert.match(workflowsPage.body, /\/workflows\/66666666-6666-6666-6666-666666666661\?user=alice/);
    assert.match(workflowsPage.body, /Open Templates/);
    assert.doesNotMatch(workflowsPage.body, /Workflow Review/);
    assert.match(workflowDetailPage.body, /Back to Workflows/);
    assert.match(workflowDetailPage.body, /hero-card hero-card-compact/);
    assert.match(workflowDetailPage.body, /Workflow Source/);
    assert.match(workflowDetailPage.body, /JSON Source/);
    assert.match(workflowDetailPage.body, /Transition View/);
    assert.match(workflowDetailPage.body, /name="source"/);
    assert.match(workflowDetailPage.body, /Save Draft v2/);
    assert.match(workflowDetailPage.body, /Publish v2/);
    assert.match(workflowDetailPage.body, /Unpublish v1/);
    assert.match(workflowDetailPage.body, /Archive v1/);
    assert.match(workflowDetailPage.body, /Context/);
    assert.match(workflowDetailPage.body, /Customer Order Group Submit/);
    assert.match(workflowDetailPage.body, /Key:<\/strong>\s*customer-order\.group-submit\.v1/);
    assert.match(workflowDetailPage.body, /Betrachtet:<\/strong>\s*v1/);
    assert.match(workflowDetailPage.body, /Statusfolge/);
    assert.match(workflowDetailPage.body, /<th>Action<\/th>/);
    assert.match(workflowDetailPage.body, /<th>From<\/th>/);
    assert.match(workflowDetailPage.body, /<th>To<\/th>/);
    assert.match(workflowDetailPage.body, /<th>Roles<\/th>/);
    assert.match(workflowDetailPage.body, /<th>Mode<\/th>/);
    assert.match(workflowDetailPage.body, /<th>API<\/th>/);
    assert.match(workflowDetailPage.body, /<th>Condition<\/th>/);
    assert.match(workflowDetailPage.body, /submit/);
    assert.match(workflowDetailPage.body, /submitted/);
    assert.match(workflowDetailPage.body, /approved/);
    assert.match(workflowDetailPage.body, /AND/);
    assert.match(workflowDetailPage.body, /customerOrders\.setStatusFromContext/);
    assert.match(workflowDetailPage.body, /initialStatus/);
    assert.match(workflowDetailPage.body, /created/);
    assert.match(workflowDetailPage.body, /Published Templates auf dieser Version/);
    assert.match(workflowDetailPage.body, /Customer Order Test v1/);
    assert.match(workflowDetailPage.body, /Unpublish/);
    assert.match(workflowDetailPage.body, /Nicht moeglich, solange publizierte Templates diese Version nutzen/);
    assert.ok(
      workflowDetailPage.body.indexOf("Workflow Source") < workflowDetailPage.body.indexOf("Transition View"),
      "Workflow source should render above the transition view.",
    );
    assert.doesNotMatch(workflowDetailPage.body, /Action Overview/);
    assert.doesNotMatch(workflowDetailPage.body, /<h3>Hooks<\/h3>/);
    assert.doesNotMatch(workflowDetailPage.body, /<h3>Usage<\/h3>/);
    assert.doesNotMatch(workflowDetailPage.body, /keine sichtbaren Referenzen/);

    const referenceWorkflowSource = await readFile(new URL("../../specs/22_example_workflow_template.json", import.meta.url), "utf8");
    const draftWorkflowSourceJson = JSON.parse(referenceWorkflowSource) as Record<string, unknown>;
    const draftWorkflowActions = (draftWorkflowSourceJson.actions ?? {}) as Record<string, unknown>;
    draftWorkflowSourceJson.actions = {
      ...draftWorkflowActions,
      qualityCheck: {
        from: ["submitted"],
        to: "approved",
        allowedRoles: ["approver"],
        completionMode: "single",
      },
    };
    const draftWorkflowSource = JSON.stringify(draftWorkflowSourceJson, null, 2);

    const saveWorkflowDraft = await app.inject({
      method: "POST",
      url: "/workflows/66666666-6666-6666-6666-666666666661/source?user=alice",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `source=${encodeURIComponent(draftWorkflowSource)}&intent=save_draft`,
    });

    assert.equal(saveWorkflowDraft.statusCode, 303, "Saving the reference workflow draft should redirect to the draft detail.");

    const draftWorkflowLocation = String(saveWorkflowDraft.headers.location ?? "");
    const draftWorkflowId = draftWorkflowLocation.match(/\/workflows\/([^?]+)/)?.[1];

    assert.ok(draftWorkflowId, "Saving the workflow draft should return a workflow detail redirect.");

    const draftWorkflowDetailPage = await app.inject({
      method: "GET",
      url: draftWorkflowLocation,
    });
    const workflowVersions = await listWorkflowTemplateVersions("customer-order.group-submit.v1");

    assert.equal(draftWorkflowDetailPage.statusCode, 200, "Draft workflow detail should render.");
    assert.match(draftWorkflowDetailPage.body, /Draft gespeichert/);
    assert.match(draftWorkflowDetailPage.body, /draft · v2/);
    assert.match(draftWorkflowDetailPage.body, /qualityCheck/);
    assert.match(draftWorkflowDetailPage.body, /Save Draft v2/);
    assert.match(draftWorkflowDetailPage.body, /Publish v2/);
    assert.match(draftWorkflowDetailPage.body, /<td><strong>qualityCheck<\/strong><\/td>/);
    assert.match(draftWorkflowDetailPage.body, /<td>submitted<\/td>\s*<td>approved<\/td>/);
    assert.ok(
      workflowVersions.some((version) => version.version === 2 && version.status === "draft"),
      "Saving the reference workflow draft should create or update a draft v2.",
    );

    const blockedWorkflowUnpublish = await app.inject({
      method: "POST",
      url: "/workflows/66666666-6666-6666-6666-666666666661/source?user=alice",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `source=${encodeURIComponent(referenceWorkflowSource)}&intent=unpublish`,
    });

    assert.equal(blockedWorkflowUnpublish.statusCode, 400, "Unpublish should be blocked while a published template uses the current workflow version.");
    assert.match(blockedWorkflowUnpublish.body, /Unpublish fehlgeschlagen/);
    assert.match(blockedWorkflowUnpublish.body, /publizierte Templates diese Workflow-Version nutzen/);

    const publishWorkflowDraft = await app.inject({
      method: "POST",
      url: `/workflows/${draftWorkflowId}/source?user=alice`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `source=${encodeURIComponent(draftWorkflowSource)}&intent=publish`,
    });

    assert.equal(publishWorkflowDraft.statusCode, 303, "Publishing the workflow draft should redirect to the published workflow detail.");

    const publishWorkflowLocation = String(publishWorkflowDraft.headers.location ?? "");
    const publishWorkflowId = publishWorkflowLocation.match(/\/workflows\/([^?]+)/)?.[1];

    assert.ok(publishWorkflowId, "Publishing the workflow draft should return a workflow detail redirect.");

    const publishedWorkflowDetailPage = await app.inject({
      method: "GET",
      url: publishWorkflowLocation,
    });
    const workflowVersionsAfterPublish = await listWorkflowTemplateVersions("customer-order.group-submit.v1");

    assert.equal(publishedWorkflowDetailPage.statusCode, 200, "Published workflow detail should render.");
    assert.match(publishedWorkflowDetailPage.body, /Workflow publiziert/);
    assert.match(publishedWorkflowDetailPage.body, /published · v2/);
    assert.match(publishedWorkflowDetailPage.body, /qualityCheck/);
    assert.match(publishedWorkflowDetailPage.body, /Published:\s*v2/);
    assert.ok(
      workflowVersionsAfterPublish.some((version) => version.version === 2 && version.status === "published"),
      "Publishing the workflow draft should make v2 visible as published.",
    );
    assert.ok(
      workflowVersionsAfterPublish.some((version) => version.version === 1 && version.status === "published"),
      "The original published workflow version should remain published while published templates still use it.",
    );

    const unpublishPublishedWorkflow = await app.inject({
      method: "POST",
      url: `/workflows/${publishWorkflowId}/source?user=alice`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `source=${encodeURIComponent(draftWorkflowSource)}&intent=unpublish`,
    });

    assert.equal(unpublishPublishedWorkflow.statusCode, 303, "An unused published workflow version should be unpublishable.");

    const unpublishedWorkflowLocation = String(unpublishPublishedWorkflow.headers.location ?? "");
    const unpublishedWorkflowDetailPage = await app.inject({
      method: "GET",
      url: unpublishedWorkflowLocation,
    });
    const workflowVersionsAfterUnpublish = await listWorkflowTemplateVersions("customer-order.group-submit.v1");

    assert.equal(unpublishedWorkflowDetailPage.statusCode, 200, "Unpublished workflow detail should render.");
    assert.match(unpublishedWorkflowDetailPage.body, /Workflow unveroeffentlicht/);
    assert.match(unpublishedWorkflowDetailPage.body, /unpublished · v2/);
    assert.match(unpublishedWorkflowDetailPage.body, /Archive v2/);
    assert.ok(
      workflowVersionsAfterUnpublish.some((version) => version.version === 2 && version.status === "inactive"),
      "Unpublish should move the unused published version to inactive.",
    );

    const archiveWorkflowVersion = await app.inject({
      method: "POST",
      url: `/workflows/${publishWorkflowId}/source?user=alice`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `source=${encodeURIComponent(draftWorkflowSource)}&intent=archive`,
    });

    assert.equal(archiveWorkflowVersion.statusCode, 303, "An inactive workflow version should be archivable.");

    const archivedWorkflowLocation = String(archiveWorkflowVersion.headers.location ?? "");
    const archivedWorkflowDetailPage = await app.inject({
      method: "GET",
      url: archivedWorkflowLocation,
    });
    const visibleWorkflowsAfterArchive = await listWorkflowTemplates();
    const workflowVersionsAfterArchive = await listWorkflowTemplateVersions("customer-order.group-submit.v1");

    assert.equal(archivedWorkflowDetailPage.statusCode, 200, "Archived workflow detail should render.");
    assert.match(archivedWorkflowDetailPage.body, /Workflow archiviert/);
    assert.match(archivedWorkflowDetailPage.body, /archived · v2/);
    assert.ok(
      workflowVersionsAfterArchive.some((version) => version.version === 2 && version.status === "archived"),
      "Archive should mark the selected workflow version as archived.",
    );
    assert.ok(
      visibleWorkflowsAfterArchive.every((workflow) => workflow.id !== publishWorkflowId),
      "Archived workflow versions should disappear from normal workflow overviews.",
    );

    const invalidWorkflowSource = "{ invalid json";
    const invalidWorkflowDraftSave = await app.inject({
      method: "POST",
      url: `/workflows/${draftWorkflowId}/source?user=alice`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `source=${encodeURIComponent(invalidWorkflowSource)}&intent=save_draft`,
    });

    assert.equal(invalidWorkflowDraftSave.statusCode, 400, "Invalid workflow source should keep the page renderable with a validation error.");
    assert.match(invalidWorkflowDraftSave.body, /Save Draft fehlgeschlagen/);
    assert.match(invalidWorkflowDraftSave.body, /Workflow Source aktuell nicht lesbar/);
    assert.match(invalidWorkflowDraftSave.body, /Transition View aktuell nicht ableitbar/);
    assert.match(invalidWorkflowDraftSave.body, /name="source"/);
    assert.match(invalidWorkflowDraftSave.body, /\{ invalid json/);
    assert.match(workflowNewPage.body, /Create Draft/);
    assert.match(adminPage.body, /New User/);
    assert.match(adminPage.body, /New Group/);
    assert.match(adminPage.body, /\/admin\/users\/11111111-1111-1111-1111-111111111111\?user=alice/);
    assert.match(adminPage.body, /\/admin\/groups\/33333333-3333-3333-3333-333333333333\?user=alice/);
    assert.match(adminUserNewPage.body, /Create User/);
    assert.match(adminGroupNewPage.body, /Create Group/);
    assert.match(documentsPage.body, /Apply Filters/);
    assert.match(documentsPage.body, /Customer Order Test \(v1\) · Customer Order Group Submit \(v1\)/);
    assert.match(documentsPage.body, /Startbar sind publizierte, nicht archivierte Template-Staende mit publiziertem Workflow\./);
    assert.doesNotMatch(documentsPage.body, /primary \.form\.md flow/);
    assert.doesNotMatch(documentsPage.body, /Primary \.form\.md workflow/);
    assert.match(documentsPage.body, /Evidence 2026-101/);
    assert.doesNotMatch(documentsPage.body, /<h3>Work Summary<\/h3>/);
    assert.match(searchedDocumentsPage.body, /Evidence 2026-101/);
    assert.doesNotMatch(searchedDocumentsPage.body, /Batch B-2026-0042/);
    assert.match(approvedDocumentsPage.body, /Customer Order 4709/);
    assert.doesNotMatch(approvedDocumentsPage.body, /Evidence 2026-101/);
    assert.match(documentDetail.body, /Customer Order 4711/);
    assert.match(documentDetail.body, /contract\.pdf/);
    assert.match(documentDetail.body, /workflow_hook_executed|submitted/);
    assert.match(documentDetail.body, /Customer Order Test/);
    assert.match(documentDetail.body, /Customer Order/);
    assert.match(documentDetail.body, /Naechster Schritt:/);
    assert.match(documentDetail.body, /<details class="panel panel-collapsible">/);
    assert.match(documentDetail.body, /data-fragment="document-header"/);
    assert.match(documentDetail.body, /data-fragment="document-context"/);
    assert.match(documentDetail.body, /data-fragment="document-workspace"/);
    assert.match(documentDetail.body, /data-fragment="document-workflow-zone"/);
    assert.match(documentDetail.body, /data-fragment="document-form-body"/);
    assert.match(documentDetail.body, /data-fragment="document-attachments"/);
    assert.match(documentDetail.body, /data-fragment="document-journal"/);
    assert.match(documentDetail.body, /data-fragment="document-history"/);
    assert.match(documentDetail.body, /Assignments & Tasks/);
    assert.match(documentDetail.body, /History/);
    assert.match(documentDetail.body, /Letzte Aktion:/);
    assert.match(documentDetail.body, /<h3>Formular<\/h3>/);
    assert.match(documentDetail.body, /Kundendaten laden/);
    assert.match(documentDetail.body, /Materialvorschlag holen/);
    assert.match(documentDetail.body, /data-inline-action="load_customer"/);
    assert.match(documentDetail.body, /data-inline-action="suggest_material"/);
    assert.match(documentDetail.body, /data-masterdata-section="customer"/);
    assert.match(documentDetail.body, /data-masterdata-section="product"/);
    assert.doesNotMatch(documentDetail.body, /New \.form\.md Model/);
    assert.doesNotMatch(documentDetail.body, /Primary Work Area/);
    assert.doesNotMatch(documentDetail.body, /Neuer bevorzugter Arbeitsweg/);
    assert.doesNotMatch(documentDetail.body, /Workflow Status/);
    assert.doesNotMatch(documentDetail.body, /Workflow Actions/);
    assert.doesNotMatch(documentDetail.body, /Document Header/);
    assert.doesNotMatch(documentDetail.body, /Dateibasis:/);
    assert.doesNotMatch(documentDetail.body, /Document Mapping/);
    assert.doesNotMatch(documentDetail.body, /Next Form Overview/);
    assert.doesNotMatch(documentDetail.body, /Alt Model \(MDX\)/);
    assert.doesNotMatch(documentDetail.body, /Legacy Transition Area/);
    assert.doesNotMatch(documentDetail.body, /Nachrangiger Bestandsbereich/);
    assert.doesNotMatch(documentDetail.body, /Placeholder/);

    const createTemplateDraft = await app.inject({
      method: "POST",
      url: "/templates/new?user=alice",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: "name=Smoke%20Template&key=smoke-template&description=Smoke%20template%20draft&workflowTemplateId=66666666-6666-6666-6666-666666666662",
    });
    const createWorkflowDraft = await app.inject({
      method: "POST",
      url: "/workflows/new?user=alice",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: "name=Smoke%20Workflow&key=smoke-workflow&description=Smoke%20workflow%20draft",
    });

    assert.equal(createTemplateDraft.statusCode, 303, "Template draft creation should redirect to detail.");
    assert.equal(createWorkflowDraft.statusCode, 303, "Workflow draft creation should redirect to detail.");

    const templateDraftLocation = String(createTemplateDraft.headers.location ?? "");
    const workflowDraftLocation = String(createWorkflowDraft.headers.location ?? "");
    const templateDraftId = templateDraftLocation.match(/\/templates\/([^?]+)/)?.[1];
    const workflowDraftId = workflowDraftLocation.match(/\/workflows\/([^?]+)/)?.[1];

    assert.ok(templateDraftId, "Template draft redirect should include the new template id.");
    assert.ok(workflowDraftId, "Workflow draft redirect should include the new workflow id.");

    const [templateDraftDetailPage, workflowDraftDetailPage] = await Promise.all([
      app.inject({
        method: "GET",
        url: templateDraftLocation,
      }),
      app.inject({
        method: "GET",
        url: workflowDraftLocation,
      }),
    ]);

    assert.equal(templateDraftDetailPage.statusCode, 200, "Created template draft detail should render.");
    assert.equal(workflowDraftDetailPage.statusCode, 200, "Created workflow draft detail should render.");
    assert.match(templateDraftDetailPage.body, /Template angelegt/);
    assert.match(templateDraftDetailPage.body, /Smoke Template/);
    assert.match(templateDraftDetailPage.body, /draft/);
    assert.match(workflowDraftDetailPage.body, /Workflow angelegt/);
    assert.match(workflowDraftDetailPage.body, /Smoke Workflow/);
    assert.match(workflowDraftDetailPage.body, /draft/);

    const [templatesAfterCreate, workflowsAfterCreate] = await Promise.all([
      listFormTemplates(),
      listWorkflowTemplates(),
    ]);

    assert.ok(
      templatesAfterCreate.some((template) => template.id === templateDraftId && template.status === "draft"),
      "New template draft should persist in the database.",
    );
    assert.ok(
      workflowsAfterCreate.some((workflow) => workflow.id === workflowDraftId && workflow.status === "draft"),
      "New workflow draft should persist in the database.",
    );

    const createAdminUser = await app.inject({
      method: "POST",
      url: "/admin/users/new?user=alice",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: "displayName=Smoke%20User&key=smoke-user&email=smoke.user%40example.local",
    });
    const createAdminGroup = await app.inject({
      method: "POST",
      url: "/admin/groups/new?user=alice",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: "name=Smoke%20Group&key=smoke-group&description=Smoke%20group%20for%20admin",
    });

    assert.equal(createAdminUser.statusCode, 303, "Admin user creation should redirect back to admin.");
    assert.equal(createAdminGroup.statusCode, 303, "Admin group creation should redirect back to admin.");

    const [adminAfterUserCreate, adminAfterGroupCreate, usersAfterAdminCreate, groupsAfterAdminCreate] = await Promise.all([
      app.inject({
        method: "GET",
        url: String(createAdminUser.headers.location ?? ""),
      }),
      app.inject({
        method: "GET",
        url: String(createAdminGroup.headers.location ?? ""),
      }),
      listUsers(),
      listGroups(),
    ]);

    assert.equal(adminAfterUserCreate.statusCode, 200, "Admin page should render after user creation.");
    assert.equal(adminAfterGroupCreate.statusCode, 200, "Admin page should render after group creation.");
    assert.match(adminAfterUserCreate.body, /User angelegt/);
    assert.match(adminAfterUserCreate.body, /Smoke User/);
    assert.match(adminAfterGroupCreate.body, /Group angelegt/);
    assert.match(adminAfterGroupCreate.body, /Smoke Group/);
    assert.ok(
      usersAfterAdminCreate.some((user) => user.key === "smoke-user" && user.displayName === "Smoke User"),
      "New admin user should persist in the database.",
    );
    assert.ok(
      groupsAfterAdminCreate.some((group) => group.key === "smoke-group" && group.name === "Smoke Group"),
      "New admin group should persist in the database.",
    );

    const createdUser = usersAfterAdminCreate.find((user) => user.key === "smoke-user");
    const createdGroup = groupsAfterAdminCreate.find((group) => group.key === "smoke-group");

    assert.ok(createdUser, "Created admin user should be queryable for detail/edit paths.");
    assert.ok(createdGroup, "Created admin group should be queryable for detail/edit paths.");

    const hiddenContextChecks = await Promise.all([
      app.inject({
        method: "GET",
        url: `/templates?user=${createdUser.key}`,
      }),
      app.inject({
        method: "GET",
        url: `/documents?user=${createdUser.key}`,
      }),
      app.inject({
        method: "GET",
        url: `/documents/99999999-9999-9999-9999-999999999991?user=${createdUser.key}`,
      }),
      app.inject({
        method: "POST",
        url: `/documents/start?user=${createdUser.key}`,
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        payload: "templateId=77777777-7777-7777-7777-777777777772",
      }),
    ]);

    assert.equal(hiddenContextChecks[0].statusCode, 200, "Templates page should render for a user without visibility.");
    assert.equal(hiddenContextChecks[1].statusCode, 200, "Documents page should render for a user without visibility.");
    assert.equal(hiddenContextChecks[2].statusCode, 404, "Document detail should be hidden without template visibility.");
    assert.equal(hiddenContextChecks[3].statusCode, 302, "Start without visible template should redirect with an error.");
    assert.match(hiddenContextChecks[0].body, /Keine Templates sichtbar/);
    assert.match(hiddenContextChecks[1].body, /Keine Documents gefunden/);
    assert.match(String(hiddenContextChecks[3].headers.location ?? ""), /startError=/);

    const adminUserDetailPage = await app.inject({
      method: "GET",
      url: `/admin/users/${createdUser.id}?user=alice`,
    });
    const adminUserEditPage = await app.inject({
      method: "GET",
      url: `/admin/users/${createdUser.id}/edit?user=alice`,
    });
    const adminGroupDetailPage = await app.inject({
      method: "GET",
      url: `/admin/groups/${createdGroup.id}?user=alice`,
    });
    const adminGroupEditPage = await app.inject({
      method: "GET",
      url: `/admin/groups/${createdGroup.id}/edit?user=alice`,
    });

    assert.equal(adminUserDetailPage.statusCode, 200, "Admin user detail should render.");
    assert.equal(adminUserEditPage.statusCode, 200, "Admin user edit should render.");
    assert.equal(adminGroupDetailPage.statusCode, 200, "Admin group detail should render.");
    assert.equal(adminGroupEditPage.statusCode, 200, "Admin group edit should render.");
    assert.match(adminUserDetailPage.body, /Edit User/);
    assert.match(adminUserDetailPage.body, /Add Membership/);
    assert.match(adminUserEditPage.body, /Save User/);
    assert.match(adminGroupDetailPage.body, /Edit Group/);
    assert.match(adminGroupDetailPage.body, /Members/);
    assert.match(adminGroupDetailPage.body, /Assign Template/);
    assert.match(adminGroupEditPage.body, /Save Group/);

    const addMembership = await app.inject({
      method: "POST",
      url: `/admin/users/${createdUser.id}/memberships?user=alice`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `groupId=${encodeURIComponent(createdGroup.id)}&rights=r&rights=w`,
    });

    assert.equal(addMembership.statusCode, 303, "Membership add should redirect back to user detail.");

    const addMembershipLocation = String(addMembership.headers.location ?? "");
    const [userDetailAfterMembershipAdd, groupDetailAfterMembershipAdd, membershipsAfterAdd] = await Promise.all([
      app.inject({
        method: "GET",
        url: addMembershipLocation,
      }),
      app.inject({
        method: "GET",
        url: `/admin/groups/${createdGroup.id}?user=alice`,
      }),
      listMemberships(),
    ]);

    const createdMembership = membershipsAfterAdd.find(
      (membership) => membership.userId === createdUser.id && membership.groupId === createdGroup.id,
    );

    assert.ok(createdMembership, "Created membership should persist in the database.");
    assert.equal(userDetailAfterMembershipAdd.statusCode, 200, "User detail should render after membership add.");
    assert.equal(groupDetailAfterMembershipAdd.statusCode, 200, "Group detail should render after membership add.");
    assert.match(userDetailAfterMembershipAdd.body, /Membership angelegt/);
    assert.match(userDetailAfterMembershipAdd.body, /Smoke Group/);
    assert.match(userDetailAfterMembershipAdd.body, /r:yes[\s\S]*w:yes[\s\S]*x:no/);
    assert.match(groupDetailAfterMembershipAdd.body, /Smoke User/);

    const removeMembershipResponse = await app.inject({
      method: "POST",
      url: `/admin/users/${createdUser.id}/memberships/${createdMembership.id}/remove?user=alice`,
    });

    assert.equal(removeMembershipResponse.statusCode, 303, "Membership remove should redirect back to user detail.");

    const removeMembershipLocation = String(removeMembershipResponse.headers.location ?? "");
    const [userDetailAfterMembershipRemove, membershipsAfterRemove] = await Promise.all([
      app.inject({
        method: "GET",
        url: removeMembershipLocation,
      }),
      listMemberships(),
    ]);

    assert.equal(userDetailAfterMembershipRemove.statusCode, 200, "User detail should render after membership remove.");
    assert.match(userDetailAfterMembershipRemove.body, /Membership entfernt/);
    assert.match(userDetailAfterMembershipRemove.body, /Keine Memberships vorhanden/);
    assert.ok(
      !membershipsAfterRemove.some((membership) => membership.id === createdMembership.id),
      "Removed membership should no longer exist in the database.",
    );

    const addTemplateAssignment = await app.inject({
      method: "POST",
      url: `/admin/groups/${createdGroup.id}/template-assignments?user=alice`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `templateId=${encodeURIComponent(templateDraftId)}`,
    });

    assert.equal(addTemplateAssignment.statusCode, 303, "Template assignment add should redirect back to group detail.");

    const addTemplateAssignmentLocation = String(addTemplateAssignment.headers.location ?? "");
    const [groupDetailAfterTemplateAssignmentAdd, templateDetailAfterAssignmentAdd, assignmentsAfterAdd] = await Promise.all([
      app.inject({
        method: "GET",
        url: addTemplateAssignmentLocation,
      }),
      app.inject({
        method: "GET",
        url: `/templates/${templateDraftId}?user=alice`,
      }),
      listTemplateAssignments(),
    ]);

    const createdTemplateAssignment = assignmentsAfterAdd.find(
      (assignment) => assignment.groupId === createdGroup.id && assignment.templateId === templateDraftId,
    );

    assert.ok(createdTemplateAssignment, "Created template assignment should persist in the database.");
    assert.equal(groupDetailAfterTemplateAssignmentAdd.statusCode, 200, "Group detail should render after template assignment add.");
    assert.equal(templateDetailAfterAssignmentAdd.statusCode, 200, "Template detail should render after assignment add.");
    assert.match(groupDetailAfterTemplateAssignmentAdd.body, /Template Assignment angelegt/);
    assert.match(groupDetailAfterTemplateAssignmentAdd.body, /Smoke Template/);
    assert.match(templateDetailAfterAssignmentAdd.body, /Smoke Group/);
    assert.match(templateDetailAfterAssignmentAdd.body, /Pflege im ersten Schnitt ueber die jeweilige Group-Detailseite/);

    const removeTemplateAssignmentResponse = await app.inject({
      method: "POST",
      url: `/admin/groups/${createdGroup.id}/template-assignments/${createdTemplateAssignment.id}/remove?user=alice`,
    });

    assert.equal(removeTemplateAssignmentResponse.statusCode, 303, "Template assignment remove should redirect back to group detail.");

    const removeTemplateAssignmentLocation = String(removeTemplateAssignmentResponse.headers.location ?? "");
    const [groupDetailAfterTemplateAssignmentRemove, assignmentsAfterRemove] = await Promise.all([
      app.inject({
        method: "GET",
        url: removeTemplateAssignmentLocation,
      }),
      listTemplateAssignments(),
    ]);

    assert.equal(groupDetailAfterTemplateAssignmentRemove.statusCode, 200, "Group detail should render after template assignment remove.");
    assert.match(groupDetailAfterTemplateAssignmentRemove.body, /Template Assignment entfernt/);
    assert.match(groupDetailAfterTemplateAssignmentRemove.body, /Keine Template Assignments vorhanden/);
    assert.ok(
      !assignmentsAfterRemove.some((assignment) => assignment.id === createdTemplateAssignment.id),
      "Removed template assignment should no longer exist in the database.",
    );

    const editAdminUser = await app.inject({
      method: "POST",
      url: `/admin/users/${createdUser.id}/edit?user=alice`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: "displayName=Smoke%20User%20Updated&email=updated.user%40example.local&status=inactive",
    });
    const editAdminGroup = await app.inject({
      method: "POST",
      url: `/admin/groups/${createdGroup.id}/edit?user=alice`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: "name=Smoke%20Group%20Updated&description=Updated%20admin%20group&status=inactive",
    });

    assert.equal(editAdminUser.statusCode, 303, "Admin user edit should redirect to detail.");
    assert.equal(editAdminGroup.statusCode, 303, "Admin group edit should redirect to detail.");

    const [updatedAdminUserDetail, updatedAdminGroupDetail, usersAfterAdminEdit, groupsAfterAdminEdit] = await Promise.all([
      app.inject({
        method: "GET",
        url: String(editAdminUser.headers.location ?? ""),
      }),
      app.inject({
        method: "GET",
        url: String(editAdminGroup.headers.location ?? ""),
      }),
      listUsers(),
      listGroups(),
    ]);

    assert.equal(updatedAdminUserDetail.statusCode, 200, "Updated admin user detail should render.");
    assert.equal(updatedAdminGroupDetail.statusCode, 200, "Updated admin group detail should render.");
    assert.match(updatedAdminUserDetail.body, /User aktualisiert/);
    assert.match(updatedAdminUserDetail.body, /Smoke User Updated/);
    assert.match(updatedAdminUserDetail.body, /inactive/);
    assert.match(updatedAdminGroupDetail.body, /Group aktualisiert/);
    assert.match(updatedAdminGroupDetail.body, /Smoke Group Updated/);
    assert.match(updatedAdminGroupDetail.body, /inactive/);
    assert.ok(
      usersAfterAdminEdit.some((user) => user.id === createdUser.id && user.displayName === "Smoke User Updated" && user.status === "inactive"),
      "Admin user edit should persist updated display name and status.",
    );
    assert.ok(
      groupsAfterAdminEdit.some((group) => group.id === createdGroup.id && group.name === "Smoke Group Updated" && group.status === "inactive"),
      "Admin group edit should persist updated name and status.",
    );

    const location = startDocument.headers.location;
    assert.ok(typeof location === "string", "Document start should return a redirect location.");

    const startedDocumentId = typeof location === "string" ? location.match(/\/documents\/([^?]+)/)?.[1] : undefined;
    assert.ok(startedDocumentId, "Redirect location should include the new document id.");

    const startedDetail = await app.inject({
      method: "GET",
      url: location,
    });
    const saveDocument = await app.inject({
      method: "POST",
      url: `/documents/${startedDocumentId}/save?user=alice`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: "batch_id=B-2026-SMOKE&fulfillment_flags=prepared&fulfillment_flags=released",
    });

    assert.equal(startedDetail.statusCode, 200, "Started document detail should render.");
    assert.match(startedDetail.body, /Production Batch/);
    assert.match(startedDetail.body, /Document created from template Production Batch/);
    assert.equal(saveDocument.statusCode, 303, "Document save should redirect back to the detail page.");

    const savedLocation = saveDocument.headers.location;
    assert.ok(typeof savedLocation === "string", "Document save should return a redirect location.");

    const savedDetail = await app.inject({
      method: "GET",
      url: savedLocation,
    });

    assert.equal(savedDetail.statusCode, 200, "Saved document detail should render.");
    assert.match(savedDetail.body, /Werte gespeichert\./);
    assert.match(savedDetail.body, /prepared, released/);
    assert.match(
      savedDetail.body,
      /Production Batch/,
      "Created production document should keep its default title while batch_id is still readonly.",
    );

    const [aliceAssignedDocumentsAfterStart, startedDocumentDetail, startedDocumentAuditEvents] = await Promise.all([
      listDocumentsAssignedToUser(alice.id),
      findDocumentDetailVisibleToUser(startedDocumentId, alice.id),
      listAuditEventsForDocument(startedDocumentId),
    ]);

    assert.equal(
      aliceAssignedDocumentsAfterStart.length,
      aliceAssignedDocuments.length + 1,
      "Starting a document should create a new assigned document for Alice.",
    );
    assert.ok(
      startedDocumentAuditEvents.some((event) => event.eventType === "created"),
      "Started document should persist a created audit event.",
    );
    assert.ok(startedDocumentDetail, "Started document should remain visible after save.");
    assert.equal(
      startedDocumentDetail.documentDataJson.batch_id,
      undefined,
      "Readonly batch_id should not be persisted while the document is still in created status.",
    );
    assert.deepEqual(
      startedDocumentDetail.documentDataJson.fulfillment_flags,
      ["prepared", "released"],
      "Saved checkbox values should persist in documents.data_json.",
    );
    assert.ok(
      startedDocumentAuditEvents.some((event) => event.eventType === "saved"),
      "Started document should persist a saved audit event.",
    );

    const startNextFormDocument = await app.inject({
      method: "POST",
      url: "/documents/start?user=alice",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `templateId=${encodeURIComponent(String(publishedTemplateId))}`,
    });

    assert.equal(startNextFormDocument.statusCode, 303, "Customer-order reference document start should redirect.");

    const nextFormDocumentLocation = startNextFormDocument.headers.location;
    assert.ok(typeof nextFormDocumentLocation === "string", "Customer-order reference document start should return a redirect location.");

    const nextFormDocumentId = typeof nextFormDocumentLocation === "string"
      ? nextFormDocumentLocation.match(/\/documents\/([^?]+)/)?.[1]
      : undefined;
    assert.ok(nextFormDocumentId, "Customer-order reference document redirect should include the new document id.");

    const nextFormDocumentDetail = await app.inject({
      method: "GET",
      url: nextFormDocumentLocation,
    });
    const runNextFormAction = await app.inject({
      method: "POST",
      url: `/documents/${nextFormDocumentId}/next-form?user=alice`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "hx-request": "true",
      },
      payload: `intent=run-action&actionName=load_customer&order_number=${encodeURIComponent(liveLookupSample.orderNumber)}&customer=&service_location=&customer_master_id=&customer_master_status=&customer_order_status=&customer_order_created_at=&product_master_id=&product_master_type=&product_master_status=`,
    });
    const runMaterialSuggestion = await app.inject({
      method: "POST",
      url: `/documents/${nextFormDocumentId}/next-form?user=alice`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "hx-request": "true",
      },
      payload: `intent=run-action&actionName=suggest_material&order_number=${encodeURIComponent(liveLookupSample.orderNumber)}&customer=${encodeURIComponent(liveLookupSample.customerName)}&service_location=&customer_master_id=${encodeURIComponent(liveLookupSample.customerId)}&customer_master_status=${encodeURIComponent(liveLookupSample.customerStatus)}&customer_order_status=${encodeURIComponent(liveLookupSample.orderStatus)}&customer_order_created_at=${encodeURIComponent(liveLookupSample.orderCreatedAt)}&work_description=${encodeURIComponent("batch")}&material=&product_master_id=&product_master_type=&product_master_status=`,
    });
    const saveNextFormSlice = await app.inject({
      method: "POST",
      url: `/documents/${nextFormDocumentId}/next-form?user=alice`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "hx-request": "true",
      },
      payload: `intent=save-next-form&order_number=${encodeURIComponent(liveLookupSample.orderNumber)}&customer=${encodeURIComponent(liveLookupSample.customerName)}&service_location=&customer_master_id=${encodeURIComponent(liveLookupSample.customerId)}&customer_master_status=${encodeURIComponent(liveLookupSample.customerStatus)}&customer_order_status=${encodeURIComponent(liveLookupSample.orderStatus)}&customer_order_created_at=${encodeURIComponent(liveLookupSample.orderCreatedAt)}&work_description=${encodeURIComponent("batch")}&material=${encodeURIComponent(liveLookupSample.productName)}&product_master_id=${encodeURIComponent(liveLookupSample.productId)}&product_master_type=${encodeURIComponent(liveLookupSample.productType)}&product_master_status=${encodeURIComponent(liveLookupSample.productStatus)}&labor_hours=${encodeURIComponent("2.5")}&travel_hours=${encodeURIComponent("0.5")}&break_minutes=${encodeURIComponent("30")}`,
    });
    const nextFormAttachmentUpload = buildMultipartUpload("smoke-attachment.txt", "text/plain", "smoke attachment content");
    const firstJournalEntryText = "First smoke journal entry";
    const secondJournalEntryText = "Second smoke journal entry with a deliberately long text that should be truncated in the compact table view but remain fully readable in the quiet full view of the journal entry details panel.";
    const truncatedSecondJournalEntryText = truncateLikeJournalUi(secondJournalEntryText);
    const uploadNextFormAttachment = await app.inject({
      method: "POST",
      url: `/documents/${nextFormDocumentId}/attachments?user=alice`,
      headers: {
        "content-type": `multipart/form-data; boundary=${nextFormAttachmentUpload.boundary}`,
        "hx-request": "true",
      },
      payload: nextFormAttachmentUpload.payload,
    });
    const addNextFormJournalEntry = await app.inject({
      method: "POST",
      url: `/documents/${nextFormDocumentId}/journal?user=alice`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "hx-request": "true",
      },
      payload: `journalFieldName=work_journal&entryText=${encodeURIComponent(firstJournalEntryText)}`,
    });
    const addSecondNextFormJournalEntry = await app.inject({
      method: "POST",
      url: `/documents/${nextFormDocumentId}/journal?user=alice`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "hx-request": "true",
      },
      payload: `journalFieldName=work_journal&entryText=${encodeURIComponent(secondJournalEntryText)}`,
    });

    assert.equal(nextFormDocumentDetail.statusCode, 200, "Started customer-order reference detail should render.");
    assert.match(nextFormDocumentDetail.body, /Kein weiterer direkter Schritt fuer den aktuellen User\./);
    assert.match(nextFormDocumentDetail.body, /Dokument:<\/strong>\s*Customer Order/);
    assert.match(nextFormDocumentDetail.body, /Formular:<\/strong>\s*Customer Order Test v2/);
    assert.match(nextFormDocumentDetail.body, /Workflow:<\/strong>\s*Customer Order Group Submit v1/);
    assert.match(nextFormDocumentDetail.body, /Gestartet aus Formular v2 und Workflow v1/);
    assert.match(nextFormDocumentDetail.body, /Assignments & Tasks/);
    assert.match(nextFormDocumentDetail.body, /data-fragment="document-header"/);
    assert.match(nextFormDocumentDetail.body, /data-fragment="document-context"/);
    assert.match(nextFormDocumentDetail.body, /data-fragment="document-workspace"/);
    assert.match(nextFormDocumentDetail.body, /data-fragment="document-workflow-zone"/);
    assert.match(nextFormDocumentDetail.body, /data-fragment="document-form-body"/);
    assert.match(nextFormDocumentDetail.body, /data-fragment="document-attachments"/);
    assert.match(nextFormDocumentDetail.body, /data-fragment="document-journal"/);
    assert.match(nextFormDocumentDetail.body, /data-fragment="document-history"/);
    assert.match(nextFormDocumentDetail.body, /id="document-header-fragment"/);
    assert.match(nextFormDocumentDetail.body, /id="document-workspace-fragment"/);
    assert.match(nextFormDocumentDetail.body, /id="document-workflow-zone-fragment"/);
    assert.match(nextFormDocumentDetail.body, /id="document-form-body-fragment"/);
    assert.match(nextFormDocumentDetail.body, /id="document-history-fragment"/);
    assert.match(nextFormDocumentDetail.body, /\/public\/vendor\/htmx\/htmx\.min\.js/);
    assert.match(nextFormDocumentDetail.body, /<h3>Formular<\/h3>/);
    assert.match(nextFormDocumentDetail.body, /History/);
    assert.match(nextFormDocumentDetail.body, /Letzte Aktion:/);
    assert.match(nextFormDocumentDetail.body, /name="order_number"/);
    assert.match(nextFormDocumentDetail.body, /name="work_description"/);
    assert.match(nextFormDocumentDetail.body, /name="labor_hours"/);
    assert.match(nextFormDocumentDetail.body, /name="travel_hours"/);
    assert.match(nextFormDocumentDetail.body, /name="break_minutes"/);
    assert.match(nextFormDocumentDetail.body, /Werte speichern/);
    assert.match(nextFormDocumentDetail.body, /hx-post="\/documents\/.*\/next-form\?user=alice"/);
    assert.match(nextFormDocumentDetail.body, /hx-swap="outerHTML show:none"/);
    assert.match(nextFormDocumentDetail.body, /Submit<\/button>/);
    assert.match(nextFormDocumentDetail.body, /Fuer Submit fehlen noch Angaben\./);
    assert.match(nextFormDocumentDetail.body, /Pflichtfelder fehlen: Auftragsnummer, Kunde, Taetigkeitsbeschreibung, Material\./);
    assert.match(nextFormDocumentDetail.body, /data-inline-action="load_customer"/);
    assert.match(nextFormDocumentDetail.body, /data-inline-action="suggest_material"/);
    assert.match(nextFormDocumentDetail.body, /data-field-name="order_number"[\s\S]*data-field-required="true"[\s\S]*data-field-state="editable"/);
    assert.match(nextFormDocumentDetail.body, /data-field-name="customer"[\s\S]*data-field-required="true"[\s\S]*data-field-state="readonly"/);
    assert.match(nextFormDocumentDetail.body, /data-field-name="service_location"[\s\S]*data-control-type="textarea"[\s\S]*data-control-runtime-role="lookup_prefill"[\s\S]*data-control-lookup-role="result"[\s\S]*data-field-required="false"[\s\S]*data-field-state="editable"/);
    assert.match(nextFormDocumentDetail.body, /data-field-name="labor_hours"[\s\S]*data-field-required="false"[\s\S]*data-field-state="editable"/);
    assert.match(nextFormDocumentDetail.body, /data-field-name="approval_status"[\s\S]*data-field-required="false"[\s\S]*data-field-state="readonly"/);
    assert.match(nextFormDocumentDetail.body, /data-masterdata-section="customer"/);
    assert.match(nextFormDocumentDetail.body, /data-masterdata-section="product"/);
    assert.match(nextFormDocumentDetail.body, /Kunden-ID/);
    assert.match(nextFormDocumentDetail.body, /Produkttyp/);
    assert.match(nextFormDocumentDetail.body, /<h3>Attachments<\/h3>/);
    assert.match(nextFormDocumentDetail.body, /Noch kein Attachment vorhanden\./);
    assert.match(nextFormDocumentDetail.body, /Upload aktuell erlaubt/);
    assert.match(nextFormDocumentDetail.body, /Editor-Zuweisung/);
    assert.match(nextFormDocumentDetail.body, /hx-post="\/documents\/.*\/attachments\?user=alice"/);
    assert.match(nextFormDocumentDetail.body, /<h3>Journal<\/h3>/);
    assert.match(nextFormDocumentDetail.body, /Noch kein Journal-Eintrag vorhanden\./);
    assert.match(nextFormDocumentDetail.body, /<th>Zeitpunkt<\/th>/);
    assert.match(nextFormDocumentDetail.body, /<th>Von<\/th>/);
    assert.match(nextFormDocumentDetail.body, /<th>Eintrag<\/th>/);
    assert.match(nextFormDocumentDetail.body, /journal-panel-stack/);
    assert.match(nextFormDocumentDetail.body, /hx-post="\/documents\/.*\/journal\?user=alice"/);
    assert.doesNotMatch(nextFormDocumentDetail.body, /Kein Journal im aktuellen Template definiert\./);
    assert.match(nextFormDocumentDetail.body, /Kundendaten laden/);
    assert.match(nextFormDocumentDetail.body, /Materialvorschlag holen/);
    assert.match(nextFormDocumentDetail.body, /name="material"/);
    assert.match(nextFormDocumentDetail.body, /hx-target="#document-workspace-fragment"/);
    assert.doesNotMatch(nextFormDocumentDetail.body, /Im normalen Dokumentpfad jetzt editierbar/);
    assert.doesNotMatch(nextFormDocumentDetail.body, /technisch aus ERP-SIM Products vorgeschlagen/);
    assert.doesNotMatch(nextFormDocumentDetail.body, /Mehrzeiliges Feld im neuen Modell/);
    assert.doesNotMatch(nextFormDocumentDetail.body, /New \.form\.md Model/);
    assert.doesNotMatch(nextFormDocumentDetail.body, /Primary Work Area/);
    assert.doesNotMatch(nextFormDocumentDetail.body, /Workflow Status/);
    assert.doesNotMatch(nextFormDocumentDetail.body, /Workflow Actions/);
    assert.doesNotMatch(nextFormDocumentDetail.body, /Dateibasis:/);
    assert.doesNotMatch(nextFormDocumentDetail.body, /Document Mapping/);
    assert.doesNotMatch(nextFormDocumentDetail.body, /Approve/);
    assert.doesNotMatch(nextFormDocumentDetail.body, /Reject/);
    assert.doesNotMatch(nextFormDocumentDetail.body, /Alt Model \(MDX\)/);
    assert.doesNotMatch(nextFormDocumentDetail.body, /Legacy Transition Area/);
    assert.doesNotMatch(nextFormDocumentDetail.body, /data-form-reference-section="production_batch"/);

    assert.equal(runNextFormAction.statusCode, 200, "Running the next-form action in normal document detail via HTMX should return the workspace fragment.");
    assert.match(runNextFormAction.body, /id="document-workspace-fragment"/);
    assert.match(runNextFormAction.body, /data-fragment="document-workspace"/);
    assert.doesNotMatch(runNextFormAction.body, /id="document-header-fragment"/);
    assert.doesNotMatch(runNextFormAction.body, /id="document-history-fragment"/);
    assert.match(runNextFormAction.body, new RegExp(liveLookupSample.orderNumber.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(runNextFormAction.body, new RegExp(liveLookupSample.customerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(runNextFormAction.body, /Kundendaten geladen/);
    assert.match(runNextFormAction.body, /Nicht im ERP-SIM vorhanden/);
    assert.match(runNextFormAction.body, /data-masterdata-section="customer"/);
    assert.match(runNextFormAction.body, /Kunden-ID/);
    assert.match(runNextFormAction.body, /Kundenstatus/);
    assert.match(runNextFormAction.body, /Auftragstatus/);
    assert.match(runNextFormAction.body, /Aktiv/);
    assert.match(runNextFormAction.body, /Werte speichern/);
    assert.match(runNextFormAction.body, /Fuer Submit fehlen noch Angaben\./);

    assert.equal(runMaterialSuggestion.statusCode, 200, "Running the product-based material lookup via HTMX should return the workspace fragment.");
    assert.match(runMaterialSuggestion.body, /id="document-workspace-fragment"/);
    assert.doesNotMatch(runMaterialSuggestion.body, /id="document-header-fragment"/);
    assert.doesNotMatch(runMaterialSuggestion.body, /id="document-history-fragment"/);
    assert.match(runMaterialSuggestion.body, /Materialvorschlag geladen/);
    assert.match(runMaterialSuggestion.body, /Batch Product A/);
    assert.match(
      runMaterialSuggestion.body,
      /Materialvorschlag fuer (?:&#34;|")batch(?:&#34;|"): Batch Product A\./,
    );
    assert.match(runMaterialSuggestion.body, /data-masterdata-section="product"/);
    assert.match(runMaterialSuggestion.body, /Produkt-ID/);
    assert.match(runMaterialSuggestion.body, /Produkttyp/);
    assert.match(runMaterialSuggestion.body, /Produktstatus/);
    assert.match(runMaterialSuggestion.body, /data-form-reference-section="production_batch"/);
    assert.match(runMaterialSuggestion.body, /Produktionsbatch/);
    assert.match(runMaterialSuggestion.body, /Aus anderem Formular: Batch B-2026-0042/);
    assert.match(runMaterialSuggestion.body, /Production Batch v1/);
    assert.match(runMaterialSuggestion.body, /Fulfillment Flags/);
    assert.match(runMaterialSuggestion.body, /prepared, checked/);
    assert.match(runMaterialSuggestion.body, /Letzter Prüfschritt/);
    assert.match(runMaterialSuggestion.body, /Packaging verified\./);
    assert.match(runMaterialSuggestion.body, /\/documents\/99999999-9999-9999-9999-999999999992\?user=alice/);
    assert.match(runMaterialSuggestion.body, /batch/);
    assert.match(runMaterialSuggestion.body, /Fuer Submit fehlen noch Angaben\./);

    assert.equal(saveNextFormSlice.statusCode, 200, "Saving the normal next-form document slice via HTMX should return the workspace fragment.");
    assert.match(saveNextFormSlice.body, /id="document-workspace-fragment"/);
    assert.match(saveNextFormSlice.body, /id="document-header-fragment".*hx-swap-oob="outerHTML"/s);
    assert.match(saveNextFormSlice.body, /id="document-history-fragment".*hx-swap-oob="outerHTML"/s);
    assert.match(saveNextFormSlice.body, /Werte gespeichert\./);
    assert.match(saveNextFormSlice.body, /Batch Product A/);
    assert.match(saveNextFormSlice.body, /value="2\.5"/);
    assert.match(saveNextFormSlice.body, /value="0\.5"/);
    assert.match(saveNextFormSlice.body, /value="30"/);
    assert.match(saveNextFormSlice.body, /name="customer_master_id"/);
    assert.match(saveNextFormSlice.body, /name="product_master_type"/);
    assert.match(saveNextFormSlice.body, /data-form-reference-section="production_batch"/);
    assert.match(saveNextFormSlice.body, /Aus anderem Formular: Batch B-2026-0042/);
    assert.match(saveNextFormSlice.body, /Submit<\/button>/);
    assert.doesNotMatch(saveNextFormSlice.body, /Fuer Submit fehlen noch Angaben\./);
    assert.equal(uploadNextFormAttachment.statusCode, 200, "Uploading a reference attachment via HTMX should return the attachment fragment.");
    assert.match(uploadNextFormAttachment.body, /id="document-attachments-fragment"/);
    assert.match(uploadNextFormAttachment.body, /id="document-history-fragment".*hx-swap-oob="outerHTML"/s);
    assert.doesNotMatch(uploadNextFormAttachment.body, /id="document-header-fragment"/);
    assert.match(uploadNextFormAttachment.body, /Upload erfolgreich/);
    assert.match(uploadNextFormAttachment.body, /Attachment hochgeladen\./);
    assert.match(uploadNextFormAttachment.body, /Letztes Attachment:/);
    assert.match(uploadNextFormAttachment.body, /smoke-attachment\.txt/);
    assert.equal(addNextFormJournalEntry.statusCode, 200, "Adding a reference journal entry via HTMX should return the journal fragment.");
    assert.match(addNextFormJournalEntry.body, /id="document-journal-fragment"/);
    assert.match(addNextFormJournalEntry.body, /id="document-header-fragment".*hx-swap-oob="outerHTML"/s);
    assert.match(addNextFormJournalEntry.body, /id="document-history-fragment".*hx-swap-oob="outerHTML"/s);
    assert.match(addNextFormJournalEntry.body, /Journal-Eintrag hinzugefuegt\./);
    assert.match(addNextFormJournalEntry.body, /Letzter Eintrag:/);
    assert.match(addNextFormJournalEntry.body, /First smoke journal entry/);
    assert.match(addNextFormJournalEntry.body, /Alice/);
    assert.equal(addSecondNextFormJournalEntry.statusCode, 200, "Adding the second reference journal entry via HTMX should return the journal fragment.");
    assert.match(addSecondNextFormJournalEntry.body, /id="document-journal-fragment"/);
    assert.match(addSecondNextFormJournalEntry.body, /id="document-header-fragment".*hx-swap-oob="outerHTML"/s);
    assert.match(addSecondNextFormJournalEntry.body, /id="document-history-fragment".*hx-swap-oob="outerHTML"/s);
    assert.match(addSecondNextFormJournalEntry.body, /Journal-Eintrag hinzugefuegt\./);
    assert.match(addSecondNextFormJournalEntry.body, /journal-entry-dialog/);
    assert.match(addSecondNextFormJournalEntry.body, /data-journal-dialog-open=/);
    assert.match(addSecondNextFormJournalEntry.body, /Vollansicht/);
    assert.match(addSecondNextFormJournalEntry.body, new RegExp(truncatedSecondJournalEntryText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(addSecondNextFormJournalEntry.body, new RegExp(secondJournalEntryText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.doesNotMatch(addSecondNextFormJournalEntry.body, /journal-entry-details/);
    assert.ok(
      addSecondNextFormJournalEntry.body.indexOf(truncatedSecondJournalEntryText) < addSecondNextFormJournalEntry.body.indexOf(firstJournalEntryText),
      "Newest journal entries should render above older entries.",
    );

    const savedNextFormDetail = await app.inject({
      method: "GET",
      url: `/documents/${nextFormDocumentId}?user=alice`,
    });

    assert.equal(savedNextFormDetail.statusCode, 200, "Saved normal next-form document detail should render.");
    assert.match(savedNextFormDetail.body, /First smoke journal entry/);
    assert.match(savedNextFormDetail.body, new RegExp(truncatedSecondJournalEntryText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(savedNextFormDetail.body, /journal-entry-dialog/);
    assert.match(savedNextFormDetail.body, /data-journal-dialog-open=/);
    assert.match(savedNextFormDetail.body, /Vollansicht/);
    assert.match(savedNextFormDetail.body, /Letzter Eintrag:/);
    assert.match(savedNextFormDetail.body, new RegExp(liveLookupSample.orderNumber.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(savedNextFormDetail.body, new RegExp(liveLookupSample.customerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(savedNextFormDetail.body, /name="service_location"/);
    assert.doesNotMatch(savedNextFormDetail.body, /Nicht im ERP-SIM vorhanden/);
    assert.match(savedNextFormDetail.body, /batch/);
    assert.match(savedNextFormDetail.body, /Batch Product A/);
    assert.match(savedNextFormDetail.body, /data-masterdata-section="customer"/);
    assert.match(savedNextFormDetail.body, /data-masterdata-section="product"/);
    assert.match(savedNextFormDetail.body, /data-form-reference-section="production_batch"/);
    assert.match(savedNextFormDetail.body, /Aus anderem Formular: Batch B-2026-0042/);
    assert.match(savedNextFormDetail.body, /Production Batch v1/);
    assert.match(savedNextFormDetail.body, /prepared, checked/);
    assert.match(savedNextFormDetail.body, /Packaging verified\./);
    assert.match(savedNextFormDetail.body, /data-field-name="service_location"[\s\S]*data-field-required="false"[\s\S]*data-field-state="editable"/);
    assert.match(savedNextFormDetail.body, /Kunden-ID/);
    assert.match(savedNextFormDetail.body, /Produkttyp/);
    assert.match(savedNextFormDetail.body, /smoke-attachment\.txt/);
    assert.match(savedNextFormDetail.body, /Letztes Attachment:/);
    assert.match(savedNextFormDetail.body, /value="2\.5"/);
    assert.match(savedNextFormDetail.body, /value="0\.5"/);
    assert.match(savedNextFormDetail.body, /value="30"/);
    assert.match(savedNextFormDetail.body, /Naechster Schritt: Submit/);
    assert.match(savedNextFormDetail.body, /Submit<\/button>/);
    assert.match(savedNextFormDetail.body, /hx-post="\/documents\/.*\/submit\?user=alice"/);

    const savedNextFormDocument = await findDocumentDetailVisibleToUser(nextFormDocumentId, alice.id);
    assert.ok(savedNextFormDocument, "Saved next-form reference document should remain visible.");
    assert.equal(savedNextFormDocument.documentDataJson.customer_order_number, liveLookupSample.orderNumber);
    assert.equal(savedNextFormDocument.documentDataJson.customer_name, liveLookupSample.customerName);
    assert.equal(savedNextFormDocument.documentDataJson.service_location, "");
    assert.equal(savedNextFormDocument.documentDataJson.customer_master_id, liveLookupSample.customerId);
    assert.equal(savedNextFormDocument.documentDataJson.customer_master_status, liveLookupSample.customerStatus);
    assert.equal(savedNextFormDocument.documentDataJson.customer_order_status, liveLookupSample.orderStatus);
    assert.equal(savedNextFormDocument.documentDataJson.customer_order_created_at, liveLookupSample.orderCreatedAt);
    assert.equal(savedNextFormDocument.documentDataJson.work_description, "batch");
    assert.equal(savedNextFormDocument.documentDataJson.material, "Batch Product A");
    assert.equal(savedNextFormDocument.documentDataJson.product_master_id, liveLookupSample.productId);
    assert.equal(savedNextFormDocument.documentDataJson.product_master_type, liveLookupSample.productType);
    assert.equal(savedNextFormDocument.documentDataJson.product_master_status, liveLookupSample.productStatus);
    assert.equal(savedNextFormDocument.documentDataJson.labor_hours, "2.5");
    assert.equal(savedNextFormDocument.documentDataJson.travel_hours, "0.5");
    assert.equal(savedNextFormDocument.documentDataJson.break_minutes, "30");

    const submitNextFormReferenceHtmx = await app.inject({
      method: "POST",
      url: `/documents/${nextFormDocumentId}/submit?user=alice`,
      headers: {
        "hx-request": "true",
      },
    });

    assert.equal(submitNextFormReferenceHtmx.statusCode, 200, "HTMX submit should return fragment HTML.");
    assert.match(submitNextFormReferenceHtmx.body, /id="document-workspace-fragment"/);
    assert.match(submitNextFormReferenceHtmx.body, /id="document-header-fragment".*hx-swap-oob="outerHTML"/s);
    assert.match(submitNextFormReferenceHtmx.body, /id="document-history-fragment".*hx-swap-oob="outerHTML"/s);
    assert.match(submitNextFormReferenceHtmx.body, /Submit erfolgreich/);
    assert.match(submitNextFormReferenceHtmx.body, /submitted/);
    assert.match(submitNextFormReferenceHtmx.body, /Naechster Schritt: Approve oder Reject durch Bob/);
    assert.match(submitNextFormReferenceHtmx.body, /Letzte Aktion: submitted/);

    const submittedAfterHtmx = await app.inject({
      method: "GET",
      url: `/documents/${nextFormDocumentId}?user=alice`,
    });

    assert.equal(submittedAfterHtmx.statusCode, 200, "Document should still render normally for Alice after HTMX submit.");
    assert.match(submittedAfterHtmx.body, /Upload aktuell nicht verfuegbar/);
    assert.match(submittedAfterHtmx.body, /Upload ist im aktuellen Dokumentstatus nicht verfuegbar\./);
    assert.match(submittedAfterHtmx.body, /Formular aktuell read-only\./);
    assert.match(submittedAfterHtmx.body, /data-field-name="order_number"[\s\S]*data-field-state="readonly"/);
    assert.match(submittedAfterHtmx.body, /data-field-name="service_location"[\s\S]*data-field-required="false"[\s\S]*data-field-state="readonly"/);
    assert.match(submittedAfterHtmx.body, /data-inline-action="load_customer"/);
    assert.match(submittedAfterHtmx.body, /data-inline-action="load_customer"[\s\S]*disabled/);

    const submittedForBobAfterHtmx = await app.inject({
      method: "GET",
      url: `/documents/${nextFormDocumentId}?user=bob`,
    });

    assert.equal(submittedForBobAfterHtmx.statusCode, 200, "Document should still render normally after HTMX submit.");
    assert.match(submittedForBobAfterHtmx.body, /Approve/);
    assert.match(submittedForBobAfterHtmx.body, /Reject/);
    assert.match(submittedForBobAfterHtmx.body, /hx-post="\/documents\/.*\/approve\?user=bob"/);
    assert.match(submittedForBobAfterHtmx.body, /hx-post="\/documents\/.*\/reject\?user=bob"/);

    const approveNextFormReferenceHtmx = await app.inject({
      method: "POST",
      url: `/documents/${nextFormDocumentId}/approve?user=bob`,
      headers: {
        "hx-request": "true",
      },
    });

    assert.equal(approveNextFormReferenceHtmx.statusCode, 200, "HTMX approve should return fragment HTML.");
    assert.match(approveNextFormReferenceHtmx.body, /id="document-workspace-fragment"/);
    assert.match(approveNextFormReferenceHtmx.body, /id="document-header-fragment".*hx-swap-oob="outerHTML"/s);
    assert.match(approveNextFormReferenceHtmx.body, /id="document-history-fragment".*hx-swap-oob="outerHTML"/s);
    assert.match(approveNextFormReferenceHtmx.body, /Approve erfolgreich/);
    assert.match(approveNextFormReferenceHtmx.body, /approved/);
    assert.match(approveNextFormReferenceHtmx.body, /Letzte Aktion: approved/);

    const approvedAfterHtmx = await app.inject({
      method: "GET",
      url: `/documents/${nextFormDocumentId}?user=bob`,
    });

    assert.equal(approvedAfterHtmx.statusCode, 200, "Document should still render normally after HTMX approve.");
    assert.doesNotMatch(approvedAfterHtmx.body, /Approve<\/button>/);
    assert.doesNotMatch(approvedAfterHtmx.body, /Reject<\/button>/);
    assert.match(approvedAfterHtmx.body, /approved/);
    assert.doesNotMatch(approvedAfterHtmx.body, /Submit<\/button>/);
    assert.doesNotMatch(approvedAfterHtmx.body, /Approve<\/button>/);
    assert.doesNotMatch(approvedAfterHtmx.body, /Reject<\/button>/);

    const saveEvidence = await app.inject({
      method: "POST",
      url: "/documents/99999999-9999-9999-9999-999999999993/save?user=bob",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: "evidence_number=2026-101&evidence_notes=Smoke submit validation",
    });

    assert.equal(saveEvidence.statusCode, 303, "Evidence document save should redirect.");

    const addJournalEntry = await app.inject({
      method: "POST",
      url: "/documents/99999999-9999-9999-9999-999999999993/journal?user=bob",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: "journalFieldName=evidence_steps&entryText=Smoke%20journal%20entry",
    });

    assert.equal(addJournalEntry.statusCode, 303, "Journal entry should redirect back to the detail page.");

    const journalLocation = addJournalEntry.headers.location;
    assert.ok(typeof journalLocation === "string", "Journal add should return a redirect location.");

    const journalDetailPage = await app.inject({
      method: "GET",
      url: journalLocation,
    });

    assert.equal(journalDetailPage.statusCode, 200, "Detail page should render after journal update.");
    assert.match(journalDetailPage.body, /Journal-Eintrag hinzugefuegt\./);
    assert.match(journalDetailPage.body, /Evidence Steps/);
    assert.match(journalDetailPage.body, /Smoke journal entry/);
    assert.match(journalDetailPage.body, /Evidence request created\./);

    const pngFixture = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS1EAAAAASUVORK5CYII=",
      "base64",
    );
    const multipartUpload = buildMultipartUpload("smoke-image.png", "image/png", pngFixture);
    const uploadEvidenceAttachment = await app.inject({
      method: "POST",
      url: "/documents/99999999-9999-9999-9999-999999999993/attachments?user=bob",
      headers: {
        "content-type": `multipart/form-data; boundary=${multipartUpload.boundary}`,
      },
      payload: multipartUpload.payload,
    });

    assert.equal(uploadEvidenceAttachment.statusCode, 303, "Attachment upload should redirect back to the detail page.");

    const uploadedAttachmentLocation = uploadEvidenceAttachment.headers.location;
    assert.ok(typeof uploadedAttachmentLocation === "string", "Attachment upload should return a redirect location.");

    const uploadedAttachmentDetailPage = await app.inject({
      method: "GET",
      url: uploadedAttachmentLocation,
    });

    assert.equal(uploadedAttachmentDetailPage.statusCode, 200, "Detail page should render after attachment upload.");
    assert.match(uploadedAttachmentDetailPage.body, /Attachment hochgeladen\./);
    assert.match(uploadedAttachmentDetailPage.body, /smoke-image\.png/);
    assert.match(uploadedAttachmentDetailPage.body, /attachment-thumb/);

    const [uploadedAttachments, uploadAuditEvents] = await Promise.all([
      listAttachmentsForDocument("99999999-9999-9999-9999-999999999993"),
      listAuditEventsForDocument("99999999-9999-9999-9999-999999999993"),
    ]);

    const uploadedAttachment = uploadedAttachments.find((attachment) => attachment.filename === "smoke-image.png");
    assert.ok(
      uploadedAttachment,
      "Attachment upload should persist an attachment record.",
    );
    assert.ok(
      uploadAuditEvents.some((event) => event.eventType === "attachment_uploaded"),
      "Attachment upload should persist an attachment audit event.",
    );

    const uploadedAttachmentContent = await app.inject({
      method: "GET",
      url: `/attachments/${uploadedAttachment.id}/content?user=bob`,
    });

    assert.equal(uploadedAttachmentContent.statusCode, 200, "Uploaded attachment content should be readable.");
    assert.match(String(uploadedAttachmentContent.headers["content-type"] ?? ""), /image\/png/);

    const submitEvidence = await app.inject({
      method: "POST",
      url: "/documents/99999999-9999-9999-9999-999999999993/submit?user=bob",
    });

    assert.equal(submitEvidence.statusCode, 303, "Evidence document submit should redirect.");

    const submitLocation = submitEvidence.headers.location;
    assert.ok(typeof submitLocation === "string", "Submit should return a redirect location.");

    const submittedEvidenceDetailPage = await app.inject({
      method: "GET",
      url: submitLocation,
    });

    assert.equal(submittedEvidenceDetailPage.statusCode, 200, "Submitted evidence detail should render.");
    assert.match(submittedEvidenceDetailPage.body, /Submit erfolgreich/);
    assert.match(submittedEvidenceDetailPage.body, /submitted/);
    assert.match(submittedEvidenceDetailPage.body, /Smoke submit validation/);
    assert.match(
      submittedEvidenceDetailPage.body,
      /Bearbeitung setzt eine aktive Editor-Zuweisung voraus\.|Bearbeitung setzt Membership-Recht w voraus\.|keine direkt speicherbaren Felder/i,
      "Submitted evidence detail should explain why save is no longer available.",
    );
    assert.match(
      submittedEvidenceDetailPage.body,
      /Bearbeitung setzt eine aktive Editor-Zuweisung voraus\.|Bearbeitung setzt Membership-Recht w voraus\.|keine direkt speicherbaren Felder zur Verfuegung/i,
      "Submitted evidence detail should no longer render editable save fields.",
    );
    assert.doesNotMatch(
      submittedEvidenceDetailPage.body,
      /name="evidence_notes"/,
      "Submitted evidence detail should no longer expose editable form controls.",
    );

    const saveSubmittedEvidence = await app.inject({
      method: "POST",
      url: "/documents/99999999-9999-9999-9999-999999999993/save?user=bob",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: "evidence_notes=Should not persist after submit",
    });

    assert.equal(saveSubmittedEvidence.statusCode, 303, "Save after submit should redirect back with an error.");
    assert.match(String(saveSubmittedEvidence.headers.location ?? ""), /saveError=/);

    const [submittedEvidenceDetail, submittedEvidenceAuditEvents, submittedEvidenceTasks] = await Promise.all([
      findDocumentDetailVisibleToUser("99999999-9999-9999-9999-999999999993", bob.id),
      listAuditEventsForDocument("99999999-9999-9999-9999-999999999993"),
      listTasksForDocument("99999999-9999-9999-9999-999999999993"),
    ]);

    assert.ok(submittedEvidenceDetail, "Submitted evidence document should stay visible.");
    assert.equal(submittedEvidenceDetail.status, "submitted", "Submit should persist the next workflow status.");
    assert.equal(
      submittedEvidenceDetail.documentDataJson.evidence_notes,
      "Smoke submit validation",
      "Saved values should remain visible after submit.",
    );
    assert.ok(
      Array.isArray(submittedEvidenceDetail.documentDataJson.evidence_steps)
      && submittedEvidenceDetail.documentDataJson.evidence_steps.length === 2,
      "Journal values should remain persisted in documents.data_json.",
    );
    assert.ok(
      submittedEvidenceAuditEvents.some((event) => event.eventType === "submitted"),
      "Submitted document should persist a submitted audit event.",
    );
    assert.ok(
      submittedEvidenceAuditEvents.some((event) => event.eventType === "journal_added"),
      "Journal updates should persist a journal_added audit event.",
    );
    assert.ok(
      submittedEvidenceTasks.every((task) => task.status === "closed"),
      "Open editor tasks should be closed after submit.",
    );

    const rejectEvidence = await app.inject({
      method: "POST",
      url: "/documents/99999999-9999-9999-9999-999999999993/reject?user=bob",
    });

    assert.equal(rejectEvidence.statusCode, 303, "Reject without approver assignment should redirect back to the detail page.");

    const rejectLocation = rejectEvidence.headers.location;
    assert.ok(typeof rejectLocation === "string", "Reject should return a redirect location.");

    const rejectedEvidenceDetailPage = await app.inject({
      method: "GET",
      url: rejectLocation,
    });

    assert.equal(rejectedEvidenceDetailPage.statusCode, 200, "Submitted evidence detail should render after blocked reject.");
    assert.match(rejectedEvidenceDetailPage.body, /Reject nicht moeglich/);
    assert.match(rejectedEvidenceDetailPage.body, /aktive Approver-Zuweisung/);
    assert.match(rejectedEvidenceDetailPage.body, /submitted/);

    const evidenceAfterBlockedReject = await findDocumentDetailVisibleToUser("99999999-9999-9999-9999-999999999993", bob.id);

    assert.ok(evidenceAfterBlockedReject, "Evidence document should stay visible after blocked reject.");
    assert.equal(evidenceAfterBlockedReject.status, "submitted", "Blocked reject must not change the document status.");

    const approveCustomerOrder = await app.inject({
      method: "POST",
      url: "/documents/99999999-9999-9999-9999-999999999991/approve?user=bob",
    });

    assert.equal(approveCustomerOrder.statusCode, 303, "Approve should redirect back to the customer order detail page.");

    const approveLocation = approveCustomerOrder.headers.location;
    assert.ok(typeof approveLocation === "string", "Approve should return a redirect location.");

    const approvedCustomerOrderDetailPage = await app.inject({
      method: "GET",
      url: approveLocation,
    });

    assert.equal(approvedCustomerOrderDetailPage.statusCode, 200, "Approved customer order detail should render.");
    assert.match(approvedCustomerOrderDetailPage.body, /Approve erfolgreich/);
    assert.match(approvedCustomerOrderDetailPage.body, /approved/);

    const [approvedCustomerOrderDetail, approvedCustomerOrderAuditEvents, approvedCustomerOrderTasks] = await Promise.all([
      findDocumentDetailVisibleToUser("99999999-9999-9999-9999-999999999991", bob.id),
      listAuditEventsForDocument("99999999-9999-9999-9999-999999999991"),
      listTasksForDocument("99999999-9999-9999-9999-999999999991"),
    ]);

    assert.ok(approvedCustomerOrderDetail, "Approved customer order should stay visible.");
    assert.equal(approvedCustomerOrderDetail.status, "approved", "Approve should persist the next workflow status.");
    assert.ok(
      approvedCustomerOrderAuditEvents.some((event) => event.eventType === "approved"),
      "Approved customer order should persist an approved audit event.",
    );
    assert.ok(
      approvedCustomerOrderTasks.every((task) => task.status === "closed"),
      "Open approver tasks should be closed after approve.",
    );

    const archiveApprovedCustomerOrder = await app.inject({
      method: "POST",
      url: "/documents/99999999-9999-9999-9999-999999999991/archive?user=bob",
    });

    assert.equal(archiveApprovedCustomerOrder.statusCode, 303, "Archive should redirect back to the customer order detail page.");

    const archiveLocation = archiveApprovedCustomerOrder.headers.location;
    assert.ok(typeof archiveLocation === "string", "Archive should return a redirect location.");

    const archivedCustomerOrderDetailPage = await app.inject({
      method: "GET",
      url: archiveLocation,
    });

    assert.equal(archivedCustomerOrderDetailPage.statusCode, 200, "Archived customer order detail should render.");
    assert.match(archivedCustomerOrderDetailPage.body, /Archive erfolgreich/);
    assert.match(archivedCustomerOrderDetailPage.body, /archived/);
    assert.match(
      archivedCustomerOrderDetailPage.body,
      /Bearbeitung setzt eine aktive Editor-Zuweisung voraus\.|Bearbeitung setzt Membership-Recht w voraus\.|keine direkt speicherbaren Felder zur Verfuegung/i,
      "Archived customer order detail should remain read-only.",
    );
    assert.doesNotMatch(
      archivedCustomerOrderDetailPage.body,
      /name="customer_order_number"|name="review_notes"/,
      "Archived customer order detail should not expose editable controls.",
    );

    const [archivedCustomerOrderDetail, archivedCustomerOrderAuditEvents, archivedCustomerOrderTasks] = await Promise.all([
      findDocumentDetailVisibleToUser("99999999-9999-9999-9999-999999999991", bob.id),
      listAuditEventsForDocument("99999999-9999-9999-9999-999999999991"),
      listTasksForDocument("99999999-9999-9999-9999-999999999991"),
    ]);

    assert.ok(archivedCustomerOrderDetail, "Archived customer order should stay visible.");
    assert.equal(archivedCustomerOrderDetail.status, "archived", "Archive should persist the next workflow status.");
    assert.ok(
      archivedCustomerOrderAuditEvents.some((event) => event.eventType === "archived"),
      "Archived customer order should persist an archived audit event.",
    );
    assert.ok(
      archivedCustomerOrderTasks.every((task) => task.status === "closed"),
      "Tasks should remain closed after archive.",
    );

    const saveArchivedCustomerOrder = await app.inject({
      method: "POST",
      url: "/documents/99999999-9999-9999-9999-999999999991/save?user=bob",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: "review_notes=Should not persist after archive",
    });

    assert.equal(saveArchivedCustomerOrder.statusCode, 303, "Save after archive should redirect back with an error.");
    assert.match(
      String(saveArchivedCustomerOrder.headers.location ?? ""),
      /saveError=/,
      "Save after archive should expose a save error in the redirect.",
    );

    const archivedCustomerOrderDetailAfterBlockedSave = await findDocumentDetailVisibleToUser(
      "99999999-9999-9999-9999-999999999991",
      bob.id,
    );

    assert.ok(archivedCustomerOrderDetailAfterBlockedSave, "Archived customer order should stay visible after blocked save.");
    assert.equal(
      archivedCustomerOrderDetailAfterBlockedSave.documentDataJson.review_notes,
      "Awaiting final approval.",
      "Blocked save after archive must not overwrite document data.",
    );

    const defaultDocumentsAfterArchive = await app.inject({
      method: "GET",
      url: "/documents?user=bob",
    });
    const archivedDocumentsAfterArchive = await app.inject({
      method: "GET",
      url: "/documents?user=bob&showArchived=1&status=archived&q=4711",
    });

    assert.equal(defaultDocumentsAfterArchive.statusCode, 200, "Default documents page should still render after archive.");
    assert.equal(archivedDocumentsAfterArchive.statusCode, 200, "Archived documents filter should render after archive.");
    assert.doesNotMatch(
      defaultDocumentsAfterArchive.body,
      /Customer Order 4711/,
      "Archived documents should stay hidden in the default documents view.",
    );
    assert.match(
      archivedDocumentsAfterArchive.body,
      /Customer Order 4711/,
      "Archived customer order should appear once the archive filter is enabled.",
    );
    assert.match(
      archivedDocumentsAfterArchive.body,
      /Archivierter Vorgang/,
      "Archived filter view should label archived rows clearly.",
    );

    const unpublishReferenceTemplate = await app.inject({
      method: "POST",
      url: `/templates/${publishedTemplateId}/source?user=alice`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `source=${encodeURIComponent(draftTemplateSource)}&intent=unpublish`,
    });

    assert.equal(unpublishReferenceTemplate.statusCode, 303, "Unpublish should redirect back to the reference template detail.");

    const unpublishedTemplateLocation = String(unpublishReferenceTemplate.headers.location ?? "");
    const unpublishedTemplateDetailPage = await app.inject({
      method: "GET",
      url: unpublishedTemplateLocation,
    });
    const blockedStartAfterUnpublish = await app.inject({
      method: "POST",
      url: "/documents/start?user=alice",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `templateId=${encodeURIComponent(String(publishedTemplateId))}`,
    });
    const documentsPageAfterUnpublish = await app.inject({
      method: "GET",
      url: "/documents?user=alice",
    });

    assert.equal(unpublishedTemplateDetailPage.statusCode, 200, "Unpublished reference template detail should render.");
    assert.match(unpublishedTemplateDetailPage.body, /Template unveroeffentlicht/);
    assert.match(unpublishedTemplateDetailPage.body, /unpublished · v2/);
    assert.ok(
      [302, 303].includes(blockedStartAfterUnpublish.statusCode),
      "Unpublished reference templates should no longer be startable.",
    );
    assert.match(
      String(blockedStartAfterUnpublish.headers.location ?? ""),
      /startError=Template%20ist%20nicht%20fuer%20neue%20Dokumentstarts%20freigegeben\./,
      "Unpublished reference templates should redirect with a start error.",
    );
    assert.equal(documentsPageAfterUnpublish.statusCode, 200, "Documents list should still render after unpublish.");
    assert.doesNotMatch(
      documentsPageAfterUnpublish.body,
      new RegExp(`value="${publishedTemplateId}"`),
      "Unpublished reference templates should disappear from the normal start select.",
    );

    const archiveReferenceTemplate = await app.inject({
      method: "POST",
      url: `/templates/${publishedTemplateId}/source?user=alice`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `source=${encodeURIComponent(draftTemplateSource)}&intent=archive`,
    });

    assert.equal(archiveReferenceTemplate.statusCode, 303, "Archive should redirect back to the reference template detail.");

    const archivedTemplateLocation = String(archiveReferenceTemplate.headers.location ?? "");
    const archivedTemplateDetailPage = await app.inject({
      method: "GET",
      url: archivedTemplateLocation,
    });
    const blockedStartAfterArchive = await app.inject({
      method: "POST",
      url: "/documents/start?user=alice",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `templateId=${encodeURIComponent(String(publishedTemplateId))}`,
    });
    const templatesAfterTemplateArchive = await app.inject({
      method: "GET",
      url: "/templates?user=alice",
    });
    const nextFormDocumentAfterTemplateArchive = await app.inject({
      method: "GET",
      url: `/documents/${nextFormDocumentId}?user=alice`,
    });
    const archivedReferenceVersions = await listFormTemplateVersions("customer-order-test");

    assert.equal(archivedTemplateDetailPage.statusCode, 200, "Archived reference template detail should remain directly visible.");
    assert.match(archivedTemplateDetailPage.body, /Template archiviert/);
    assert.match(archivedTemplateDetailPage.body, /archived · v2/);
    assert.ok(
      [302, 303].includes(blockedStartAfterArchive.statusCode),
      "Archived reference templates should not be startable.",
    );
    assert.match(
      String(blockedStartAfterArchive.headers.location ?? ""),
      /startError=Template%20ist%20nicht%20fuer%20neue%20Dokumentstarts%20freigegeben\./,
      "Archived reference templates should redirect with a start error.",
    );
    assert.equal(templatesAfterTemplateArchive.statusCode, 200, "Templates list should still render after template archive.");
    assert.doesNotMatch(
      templatesAfterTemplateArchive.body,
      /Customer Order Test/,
      "Archived reference templates should disappear from the default templates list.",
    );
    assert.equal(nextFormDocumentAfterTemplateArchive.statusCode, 200, "Existing next-form documents should remain readable after template archive.");
    assert.match(
      nextFormDocumentAfterTemplateArchive.body,
      /Formular:<\/strong>\s*Customer Order Test v2/,
      "Existing documents should stay pinned to their original template version after template archive.",
    );
    assert.match(
      nextFormDocumentAfterTemplateArchive.body,
      /Workflow:<\/strong>\s*Customer Order Group Submit v1/,
      "Existing documents should stay pinned to their original workflow version after later lifecycle changes.",
    );
    assert.ok(
      archivedReferenceVersions.every((template) => template.status === "archived"),
      "Archiving the reference template should remove the whole template family from standard overviews while keeping versions visible by direct detail.",
    );
  } finally {
    await app.close();
    await rebuildReferenceData();
  }

  console.log("Reference smoke test passed.");
};

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Reference smoke test failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
