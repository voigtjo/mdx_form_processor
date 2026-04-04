import assert from "node:assert/strict";
import { buildApp } from "../app.js";
import { listAttachmentsForDocument } from "../modules/attachments/read.js";
import { listAuditEvents } from "../modules/audit/read.js";
import {
  findDocumentDetailVisibleToUser,
  listDocumentsAssignedToUser,
  listDocumentsVisibleToUser,
} from "../modules/documents/read.js";
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
  assert.equal(templates.length, 3, "Expected three reference templates.");
  assert.equal(workflows.length, 3, "Expected three reference workflows.");
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

  assert.equal(adminDocuments.length, 3, "Admin should see the three reference documents.");
  assert.ok(serviceDocuments.some((document) => document.title.includes("Kundenauftrag")));
  assert.ok(productionDocuments.some((document) => document.title.includes("Produktion")));
  assert.ok(qualificationAsService);
  assert.ok(qualificationAsProduction);
  assert.ok(qualificationAsAdmin);

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

    assert.equal(workspacePage.statusCode, 200);
    assert.equal(templatesPage.statusCode, 200);
    assert.equal(workflowsPage.statusCode, 200);
    assert.equal(documentsPage.statusCode, 200);
    assert.equal(adminPage.statusCode, 200);
    assert.equal(apiPage.statusCode, 200);
    assert.equal(customerDocumentPage.statusCode, 200);
    assert.equal(productionDocumentPage.statusCode, 200);
    assert.equal(qualificationServicePage.statusCode, 200);
    assert.equal(qualificationProductionPage.statusCode, 200);

    assert.match(workspacePage.body, /Kundenauftrag/);
    assert.match(workspacePage.body, /Produktionsdokumentation/);
    assert.match(workspacePage.body, /Qualifikationsnachweis/);
    assert.match(templatesPage.body, /Kundenauftrag/);
    assert.match(templatesPage.body, /Produktionsdokumentation/);
    assert.match(templatesPage.body, /Qualifikationsnachweis/);
    assert.doesNotMatch(templatesPage.body, /Evidence Basic/);
    assert.doesNotMatch(templatesPage.body, /ERP-SIM/);
    assert.match(workflowsPage.body, /Kundenauftrag Freigabe/);
    assert.match(workflowsPage.body, /Produktionsdokumentation Freigabe/);
    assert.match(workflowsPage.body, /Qualifikationsnachweis Review/);
    assert.match(documentsPage.body, /Kundenauftrag KD-2026-1007/);
    assert.match(documentsPage.body, /Produktion PB-2026-0042/);
    assert.match(documentsPage.body, /Qualifikationsnachweis QN-2026-001/);
    assert.match(adminPage.body, /Admin/);
    assert.match(adminPage.body, /Service Auftrag \/ Freigabe/);
    assert.match(adminPage.body, /Produktion Durchfuehrung \/ Dokumentation/);

    assert.match(apiPage.body, /customers\.lookup/);
    assert.match(apiPage.body, /products\.suggest/);
    assert.match(apiPage.body, /Stammdaten APIs/);
    assert.match(apiPage.body, /CSV Import Customers/);
    assert.match(apiPage.body, /Baukontor Nord/);
    assert.match(apiPage.body, /Wartungsset Heizung/);

    assert.match(customerDocumentPage.body, /Kundendaten laden/);
    assert.match(customerDocumentPage.body, /Materialvorschlag holen/);
    assert.match(customerDocumentPage.body, /Baukontor Nord/);
    assert.match(customerDocumentPage.body, /Wartungsset Heizung/);
    assert.doesNotMatch(customerDocumentPage.body, /ERP-SIM/);

    assert.match(productionDocumentPage.body, /PB-2026-0042/);
    assert.match(productionDocumentPage.body, /Steuerkasten Serie S2/);
    assert.match(productionDocumentPage.body, /Arbeitsschritt/);

    assert.match(qualificationServicePage.body, /Selbsteinschaetzung/);
    assert.match(qualificationServicePage.body, /Bestaetigte Themen/);
    assert.match(qualificationServicePage.body, /Service Durchfuehrung \/ Dokumentation/);
    assert.match(qualificationProductionPage.body, /Produktion Durchfuehrung \/ Dokumentation/);

    const customerLookupAction = await app.inject({
      method: "POST",
      url: "/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1/next-form?user=service-durchfuehrung-dokumentation&intent=run-action&actionName=load_customer",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: "order_number=KD-2026-1007",
    });
    const materialLookupAction = await app.inject({
      method: "POST",
      url: "/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1/next-form?user=service-durchfuehrung-dokumentation&intent=run-action&actionName=suggest_material",
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

    const qualificationSave = await app.inject({
      method: "POST",
      url: "/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3/next-form?user=produktion-durchfuehrung-dokumentation",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload:
        `qualification_result=teilweise&qualification_topics=${encodeURIComponent("Arbeitsschutz,Freigabe")}&work_signature_requested=sign`,
    });

    assert.equal(qualificationSave.statusCode, 303);

    const qualificationAfterSave = await app.inject({
      method: "GET",
      url: "/documents/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3?user=produktion-durchfuehrung-dokumentation",
    });
    assert.equal(qualificationAfterSave.statusCode, 200);
    assert.match(qualificationAfterSave.body, /Produktion Durchfuehrung \/ Dokumentation/);
    assert.match(qualificationAfterSave.body, /teilweise/);
    assert.match(qualificationAfterSave.body, /Arbeitsschutz/);
    assert.match(qualificationAfterSave.body, /Freigabe/);

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

    const csvCustomerImport = await app.inject({
      method: "POST",
      url: "/apis/import/customers?user=admin",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      payload: `csvText=${encodeURIComponent("entity_key,display_name,status,customer_number,order_number,order_status,order_created_at,service_location,city\ncustomer-neu,Neu Service GmbH,active,CU-1099,KD-2026-1099,offen,2026-04-03T12:00:00.000Z,Werft 5,Kiel")}`,
    });
    assert.equal(csvCustomerImport.statusCode, 303);

    const apiPageAfterImport = await app.inject({
      method: "GET",
      url: "/apis?user=admin",
    });
    assert.match(apiPageAfterImport.body, /Neu Service GmbH/);
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
