import assert from "node:assert/strict";
import { buildApp } from "../app.js";
import { findCustomerOrderRecord, findProductionRecord } from "../modules/documents/typed-records-read.js";
import { findDocumentDetailVisibleToUser } from "../modules/documents/read.js";
import { closePool } from "./pool.js";
import { seedServiceReportInstance } from "./seed-service-report.js";

const templateId = "91111111-1111-1111-1111-111111111111";
const workflowId = "81111111-1111-1111-1111-111111111111";
const operationId = "93111111-1111-1111-1111-111111111111";
const productionTemplateId = "91222222-1111-1111-1111-111111111111";
const frankId = "21111111-1111-1111-1111-111111111111";
const thomasId = "22222222-1111-1111-1111-111111111111";
const chefId = "55555555-1111-1111-1111-111111111111";
const petraId = "66666666-1111-1111-1111-111111111111";

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

const postForm = async (
  app: Awaited<ReturnType<typeof buildApp>>,
  input: { url: string; payload: string },
) => {
  return app.inject({
    method: "POST",
    url: input.url,
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    payload: input.payload,
  });
};

const extractDocumentIdFromLocation = (value: string | string[] | undefined): string => {
  const location = Array.isArray(value) ? value[0] : value;

  if (!location) {
    throw new Error("Redirect location fehlt.");
  }

  const match = location.match(/\/documents\/([^?]+)/);

  if (!match?.[1]) {
    throw new Error(`Document-Id konnte nicht aus Location gelesen werden: ${location}`);
  }

  return match[1];
};

