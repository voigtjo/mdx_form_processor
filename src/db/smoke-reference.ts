import assert from "node:assert/strict";
import { buildApp } from "../app.js";
import { listAttachmentsForDocument } from "../modules/attachments/read.js";
import { listAuditEvents } from "../modules/audit/read.js";
import {
  findDocumentDetailVisibleToUser,
  listDocumentsAssignedToUser,
  listDocumentsVisibleToUser,
} from "../modules/documents/read.js";
import {
  findCustomerOrderRecord,
  findGenericFormRecord,
  findProductionRecord,
  findQualificationRecord,
} from "../modules/documents/typed-records-read.js";
import { listReferenceEntities } from "../modules/entities/read.js";
import { listGroups } from "../modules/groups/read.js";
import { listMemberships } from "../modules/memberships/read.js";
import { listOperations } from "../modules/operations/read.js";
import { listFormTemplates } from "../modules/templates/read.js";
import { listUsers } from "../modules/users/read.js";
import { listWorkflowTemplates } from "../modules/workflows/read.js";
import { closePool } from "./pool.js";
import { rebuildReferenceData } from "./rebuild-reference.js";

const main = async (): Promise<void> => {
  await rebuildReferenceData();

  const [users, groups, memberships, templates, workflows, operations, customers, products, auditEvents] = await Promise.all([
    listUsers(),
    listGroups(),
    listMemberships(),
    listFormTemplates(),
    listWorkflowTemplates(),
    listOperations(),
    listReferenceEntities("customer"),
    listReferenceEntities("product"),
    listAuditEvents(),
  ]);

  assert.equal(users.length, 5, "Expected five reference users.");
  assert.equal(groups.length, 2, "Expected two reference groups.");
  assert.equal(templates.length, 4, "Expected four reference templates.");
  assert.equal(workflows.length, 4, "Expected four reference workflows.");
  assert.ok(operations.length >= 4, "Expected internal TypeScript operations.");
  assert.equal(customers.length, 2, "Expected two imported customer master records.");
  assert.equal(products.length, 3, "Expected three imported product master records.");
  assert.ok(auditEvents.length >= 6, "Expected visible audit events.");

  const admin = users.find((user) => user.key === "admin");
  const serviceLead = users.find((user) => user.key === "service-auftrag-freigabe");
  const serviceWorker = users.find((user) => user.key === "service-durchfuehrung-dokumentation");
  const productionLead = users.find((user) => user.key === "produktion-auftrag-freigabe");
  const productionWorker = users.find((user) => user.key === "produktion-durchfuehrung-dokumentation");

  assert.ok(admin);
  assert.ok(serviceLead);
  assert.ok(serviceWorker);
  assert.ok(productionLead);
  assert.ok(productionWorker);
  const customersLookup = operations.find((operation) => operation.key === "customers.lookup");
  const productsSuggest = operations.find((operation) => operation.key === "products.suggest");
  assert.ok(customersLookup, "Expected customers.lookup API.");
  assert.ok(productsSuggest, "Expected products.suggest API.");
  assert.equal(customersLookup.modulePath, "db:handler_ts_source");
  assert.equal(productsSuggest.modulePath, "db:handler_ts_source");
  assert.equal(customersLookup.status, "published");
  assert.equal(productsSuggest.status, "published");
  assert.match(groups.map((group) => group.name).join(", "), /Kundenservice/);
  assert.match(groups.map((group) => group.name).join(", "), /Produktion/);
  assert.equal(memberships.length, 6, "Expected fresh group memberships.");

  const [adminDocuments, serviceDocuments, productionDocuments, qualificationAsService, qualificationAsProduction, qualificationAsAdmin] =
    await Promise.all([
      listDocumentsVisibleToUser(admin.id),
      listDocumentsAssignedToUser(serviceWorker.id),
      listDocumentsAssignedToUser(productionWorker.id),
      findDocumentDetailVisibleToUser("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3", serviceWorker.id),
      findDocumentDetailVisibleToUser("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3", productionWorker.id),
      findDocumentDetailVisibleToUser("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3", admin.id),
    ]);

  assert.equal(adminDocuments.length, 4, "Admin should see the four reference documents.");
  assert.ok(serviceDocuments.some((document) => document.title.includes("Kundenauftrag")));
  assert.ok(productionDocuments.some((document) => document.title.includes("Produktion")));
  assert.ok(qualificationAsService);
  assert.ok(qualificationAsProduction);
  assert.ok(qualificationAsAdmin);
  assert.equal(templates.find((template) => template.key === "customer-order-test")?.formType, "customer_order");
  assert.equal(templates.find((template) => template.key === "production-batch")?.formType, "production_record");
  assert.equal(templates.find((template) => template.key === "qualification-record")?.formType, "qualification_record");
  assert.equal(templates.find((template) => template.key === "generic-form")?.formType, "generic_form");

  const [customerRecord, productionRecord, qualificationRecord, genericFormRecord] = await Promise.all([
    findCustomerOrderRecord("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1"),
    findProductionRecord("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee2"),
    findQualificationRecord("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3"),
    findGenericFormRecord("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee4"),
  ]);
  assert.ok(customerRecord, "Expected customer_order typed record.");
  assert.ok(productionRecord, "Expected production_record typed record.");
  assert.ok(qualificationRecord, "Expected qualification_record typed record.");
  assert.ok(genericFormRecord, "Expected generic_form typed record.");
  assert.equal(customerRecord.orderNumber, "KD-2026-1007");
  assert.equal(customerRecord.status, "progressed");
  assert.match(customerRecord.workDescriptionHtml ?? "", /heizung/i);
  assert.equal(productionRecord.batchId, "PB-2026-0042");
  assert.equal(productionRecord.status, "progressed");
  assert.equal(qualificationRecord.qualificationRecordNumber, "QN-2026-001");
  assert.equal(qualificationRecord.status, "assigned");
  assert.equal(genericFormRecord.formTitle, "Generisches Formular GF-2026-001");
  assert.equal(genericFormRecord.status, "assigned");

  const customerAttachments = await listAttachmentsForDocument("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1");
  assert.equal(customerAttachments.length, 1, "Customer order should keep one reference attachment.");

  const app = await buildApp();

  try {
    const workspacePage = await app.inject({
      method: "GET",
      url: "/workspace?user=admin",
    });
    const templatesPage = await app.inject({
      method: "GET",
      url: "/templates?user=admin",
    });
    const workflowsPage = await app.inject({
      method: "GET",
      url: "/workflows?user=admin",
    });
    const documentsPage = await app.inject({
      method: "GET",
      url: "/documents?user=admin",
    });
    const adminPage = await app.inject({
      method: "GET",
      url: "/admin?user=admin",
    });
    const apiPage = await app.inject({
      method: "GET",
      url: "/apis?user=admin",
    });
    const removedPreviewPath = await app.inject({
      method: "GET",
      url: "/dev/forms/preview/customer-order",
    });
    const customerTemplatePage = await app.inject({
      method: "GET",
      url: "/templates/99999999-9999-9999-9999-999999999991?user=admin",
    });
    const customerWorkflowPage = await app.inject({
      method: "GET",
      url: "/workflows/88888888-8888-8888-8888-888888888881?user=admin",
    });
    const customerLookupApiPage = await app.inject({
      method: "GET",
      url: `/apis/${customersLookup.id}?user=admin`,
    });
    const customerDocumentPage = await app.inject({
      method: "GET",
      url: "/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1?user=service-durchfuehrung-dokumentation",
    });
    const productionDocumentPage = await app.inject({
      method: "GET",
      url: "/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee2?user=produktion-durchfuehrung-dokumentation",
    });
    const qualificationServicePage = await app.inject({
      method: "GET",
      url: "/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3?user=service-durchfuehrung-dokumentation",
    });
    const qualificationProductionPage = await app.inject({
      method: "GET",
      url: "/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3?user=produktion-durchfuehrung-dokumentation",
    });
    const genericDocumentPage = await app.inject({
      method: "GET",
      url: "/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee4?user=service-durchfuehrung-dokumentation",
    });

    assert.equal(workspacePage.statusCode, 200);
    assert.equal(templatesPage.statusCode, 200);
    assert.equal(workflowsPage.statusCode, 200);
    assert.equal(documentsPage.statusCode, 200);
    assert.equal(adminPage.statusCode, 200);
    assert.equal(apiPage.statusCode, 200);
    assert.equal(removedPreviewPath.statusCode, 404);
    assert.equal(customerTemplatePage.statusCode, 200);
    assert.equal(customerWorkflowPage.statusCode, 200);
    assert.equal(customerLookupApiPage.statusCode, 200);
    assert.equal(customerDocumentPage.statusCode, 200);
    assert.equal(productionDocumentPage.statusCode, 200);
    assert.equal(qualificationServicePage.statusCode, 200);
    assert.equal(qualificationProductionPage.statusCode, 200);
    assert.equal(genericDocumentPage.statusCode, 200);

    assert.match(workspacePage.body, /Kundenauftrag/);
    assert.match(workspacePage.body, /Produktionsdokumentation/);
    assert.match(workspacePage.body, /Qualifikationsnachweis/);
    assert.match(workspacePage.body, /Generisches Formular/);
    assert.match(templatesPage.body, /Kundenauftrag/);
    assert.match(templatesPage.body, /Produktionsdokumentation/);
    assert.match(templatesPage.body, /Qualifikationsnachweis/);
    assert.match(templatesPage.body, /Generisches Formular/);
    assert.doesNotMatch(templatesPage.body, /Evidence Basic/);
    assert.doesNotMatch(templatesPage.body, /ERP-SIM/);
    assert.match(workflowsPage.body, /Kundenauftrag Freigabe/);
    assert.match(workflowsPage.body, /Produktionsdokumentation Freigabe/);
    assert.match(workflowsPage.body, /Qualifikationsnachweis Review/);
    assert.match(workflowsPage.body, /Generisches Formular Freigabe/);
    assert.match(documentsPage.body, /Kundenauftrag KD-2026-1007/);
    assert.match(documentsPage.body, /Produktion PB-2026-0042/);
    assert.match(documentsPage.body, /Qualifikationsnachweis QN-2026-001/);
    assert.match(documentsPage.body, /Generisches Formular GF-2026-001/);
    assert.match(adminPage.body, /Admin/);
    assert.match(adminPage.body, /Service Auftrag \/ Freigabe/);
    assert.match(adminPage.body, /Produktion Durchfuehrung \/ Dokumentation/);

    assert.match(apiPage.body, /customers\.lookup/);
    assert.match(apiPage.body, /products\.suggest/);
    assert.match(apiPage.body, /New API/);
    assert.match(apiPage.body, /Open/);
    assert.match(apiPage.body, /Stammdaten APIs/);
    assert.match(apiPage.body, /Typed Record APIs/);
    assert.match(apiPage.body, /customer-orders/);
    assert.match(apiPage.body, /CSV Import Customers/);
    assert.match(customerLookupApiPage.body, /Handler Source/);
    assert.match(customerLookupApiPage.body, /Customer Lookup/);
    assert.match(customerLookupApiPage.body, /customers\.lookup/);
    assert.match(customerLookupApiPage.body, /api-description\" name=\"description\" rows=\"3\" class=\"text-input api-description-input\"/);
    assert.ok(customerLookupApiPage.body.indexOf("Handler Source") < customerLookupApiPage.body.indexOf("Request / Response"));
    assert.match(customerTemplatePage.body, /API Operations/);
    assert.match(customerTemplatePage.body, /customers\.lookup/);
    assert.match(customerTemplatePage.body, /products\.suggest/);
    assert.match(customerTemplatePage.body, /customer_order/);
    assert.match(customerWorkflowPage.body, /workflow-api-options/);
    assert.match(customerWorkflowPage.body, /customers\.lookup/);

    assert.match(customerDocumentPage.body, /Kundendaten laden/);
    assert.match(customerDocumentPage.body, /Materialvorschlag holen/);
    assert.match(customerDocumentPage.body, /customer_order/);
    assert.match(customerDocumentPage.body, /Typed Record API/);
    assert.match(customerDocumentPage.body, /\/api\/typed-records\/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1\?user=service-durchfuehrung-dokumentation/);
    assert.match(customerDocumentPage.body, /Baukontor Nord/);
    assert.match(customerDocumentPage.body, /Wartungsset Heizung/);
    assert.doesNotMatch(customerDocumentPage.body, /ERP-SIM/);

    assert.match(productionDocumentPage.body, /PB-2026-0042/);
    assert.match(productionDocumentPage.body, /production_record/);
    assert.match(productionDocumentPage.body, /Steuerkasten Serie S2/);
    assert.match(productionDocumentPage.body, /Arbeitsschritt/);

    assert.match(qualificationServicePage.body, /qualification_record/);
    assert.match(qualificationServicePage.body, /Service Durchfuehrung \/ Dokumentation/);
    assert.match(qualificationServicePage.body, /Seite 1 von 3/);
    assert.match(qualificationServicePage.body, /Nachweisnummer/);
    assert.doesNotMatch(qualificationServicePage.body, /Selbsteinschaetzung/);
    assert.doesNotMatch(qualificationServicePage.body, /Status \/ Freigabe/);
    assert.match(qualificationProductionPage.body, /Produktion Durchfuehrung \/ Dokumentation/);
    assert.match(genericDocumentPage.body, /generic_form/);
    assert.match(genericDocumentPage.body, /Generisches Formular GF-2026-001/);

    const searchedCustomerDocuments = await app.inject({
      method: "GET",
      url: "/documents?user=admin&q=KD-2026-1007",
    });
    const searchedProductionDocuments = await app.inject({
      method: "GET",
      url: "/documents?user=admin&q=PB-2026-0042",
    });
    const searchedQualificationDocuments = await app.inject({
      method: "GET",
      url: "/documents?user=admin&q=QN-2026-001",
    });
    const searchedGenericDocuments = await app.inject({
      method: "GET",
      url: "/documents?user=admin&q=GF-2026-001",
    });
    assert.match(searchedCustomerDocuments.body, /Kundenauftrag KD-2026-1007/);
    assert.doesNotMatch(searchedCustomerDocuments.body, /Produktion PB-2026-0042/);
    assert.match(searchedProductionDocuments.body, /Produktion PB-2026-0042/);
    assert.doesNotMatch(searchedProductionDocuments.body, /Kundenauftrag KD-2026-1007/);
    assert.match(searchedQualificationDocuments.body, /Qualifikationsnachweis QN-2026-001/);
    assert.match(searchedGenericDocuments.body, /Generisches Formular GF-2026-001/);

    const customerLookupAction = await app.inject({
      method: "POST",
      url: "/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1/form?user=service-durchfuehrung-dokumentation&intent=run-action&actionName=load_customer",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: "order_number=KD-2026-1007",
    });
    const materialLookupAction = await app.inject({
      method: "POST",
      url: "/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1/form?user=service-durchfuehrung-dokumentation&intent=run-action&actionName=suggest_material",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `work_description=${encodeURIComponent("Wartung Heizung Filterwechsel")}`,
    });

    assert.equal(customerLookupAction.statusCode, 200);
    assert.match(customerLookupAction.body, /Kundendaten geladen/);
    assert.match(customerLookupAction.body, /Baukontor Nord/);
    assert.match(customerLookupAction.body, /Lagerhalle 2 Bremen/);
    assert.match(customerLookupAction.body, /document-form-body-fragment/);

    assert.equal(materialLookupAction.statusCode, 200);
    assert.match(materialLookupAction.body, /Produktvorschlag geladen/);
    assert.match(materialLookupAction.body, /Wartungsset Heizung/);

    const createDraftApi = await app.inject({
      method: "POST",
      url: "/apis/new?user=admin",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload:
        `key=${encodeURIComponent("qa.runtime.note")}&title=${encodeURIComponent("QA Runtime Note")}&connector=typescript&authMode=none&requestSchemaText=${encodeURIComponent("{\"fields\":[]}")}&responseSchemaText=${encodeURIComponent("{\"fields\":[]}")}&handlerTsSource=${encodeURIComponent("export default async function handler(input, runtime) { return { fieldValues: input.fieldValues ?? {}, actionState: runtime.createInfoActionState({ title: 'QA', message: 'ok', actionName: input.action?.name ?? 'qa' }) }; }")}&tagsText=${encodeURIComponent("qa, smoke")}`,
    });
    assert.equal(createDraftApi.statusCode, 303);
    const createdApiLocation = createDraftApi.headers.location;
    assert.ok(createdApiLocation);
    assert.match(createdApiLocation, /\/apis\//);

    const createdApiPage = await app.inject({
      method: "GET",
      url: String(createdApiLocation),
    });
    assert.equal(createdApiPage.statusCode, 200);
    assert.match(createdApiPage.body, /QA Runtime Note/);
    assert.match(createdApiPage.body, /qa\.runtime\.note/);

    const createdApiId = String(createdApiLocation).match(/\/apis\/([^?]+)/)?.[1];
    assert.ok(createdApiId);
    const publishDraftApi = await app.inject({
      method: "POST",
      url: `/apis/${createdApiId}?user=admin`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload:
        `intent=publish&key=${encodeURIComponent("qa.runtime.note")}&title=${encodeURIComponent("QA Runtime Note")}&connector=typescript&authMode=none&requestSchemaText=${encodeURIComponent("{\"fields\":[]}")}&responseSchemaText=${encodeURIComponent("{\"fields\":[]}")}&handlerTsSource=${encodeURIComponent("export default async function handler(input, runtime) { return { fieldValues: input.fieldValues ?? {}, actionState: runtime.createInfoActionState({ title: 'QA', message: 'ok', actionName: input.action?.name ?? 'qa' }) }; }")}&tagsText=${encodeURIComponent("qa, smoke")}`,
    });
    assert.equal(publishDraftApi.statusCode, 303);

    const customerEntitiesApi = await app.inject({
      method: "GET",
      url: "/api/entities/customers?user=admin",
    });
    const customerEntityApi = await app.inject({
      method: "GET",
      url: "/api/entities/customers/customer-baukontor?user=admin",
    });
    const productEntitiesApi = await app.inject({
      method: "GET",
      url: "/api/entities/products?user=admin",
    });
    const formDataApi = await app.inject({
      method: "GET",
      url: "/api/form-data/templates/customer-order-test?user=admin&fields=customer_order_number,material",
    });
    const csvExport = await app.inject({
      method: "GET",
      url: "/api/form-data/templates/production-batch/export.csv?user=admin&fields=batch_id,product_name",
    });

    assert.equal(customerEntitiesApi.statusCode, 200);
    assert.equal(customerEntityApi.statusCode, 200);
    assert.equal(productEntitiesApi.statusCode, 200);
    assert.equal(formDataApi.statusCode, 200);
    assert.equal(csvExport.statusCode, 200);
    assert.match(customerEntitiesApi.body, /customer-baukontor/);
    assert.match(customerEntityApi.body, /KD-2026-1007/);
    assert.match(productEntitiesApi.body, /product-control-box-s2/);
    assert.match(formDataApi.body, /customer_order_number/);
    assert.match(formDataApi.body, /Wartungsset Heizung/);
    assert.match(csvExport.body, /document_id,document_title,status,created_at,updated_at,batch_id,product_name/);
    assert.match(csvExport.body, /PB-2026-0042/);

    const qualificationNextPage = await app.inject({
      method: "POST",
      url: "/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3/form?user=produktion-durchfuehrung-dokumentation&intent=navigate-page&page=2",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: "qualification_current_page=1",
    });
    assert.equal(qualificationNextPage.statusCode, 303);

    const qualificationQuestionsPage = await app.inject({
      method: "GET",
      url: "/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3?user=produktion-durchfuehrung-dokumentation",
    });
    assert.match(qualificationQuestionsPage.body, /Seite 2 von 3/);
    assert.match(qualificationQuestionsPage.body, /Selbsteinschaetzung/);
    assert.doesNotMatch(qualificationQuestionsPage.body, /Status \/ Freigabe/);

    const qualificationSave = await app.inject({
      method: "POST",
      url: "/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3/form?user=produktion-durchfuehrung-dokumentation",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload:
        `qualification_current_page=2&qualification_result=teilweise&qualification_topics=${encodeURIComponent("Arbeitsschutz,Freigabe")}`,
    });

    assert.equal(qualificationSave.statusCode, 303);

    const qualificationAfterSave = await app.inject({
      method: "GET",
      url: "/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3?user=produktion-durchfuehrung-dokumentation",
    });
    assert.equal(qualificationAfterSave.statusCode, 200);
    assert.match(qualificationAfterSave.body, /Produktion Durchfuehrung \/ Dokumentation/);
    assert.match(qualificationAfterSave.body, /Seite 2 von 3/);
    assert.match(qualificationAfterSave.body, /teilweise/);
    assert.match(qualificationAfterSave.body, /Arbeitsschutz/);
    assert.match(qualificationAfterSave.body, /Freigabe/);

    const qualificationApprovalPage = await app.inject({
      method: "POST",
      url: "/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3/form?user=produktion-durchfuehrung-dokumentation&intent=navigate-page&page=3",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: "qualification_current_page=2",
    });
    assert.equal(qualificationApprovalPage.statusCode, 303);

    const qualificationAfterPage3 = await app.inject({
      method: "GET",
      url: "/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3?user=produktion-durchfuehrung-dokumentation",
    });
    assert.match(qualificationAfterPage3.body, /Seite 3 von 3/);
    assert.match(qualificationAfterPage3.body, /pending|passed|failed/);

    const qualificationSubmitFirst = await app.inject({
      method: "POST",
      url: "/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3/submit?user=produktion-durchfuehrung-dokumentation",
    });
    assert.equal(qualificationSubmitFirst.statusCode, 303);

    const qualificationAfterFirstSubmit = await app.inject({
      method: "GET",
      url: "/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3?user=admin",
    });
    assert.match(qualificationAfterFirstSubmit.body, /Submit AND/);
    assert.match(qualificationAfterFirstSubmit.body, /assigned|submitted/);

    const qualificationSubmitSecond = await app.inject({
      method: "POST",
      url: "/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3/submit?user=service-durchfuehrung-dokumentation",
    });
    assert.equal(qualificationSubmitSecond.statusCode, 303);

    const qualificationAfterSecondSubmit = await app.inject({
      method: "GET",
      url: "/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3?user=admin",
    });
    assert.match(qualificationAfterSecondSubmit.body, /Submit AND/);
    assert.match(qualificationAfterSecondSubmit.body, /submitted/);

    const qualificationTypedApi = await app.inject({
      method: "GET",
      url: "/api/typed-records/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3?user=admin",
    });
    const genericTypedApi = await app.inject({
      method: "GET",
      url: "/api/typed-records/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee4?user=admin",
    });
    assert.equal(qualificationTypedApi.statusCode, 200);
    assert.equal(genericTypedApi.statusCode, 200);
    assert.match(qualificationTypedApi.body, /qualification_records/);
    assert.match(genericTypedApi.body, /generic_form_records/);

    const customerRecordListApi = await app.inject({
      method: "GET",
      url: "/api/typed-records/customer-orders?user=admin",
    });
    const customerRecordDetailApi = await app.inject({
      method: "GET",
      url: "/api/typed-records/customer-orders/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1?user=admin",
    });
    const customerRecordCsvApi = await app.inject({
      method: "GET",
      url: "/api/typed-records/customer-orders/export.csv?user=admin",
    });
    const productionRecordListApi = await app.inject({
      method: "GET",
      url: "/api/typed-records/production-records?user=admin",
    });
    const productionRecordDetailApi = await app.inject({
      method: "GET",
      url: "/api/typed-records/production-records/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee2?user=admin",
    });
    const qualificationRecordListApi = await app.inject({
      method: "GET",
      url: "/api/typed-records/qualification-records?user=admin",
    });
    const qualificationRecordDetailApi = await app.inject({
      method: "GET",
      url: "/api/typed-records/qualification-records/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3?user=admin",
    });
    const genericRecordListApi = await app.inject({
      method: "GET",
      url: "/api/typed-records/generic-form-records?user=admin",
    });
    const genericRecordDetailApi = await app.inject({
      method: "GET",
      url: "/api/typed-records/generic-form-records/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee4?user=admin",
    });
    assert.equal(customerRecordListApi.statusCode, 200);
    assert.equal(customerRecordDetailApi.statusCode, 200);
    assert.equal(customerRecordCsvApi.statusCode, 200);
    assert.equal(productionRecordListApi.statusCode, 200);
    assert.equal(productionRecordDetailApi.statusCode, 200);
    assert.equal(qualificationRecordListApi.statusCode, 200);
    assert.equal(qualificationRecordDetailApi.statusCode, 200);
    assert.equal(genericRecordListApi.statusCode, 200);
    assert.equal(genericRecordDetailApi.statusCode, 200);
    assert.match(customerRecordListApi.body, /customer_orders/);
    assert.match(customerRecordDetailApi.body, /workDescriptionHtml/);
    assert.match(customerRecordCsvApi.body, /documentId,orderNumber,customerName/);
    assert.match(productionRecordListApi.body, /production_records/);
    assert.match(productionRecordDetailApi.body, /processStepsJson/);
    assert.match(qualificationRecordListApi.body, /qualification_records/);
    assert.match(qualificationRecordDetailApi.body, /qualificationTopicsJson/);
    assert.match(genericRecordListApi.body, /generic_form_records/);
    assert.match(genericRecordDetailApi.body, /payloadJson/);

    const csvCustomerImport = await app.inject({
      method: "POST",
      url: "/apis/import/customers?user=admin",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `csvText=${encodeURIComponent("entity_key,display_name,status,customer_number,order_number,order_status,order_created_at,service_location,city\ncustomer-neu,Neu Service GmbH,active,CU-1099,KD-2026-1099,offen,2026-04-03T12:00:00.000Z,Werft 5,Kiel")}`,
    });
    assert.equal(csvCustomerImport.statusCode, 303);

    const customerEntitiesAfterImport = await app.inject({
      method: "GET",
      url: "/api/entities/customers?user=admin",
    });
    assert.equal(customerEntitiesAfterImport.statusCode, 200);
    assert.match(customerEntitiesAfterImport.body, /Neu Service GmbH/);
  } finally {
    await app.close();
    await closePool();
  }

  console.log("reference smoke passed");
};

main().catch(async (error: unknown) => {
  console.error(error);
  await closePool();
  process.exitCode = 1;
});