const main = async (): Promise<void> => {
  await seedServiceReportInstance();

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url.includes("/api/customers")) {
      return new Response(JSON.stringify(customersResponse), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      });
    }

    if (url.includes("/api/customer-orders")) {
      return new Response(JSON.stringify(customerOrdersResponse), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      });
    }

    if (url.includes("/api/products")) {
      return new Response(JSON.stringify(productsResponse), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      });
    }

    if (url.includes("/api/batches")) {
      return new Response(JSON.stringify(batchResponse), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      });
    }

    throw new Error(`Unerwartete URL im E2E-Test: ${url}`);
  };

  const app = await buildApp();

  try {
    const frankWorkspace = await app.inject({
      method: "GET",
      url: "/workspace?user=frank",
    });
    assert.equal(frankWorkspace.statusCode, 200);
    assert.match(frankWorkspace.body, /href="\/documents\?user=frank" class="nav-link /);
    assert.doesNotMatch(frankWorkspace.body, /href="\/templates\?user=frank" class="nav-link /);
    assert.doesNotMatch(frankWorkspace.body, /href="\/apis\?user=frank" class="nav-link /);
    assert.doesNotMatch(frankWorkspace.body, /href="\/admin\?user=frank" class="nav-link /);

    const frankGroupAdminWorkspace = await app.inject({
      method: "GET",
      url: "/workspace?user=frank&group=kundenservice",
    });
    assert.equal(frankGroupAdminWorkspace.statusCode, 200);
    assert.match(frankGroupAdminWorkspace.body, /href="\/groups\?user=frank&amp;group=kundenservice" class="nav-link /);
    assert.match(frankGroupAdminWorkspace.body, /href="\/templates\?user=frank&amp;group=kundenservice" class="nav-link /);
    assert.match(frankGroupAdminWorkspace.body, /href="\/workflows\?user=frank&amp;group=kundenservice" class="nav-link /);
    assert.match(frankGroupAdminWorkspace.body, /href="\/apis\?user=frank&amp;group=kundenservice" class="nav-link /);
    assert.doesNotMatch(frankGroupAdminWorkspace.body, /href="\/admin\?user=frank&amp;group=kundenservice" class="nav-link /);

    const developerWorkspace = await app.inject({
      method: "GET",
      url: "/workspace?user=dev",
    });
    assert.equal(developerWorkspace.statusCode, 200);
    assert.match(developerWorkspace.body, /href="\/templates\?user=dev" class="nav-link /);
    assert.match(developerWorkspace.body, /href="\/workflows\?user=dev" class="nav-link /);
    assert.match(developerWorkspace.body, /href="\/apis\?user=dev" class="nav-link /);
    assert.match(developerWorkspace.body, /href="\/groups\?user=dev" class="nav-link /);
    assert.doesNotMatch(developerWorkspace.body, /href="\/admin\?user=dev" class="nav-link /);

    const adminWorkspace = await app.inject({
      method: "GET",
      url: "/workspace?user=admin",
    });
    assert.equal(adminWorkspace.statusCode, 200);
    assert.match(adminWorkspace.body, /href="\/apis\?user=admin" class="nav-link /);
    assert.match(adminWorkspace.body, /href="\/admin\?user=admin" class="nav-link /);
    assert.doesNotMatch(adminWorkspace.body, /href="\/templates\?user=admin" class="nav-link /);

    const chefWorkspace = await app.inject({
      method: "GET",
      url: "/workspace?user=chef",
    });
    assert.equal(chefWorkspace.statusCode, 200);
    assert.match(chefWorkspace.body, /href="\/templates\?user=chef" class="nav-link /);
    assert.match(chefWorkspace.body, /href="\/workflows\?user=chef" class="nav-link /);
    assert.match(chefWorkspace.body, /href="\/apis\?user=chef" class="nav-link /);
    assert.match(chefWorkspace.body, /href="\/groups\?user=chef" class="nav-link /);
    assert.match(chefWorkspace.body, /href="\/admin\?user=chef" class="nav-link /);

    const chefDocumentsBauauftrag = await app.inject({
      method: "GET",
      url: "/documents?user=chef&group=bauauftrag",
    });
    assert.equal(chefDocumentsBauauftrag.statusCode, 200);
    assert.doesNotMatch(chefDocumentsBauauftrag.body, /<option value="service-report"/);
    assert.doesNotMatch(chefDocumentsBauauftrag.body, /value="91111111-1111-1111-1111-111111111111"/);
    assert.match(chefDocumentsBauauftrag.body, /Keine Formulare|Keine Vorgänge gefunden/);

    const chefDocumentsAllGroups = await app.inject({
      method: "GET",
      url: "/documents?user=chef&group=__all__",
    });
    assert.equal(chefDocumentsAllGroups.statusCode, 200);
    assert.match(chefDocumentsAllGroups.body, /<option value="service-report" >?Service-Report · published/);
    assert.match(chefDocumentsAllGroups.body, /<option value="production-report"[^>]*>Produktionsauftrag · published/);
    assert.match(chefDocumentsAllGroups.body, /value="__all__" selected/);

    const chefProductionTemplates = await app.inject({
      method: "GET",
      url: "/templates?user=chef&group=produktion",
    });
    assert.equal(chefProductionTemplates.statusCode, 200);
    assert.match(chefProductionTemplates.body, /Produktionsauftrag/);
    assert.doesNotMatch(chefProductionTemplates.body, /Service-Report Freigabe/);

    const chefProductionApis = await app.inject({
      method: "GET",
      url: "/apis?user=chef&group=produktion",
    });
    assert.equal(chefProductionApis.statusCode, 200);
    assert.match(chefProductionApis.body, /ERP-SIM Produktliste/);
    assert.match(chefProductionApis.body, /ERP-SIM Batchgenerator/);
    assert.doesNotMatch(chefProductionApis.body, /ERP-SIM Auftragsliste/);

    const adminOverview = await app.inject({
      method: "GET",
      url: `/admin?user=admin&selectedUser=${frankId}`,
    });
    assert.equal(adminOverview.statusCode, 200);
    assert.match(adminOverview.body, /Benutzerdetail/);
    assert.match(adminOverview.body, /Frank/);
    assert.match(adminOverview.body, /frank@service-report\.local/);
    assert.match(adminOverview.body, /name="roleAdmin"/);

    const groupsPage = await app.inject({
      method: "GET",
      url: "/groups?user=frank&group=kundenservice",
    });
    assert.equal(groupsPage.statusCode, 200);
    assert.match(groupsPage.body, /Gruppendetail/);
    assert.match(groupsPage.body, /Kundenservice/);
    assert.match(groupsPage.body, /Gruppenadmin/);

    const frankTemplateDirectDenied = await app.inject({
      method: "GET",
      url: `/templates/${templateId}?user=frank`,
    });
    assert.equal(frankTemplateDirectDenied.statusCode, 303);
    assert.match(String(frankTemplateDirectDenied.headers.location ?? ""), /\/workspace\?user=frank&dialogType=error/);

    const frankGroupedTemplateDetail = await app.inject({
      method: "GET",
      url: `/templates/${templateId}?user=frank&group=kundenservice`,
    });
    assert.equal(frankGroupedTemplateDetail.statusCode, 200);
    assert.match(frankGroupedTemplateDetail.body, /Readonly-Ansicht/);
    assert.match(
      frankGroupedTemplateDetail.body,
      /<button[^>]*name="intent" value="save_draft"[^>]*disabled/,
      "Ohne Edit-Modus soll die Formularansicht readonly sein.",
    );

    const frankTemplateEditStart = await app.inject({
      method: "POST",
      url: `/templates/${templateId}/edit?user=frank&group=kundenservice`,
    });
    assert.equal(frankTemplateEditStart.statusCode, 303);
    assert.match(String(frankTemplateEditStart.headers.location ?? ""), /mode=edit/);

    const frankTemplateEditOpen = await app.inject({
      method: "GET",
      url: String(frankTemplateEditStart.headers.location),
    });
    assert.equal(frankTemplateEditOpen.statusCode, 200);
    assert.doesNotMatch(
      frankTemplateEditOpen.body,
      /<button[^>]*name="intent" value="save_draft"[^>]*disabled/,
      "Im Edit-Modus soll der Gruppenadmin das Formular bearbeiten können.",
    );
    assert.match(frankTemplateEditOpen.body, /<strong>v1<\/strong>/);
    assert.match(frankTemplateEditOpen.body, /<strong>v2<\/strong>/);
    assert.match(frankTemplateEditOpen.body, /Anzeigen/);

    const frankTemplatesListAfterDraft = await app.inject({
      method: "GET",
      url: "/templates?user=frank&group=kundenservice",
    });
    assert.equal(frankTemplatesListAfterDraft.statusCode, 200);
    assert.match(frankTemplatesListAfterDraft.body, /Draft v2 vorhanden/);
    assert.match(frankTemplatesListAfterDraft.body, /Bearbeiten/);

    const frankWorkspaceAfterDraft = await app.inject({
      method: "GET",
      url: "/workspace?user=frank&group=kundenservice",
    });
    assert.equal(frankWorkspaceAfterDraft.statusCode, 200);
    assert.match(frankWorkspaceAfterDraft.body, /Draft vorhanden/);

    const adminWorkflowDirectDenied = await app.inject({
      method: "GET",
      url: `/workflows/${workflowId}?user=admin`,
    });
    assert.equal(adminWorkflowDirectDenied.statusCode, 303);
    assert.match(String(adminWorkflowDirectDenied.headers.location ?? ""), /\/workspace\?user=admin&dialogType=error/);

    const frankApiDirectDenied = await app.inject({
      method: "GET",
      url: `/apis/${operationId}?user=frank`,
    });
    assert.equal(frankApiDirectDenied.statusCode, 303);
    assert.match(String(frankApiDirectDenied.headers.location ?? ""), /\/workspace\?user=frank&dialogType=error/);

    const frankGroupedApiDetail = await app.inject({
      method: "GET",
      url: `/apis/${operationId}?user=frank&group=kundenservice`,
    });
    assert.equal(frankGroupedApiDetail.statusCode, 200);
    assert.match(frankGroupedApiDetail.body, /Save &amp; Publish/);
    assert.match(
      frankGroupedApiDetail.body,
      /<button[^>]*name="intent" value="publish"[^>]*disabled/,
      "Gruppenadmin darf APIs sehen, aber nicht bearbeiten.",
    );

    const chefApiReadonly = await app.inject({
      method: "GET",
      url: `/apis/${operationId}?user=chef`,
    });
    assert.equal(chefApiReadonly.statusCode, 200);
    assert.match(chefApiReadonly.body, /Readonly-Ansicht/);
    assert.match(chefApiReadonly.body, /<button[^>]*name="intent" value="publish"[^>]*disabled/);
    assert.match(chefApiReadonly.body, /Verknuepfungen|Verknüpfungen/);
    assert.match(chefApiReadonly.body, /Zum Formular/);
    assert.match(chefApiReadonly.body, /Zugeordnete Workflows/);

    const chefApisList = await app.inject({
      method: "GET",
      url: "/apis?user=chef",
    });
    assert.equal(chefApisList.statusCode, 200);
    assert.match(chefApisList.body, /Bearbeiten/);

    const chefApiEditStart = await app.inject({
      method: "POST",
      url: `/apis/${operationId}/edit?user=chef`,
    });
    assert.equal(chefApiEditStart.statusCode, 303);
    assert.match(String(chefApiEditStart.headers.location ?? ""), /mode=edit/);

    const chefApiEditOpen = await app.inject({
      method: "GET",
      url: String(chefApiEditStart.headers.location),
    });
    assert.equal(chefApiEditOpen.statusCode, 200);
    assert.doesNotMatch(chefApiEditOpen.body, /<button[^>]*name="intent" value="publish"[^>]*disabled/);

    const frankWorkflowNew = await app.inject({
      method: "GET",
      url: "/workflows/new?user=frank&group=kundenservice",
    });
    assert.equal(frankWorkflowNew.statusCode, 200);
    assert.match(frankWorkflowNew.body, /Create Draft|Entwurf anlegen/);

    const chefWorkflowReadonly = await app.inject({
      method: "GET",
      url: `/workflows/${workflowId}?user=chef`,
    });
    assert.equal(chefWorkflowReadonly.statusCode, 200);
    assert.match(chefWorkflowReadonly.body, /Readonly-Ansicht/);
    assert.match(chefWorkflowReadonly.body, /<button[^>]*name="intent" value="save_draft"[^>]*disabled/);

    const chefWorkflowEditStart = await app.inject({
      method: "POST",
      url: `/workflows/${workflowId}/edit?user=chef`,
    });
    assert.equal(chefWorkflowEditStart.statusCode, 303);
    assert.match(String(chefWorkflowEditStart.headers.location ?? ""), /mode=edit/);

    const chefWorkflowEditOpen = await app.inject({
      method: "GET",
      url: String(chefWorkflowEditStart.headers.location),
    });
    assert.equal(chefWorkflowEditOpen.statusCode, 200);
    assert.doesNotMatch(chefWorkflowEditOpen.body, /<button[^>]*name="intent" value="save_draft"[^>]*disabled/);
    assert.match(chefWorkflowEditOpen.body, /<strong>v1<\/strong>/);
    assert.match(chefWorkflowEditOpen.body, /<strong>v2<\/strong>/);
    assert.match(chefWorkflowEditOpen.body, /Zugeordnete Formulare/);

    const chefWorkflowsListAfterDraft = await app.inject({
      method: "GET",
      url: "/workflows?user=chef",
    });
    assert.equal(chefWorkflowsListAfterDraft.statusCode, 200);
    assert.match(chefWorkflowsListAfterDraft.body, /Draft v2 vorhanden/);
    assert.match(chefWorkflowsListAfterDraft.body, /Bearbeiten/);

    const adminWorkflowNewDenied = await app.inject({
      method: "GET",
      url: "/workflows/new?user=admin",
    });
    assert.equal(adminWorkflowNewDenied.statusCode, 303);
    assert.match(String(adminWorkflowNewDenied.headers.location ?? ""), /\/workspace\?user=admin&dialogType=error/);

    const documentsBeforeStart = await app.inject({
      method: "GET",
      url: "/documents?user=chef",
    });
    assert.equal(documentsBeforeStart.statusCode, 200);
    assert.match(documentsBeforeStart.body, /<strong>0<\/strong>\s*<span>Aktiv<\/span>/);
    assert.match(documentsBeforeStart.body, /Draft vorhanden/);

    const startResponse = await postForm(app, {
      url: "/documents/start?user=chef",
      payload: `templateId=${encodeURIComponent(templateId)}`,
    });
    assert.equal(startResponse.statusCode, 303);

    const documentId = extractDocumentIdFromLocation(startResponse.headers.location);

    const secondStartResponse = await postForm(app, {
      url: "/documents/start?user=chef",
      payload: `templateId=${encodeURIComponent(templateId)}`,
    });
    assert.equal(secondStartResponse.statusCode, 303);
    const secondDocumentId = extractDocumentIdFromLocation(secondStartResponse.headers.location);
    assert.notEqual(secondDocumentId, documentId);

    const chefDraftOpen = await app.inject({
      method: "GET",
      url: `/documents/${documentId}?user=chef`,
    });
    assert.equal(chefDraftOpen.statusCode, 200);
    assert.match(chefDraftOpen.body, /Naechster Schritt: Zuweisen/);
    assert.match(chefDraftOpen.body, /Editoren fuer Zuweisung/);
    assert.match(chefDraftOpen.body, /Frank/);
    assert.match(chefDraftOpen.body, /Thomas/);
    assert.match(chefDraftOpen.body, /<select class="text-input" name="order_number">|<input\s+class="text-input"\s+type="text"\s+name="order_number"/);
    assert.match(chefDraftOpen.body, /data-inline-action="lookup_1"/);
    assert.match(chefDraftOpen.body, /data-workflow-action="assign"[\s\S]*?disabled/);
    assert.doesNotMatch(
      chefDraftOpen.body,
      /data-inline-action="lookup_1"[\s\S]*?disabled/,
      "Chef muss im Draft Auftragsdaten laden koennen.",
    );

    const prematureAssignResponse = await postForm(app, {
      url: `/documents/${documentId}/assign?user=chef`,
      payload: `editorUserIds=${encodeURIComponent(frankId)}`,
    });
    assert.equal(prematureAssignResponse.statusCode, 303);
    const prematureAssignLocation = Array.isArray(prematureAssignResponse.headers.location)
      ? prematureAssignResponse.headers.location[0]
      : prematureAssignResponse.headers.location;
    assert.match(prematureAssignLocation ?? "", /assignError=/);

    const chefLoadOrderResponse = await postForm(app, {
      url: `/documents/${documentId}/form?user=chef`,
      payload: [
        "intent=run-action",
        "actionName=lookup_1",
        `order_number=${encodeURIComponent("O-ca26a72f-1")}`,
      ].join("&"),
    });
    assert.equal(chefLoadOrderResponse.statusCode, 200);
    assert.match(chefLoadOrderResponse.body, /Auftragsdaten geladen/);
    assert.match(chefLoadOrderResponse.body, /Customer A/);
    assert.match(chefLoadOrderResponse.body, /received/);
    assert.match(chefLoadOrderResponse.body, /data-workflow-action="assign"[\s\S]*?disabled/);

    const chefDraftSaveHtmxResponse = await app.inject({
      method: "POST",
      url: `/documents/${documentId}/form?user=chef`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "hx-request": "true",
      },
      payload: [
        `editorUserIds=${encodeURIComponent(frankId)}`,
        `order_number=${encodeURIComponent("O-ca26a72f-1")}`,
        `customer=${encodeURIComponent("Customer A")}`,
        `customer_order_status=${encodeURIComponent("received")}`,
        `customer_master_status=${encodeURIComponent("gueltig")}`,
      ].join("&"),
    });
    assert.equal(chefDraftSaveHtmxResponse.statusCode, 200);
    assert.match(chefDraftSaveHtmxResponse.body, /value="21111111-1111-1111-1111-111111111111" checked/);
    assert.doesNotMatch(
      chefDraftSaveHtmxResponse.body,
      /data-workflow-action="assign"[\s\S]*?disabled/,
      "Nach HTMX-Speichern muss die Editor-Auswahl erhalten bleiben und Zuweisen aktiv sein.",
    );

    const assignResponse = await postForm(app, {
      url: `/documents/${documentId}/assign?user=chef`,
      payload: [
        `editorUserIds=${encodeURIComponent(frankId)}`,
        `order_number=${encodeURIComponent("O-ca26a72f-1")}`,
        `customer=${encodeURIComponent("Customer A")}`,
        `customer_order_status=${encodeURIComponent("received")}`,
        `customer_master_status=${encodeURIComponent("gueltig")}`,
      ].join("&"),
    });
    assert.equal(assignResponse.statusCode, 303);

    const frankAssignedOpen = await app.inject({
      method: "GET",
      url: `/documents/${documentId}?user=frank`,
    });
    assert.equal(frankAssignedOpen.statusCode, 200);
    assert.match(frankAssignedOpen.body, /assigned/);
    assert.match(frankAssignedOpen.body, /actionName=lookup_1/);
    assert.match(frankAssignedOpen.body, />Auftragsdaten laden<\/button>/);
    assert.match(frankAssignedOpen.body, /actionName=lookup_1[\s\S]*disabled/);
    assert.match(frankAssignedOpen.body, /Customer A/);
    assert.match(frankAssignedOpen.body, /received/);

    const saveResponse = await postForm(app, {
      url: `/documents/${documentId}/form?user=frank`,
      payload: [
        `order_number=${encodeURIComponent("O-ca26a72f-1")}`,
        `customer=${encodeURIComponent("Customer A")}`,
        `customer_order_status=${encodeURIComponent("received")}`,
        `customer_master_status=${encodeURIComponent("gueltig")}`,
        `work_description=${encodeURIComponent("Ventil geprueft und Anlage gesichert.")}`,
        `service_result_status=${encodeURIComponent("teilweise erledigt")}`,
        `customer_information_flags=${encodeURIComponent("Kunde informiert,Objekt zugaenglich")}`,
        `follow_up_date=${encodeURIComponent("2026-04-08")}`,
        `service_date=${encodeURIComponent("2026-04-05")}`,
        `technician=${encodeURIComponent("Frank")}`,
        `labor_hours=${encodeURIComponent("1,5")}`,
        `travel_hours=${encodeURIComponent("0,5")}`,
        `break_minutes=${encodeURIComponent("15")}`,
      ].join("&"),
    });
    assert.equal(saveResponse.statusCode, 303);

    const submitResponse = await app.inject({
      method: "POST",
      url: `/documents/${documentId}/submit?user=frank`,
    });
    assert.equal(submitResponse.statusCode, 303);

    const chefSubmittedOpen = await app.inject({
      method: "GET",
      url: `/documents/${documentId}?user=chef`,
    });
    assert.equal(chefSubmittedOpen.statusCode, 200);
    assert.match(chefSubmittedOpen.body, /submitted/);
    assert.match(chefSubmittedOpen.body, /Freigeben/);
    assert.match(chefSubmittedOpen.body, /Neu zuweisen/);

    const journalResponse = await postForm(app, {
      url: `/documents/${documentId}/journal?user=chef`,
      payload: [
        `journalFieldName=${encodeURIComponent("work_journal")}`,
        `entryText=${encodeURIComponent("Bitte Daten vervollstaendigen und Einsatzstatus kurz ergaenzen.")}`,
      ].join("&"),
    });
    assert.equal(journalResponse.statusCode, 303);

    const chefJournalOpen = await app.inject({
      method: "GET",
      url: `/documents/${documentId}?user=chef`,
    });
    assert.equal(chefJournalOpen.statusCode, 200);
    assert.match(chefJournalOpen.body, /Bitte Daten vervollstaendigen/);
    assert.match(chefJournalOpen.body, /Chef/);

    const reassignResponse = await postForm(app, {
      url: `/documents/${documentId}/reassign?user=chef`,
      payload: [
        `editorUserIds=${encodeURIComponent(frankId)}`,
        `editorUserIds=${encodeURIComponent(thomasId)}`,
      ].join("&"),
    });
    assert.equal(reassignResponse.statusCode, 303);

    const chefReassignedOpen = await app.inject({
      method: "GET",
      url: `/documents/${documentId}?user=chef`,
    });
    assert.equal(chefReassignedOpen.statusCode, 200);
    assert.match(chefReassignedOpen.body, /assigned/);
    assert.match(chefReassignedOpen.body, /Frank/);
    assert.match(chefReassignedOpen.body, /Thomas/);

    const resubmitResponse = await app.inject({
      method: "POST",
      url: `/documents/${documentId}/submit?user=frank`,
    });
    assert.equal(resubmitResponse.statusCode, 303);

    const approveResponse = await app.inject({
      method: "POST",
      url: `/documents/${documentId}/approve?user=chef`,
    });
    assert.equal(approveResponse.statusCode, 303);

    const approvedDetail = await findDocumentDetailVisibleToUser(documentId, chefId);
    assert.equal(approvedDetail?.status, "approved");
    const typedRecord = await findCustomerOrderRecord(documentId);
    assert.ok(typedRecord);
    assert.equal(typedRecord.orderNumber, "O-ca26a72f-1");
    assert.equal(typedRecord.customerName, "Customer A");
    assert.equal(typedRecord.status, "approved");

    const documentsAfterApprove = await app.inject({
      method: "GET",
      url: "/documents?user=chef&template=service-report",
    });
    assert.equal(documentsAfterApprove.statusCode, 200);
    assert.match(documentsAfterApprove.body, /Service-Report O-ca26a72f-1/);
    assert.match(documentsAfterApprove.body, /<strong>2<\/strong>\s*<span>Aktiv<\/span>/);
    assert.match(documentsAfterApprove.body, /Formularfamilie <strong>service-report<\/strong>/);

    const chefProductionDocuments = await app.inject({
      method: "GET",
      url: "/documents?user=chef&group=produktion",
    });
    assert.equal(chefProductionDocuments.statusCode, 200);
    assert.match(chefProductionDocuments.body, /Produktionsauftrag · published · v1 · Produktionsauftrag Freigabe \(v1\)/);

    const productionStartResponse = await postForm(app, {
      url: "/documents/start?user=chef&group=produktion",
      payload: `templateId=${encodeURIComponent(productionTemplateId)}`,
    });
    assert.equal(productionStartResponse.statusCode, 303);
    const productionDocumentId = extractDocumentIdFromLocation(productionStartResponse.headers.location);

    const chefProductionDraftOpen = await app.inject({
      method: "GET",
      url: `/documents/${productionDocumentId}?user=chef`,
    });
    assert.equal(chefProductionDraftOpen.statusCode, 200);
    assert.match(chefProductionDraftOpen.body, /Produktionsauftrag/);
    assert.match(chefProductionDraftOpen.body, /Petra/);
    assert.match(chefProductionDraftOpen.body, /<select class="text-input" name="product_number">/);
    assert.doesNotMatch(chefProductionDraftOpen.body, /type="text"[^>]*name="product_number"/);
    assert.match(chefProductionDraftOpen.body, /867e3340-0909-460d-80df-34f3e18fd996/);
    assert.match(chefProductionDraftOpen.body, /Batch Product A/);
    assert.doesNotMatch(chefProductionDraftOpen.body, /Serial Product B/);
    assert.match(chefProductionDraftOpen.body, /Wird durch Batchnummer erzeugen gefuellt/);
    assert.doesNotMatch(chefProductionDraftOpen.body, /B-867E3340-TEST1/);
    assert.doesNotMatch(
      chefProductionDraftOpen.body,
      /data-inline-action="lookup_1"[\s\S]*?disabled/,
      "Chef muss im Produktions-Draft Produktdaten laden koennen.",
    );
    assert.doesNotMatch(
      chefProductionDraftOpen.body,
      /data-inline-action="action_2"[\s\S]*?disabled/,
      "Chef muss im Produktions-Draft Batchnummern erzeugen koennen.",
    );

    const chefLoadProductResponse = await postForm(app, {
      url: `/documents/${productionDocumentId}/form?user=chef`,
      payload: [
        "intent=run-action",
        "actionName=lookup_1",
        `product_number=${encodeURIComponent("867e3340-0909-460d-80df-34f3e18fd996")}`,
      ].join("&"),
    });
    assert.equal(chefLoadProductResponse.statusCode, 200);
    assert.match(chefLoadProductResponse.body, /Produktdaten geladen/);
    assert.match(chefLoadProductResponse.body, /Batch Product A/);
    assert.match(chefLoadProductResponse.body, /batch/);
    assert.match(chefLoadProductResponse.body, /Wird durch Batchnummer erzeugen gefuellt/);
    assert.doesNotMatch(chefLoadProductResponse.body, /B-867E3340-TEST1/);

    const chefGenerateBatchResponse = await postForm(app, {
      url: `/documents/${productionDocumentId}/form?user=chef`,
      payload: [
        "intent=run-action",
        "actionName=action_2",
        `product_number=${encodeURIComponent("867e3340-0909-460d-80df-34f3e18fd996")}`,
        `product_name=${encodeURIComponent("Batch Product A")}`,
        `production_line=${encodeURIComponent("batch")}`,
        `product_status=${encodeURIComponent("gueltig")}`,
      ].join("&"),
    });
    assert.equal(chefGenerateBatchResponse.statusCode, 200);
    assert.match(chefGenerateBatchResponse.body, /Batchnummer erzeugt/);
    assert.match(chefGenerateBatchResponse.body, /B-867E3340-TEST1/);
    assert.match(chefGenerateBatchResponse.body, /ordered/);

    const chefProductionSaveHtmxResponse = await app.inject({
      method: "POST",
      url: `/documents/${productionDocumentId}/form?user=chef`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "hx-request": "true",
      },
      payload: [
        `editorUserIds=${encodeURIComponent(petraId)}`,
        `product_number=${encodeURIComponent("867e3340-0909-460d-80df-34f3e18fd996")}`,
        `product_name=${encodeURIComponent("Batch Product A")}`,
        `production_line=${encodeURIComponent("batch")}`,
        `product_status=${encodeURIComponent("gueltig")}`,
        `batch_id=${encodeURIComponent("B-867E3340-TEST1")}`,
        `batch_status=${encodeURIComponent("ordered")}`,
      ].join("&"),
    });
    assert.equal(chefProductionSaveHtmxResponse.statusCode, 200);
    assert.match(chefProductionSaveHtmxResponse.body, /value="66666666-1111-1111-1111-111111111111" checked/);
    assert.doesNotMatch(
      chefProductionSaveHtmxResponse.body,
      /data-workflow-action="assign"[\s\S]*?disabled/,
      "Nach HTMX-Speichern muss Zuweisen im Produktions-Draft aktiv sein.",
    );

    const productionAssignResponse = await postForm(app, {
      url: `/documents/${productionDocumentId}/assign?user=chef`,
      payload: [
        `editorUserIds=${encodeURIComponent(petraId)}`,
        `product_number=${encodeURIComponent("867e3340-0909-460d-80df-34f3e18fd996")}`,
        `product_name=${encodeURIComponent("Batch Product A")}`,
        `production_line=${encodeURIComponent("batch")}`,
        `product_status=${encodeURIComponent("gueltig")}`,
        `batch_id=${encodeURIComponent("B-867E3340-TEST1")}`,
        `batch_status=${encodeURIComponent("ordered")}`,
      ].join("&"),
    });
    assert.equal(productionAssignResponse.statusCode, 303);

    const petraAssignedOpen = await app.inject({
      method: "GET",
      url: `/documents/${productionDocumentId}?user=petra`,
    });
    assert.equal(petraAssignedOpen.statusCode, 200);
    assert.match(petraAssignedOpen.body, /assigned/);
    assert.match(petraAssignedOpen.body, /B-867E3340-TEST1/);
    assert.match(petraAssignedOpen.body, /Batch Product A/);
    assert.match(petraAssignedOpen.body, /actionName=lookup_1[\s\S]*disabled/);
    assert.match(petraAssignedOpen.body, /actionName=action_2[\s\S]*disabled/);

    const productionGridRows = JSON.stringify([
      {
        step: "Montage",
        station: "Linie 3",
        target_qty: "12",
        actual_qty: "12",
        result: "ok",
      },
    ]);

    const productionSaveResponse = await postForm(app, {
      url: `/documents/${productionDocumentId}/form?user=petra`,
      payload: [
        `product_number=${encodeURIComponent("867e3340-0909-460d-80df-34f3e18fd996")}`,
        `product_name=${encodeURIComponent("Batch Product A")}`,
        `production_line=${encodeURIComponent("batch")}`,
        `product_status=${encodeURIComponent("gueltig")}`,
        `batch_id=${encodeURIComponent("B-867E3340-TEST1")}`,
        `batch_status=${encodeURIComponent("ordered")}`,
        `serial_number=${encodeURIComponent("SN-0001")}`,
        `status=${encodeURIComponent("in arbeit")}`,
        `process_steps=${encodeURIComponent(productionGridRows)}`,
      ].join("&"),
    });
    assert.equal(productionSaveResponse.statusCode, 303);

    const productionSubmitResponse = await app.inject({
      method: "POST",
      url: `/documents/${productionDocumentId}/submit?user=petra`,
    });
    assert.equal(productionSubmitResponse.statusCode, 303);

    const productionApproveResponse = await app.inject({
      method: "POST",
      url: `/documents/${productionDocumentId}/approve?user=chef`,
    });
    assert.equal(productionApproveResponse.statusCode, 303);

    const approvedProductionDetail = await findDocumentDetailVisibleToUser(productionDocumentId, chefId);
    assert.equal(approvedProductionDetail?.status, "approved");
    const productionRecord = await findProductionRecord(productionDocumentId);
    assert.ok(productionRecord);
    assert.equal(productionRecord.batchId, "B-867E3340-TEST1");
    assert.equal(productionRecord.productName, "Batch Product A");
    assert.equal(productionRecord.productionLine, "batch");
    assert.equal(productionRecord.status, "approved");
  } finally {
    await app.close();
    globalThis.fetch = originalFetch;
    await closePool();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
