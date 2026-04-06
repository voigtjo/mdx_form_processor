import assert from "node:assert/strict";
import { buildApp } from "../app.js";
import { findCustomerOrderRecord } from "../modules/documents/typed-records-read.js";
import { findDocumentDetailVisibleToUser } from "../modules/documents/read.js";
import { closePool } from "./pool.js";
import { seedServiceReportInstance } from "./seed-service-report.js";

const templateId = "91111111-1111-1111-1111-111111111111";
const frankId = "21111111-1111-1111-1111-111111111111";
const thomasId = "22222222-1111-1111-1111-111111111111";
const chefId = "55555555-1111-1111-1111-111111111111";

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

  const app = await buildApp();

  try {
    const documentsBeforeStart = await app.inject({
      method: "GET",
      url: "/documents?user=chef",
    });
    assert.equal(documentsBeforeStart.statusCode, 200);
    assert.match(documentsBeforeStart.body, /<strong>0<\/strong>\s*<span>Aktiv<\/span>/);

    const startResponse = await postForm(app, {
      url: "/documents/start?user=chef",
      payload: `templateId=${encodeURIComponent(templateId)}`,
    });
    assert.equal(startResponse.statusCode, 303);

    const documentId = extractDocumentIdFromLocation(startResponse.headers.location);

    const chefDraftOpen = await app.inject({
      method: "GET",
      url: `/documents/${documentId}?user=chef`,
    });
    assert.equal(chefDraftOpen.statusCode, 200);
    assert.match(chefDraftOpen.body, /Naechster Schritt: Zuweisen/);
    assert.match(chefDraftOpen.body, /Editoren fuer Zuweisung/);
    assert.match(chefDraftOpen.body, /Frank/);
    assert.match(chefDraftOpen.body, /Thomas/);

    const assignResponse = await postForm(app, {
      url: `/documents/${documentId}/assign?user=chef`,
      payload: `editorUserIds=${encodeURIComponent(frankId)}`,
    });
    assert.equal(assignResponse.statusCode, 303);

    const frankAssignedOpen = await app.inject({
      method: "GET",
      url: `/documents/${documentId}?user=frank`,
    });
    assert.equal(frankAssignedOpen.statusCode, 200);
    assert.match(frankAssignedOpen.body, /assigned/);

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
      url: "/documents?user=chef",
    });
    assert.equal(documentsAfterApprove.statusCode, 200);
    assert.match(documentsAfterApprove.body, /Service-Report O-ca26a72f-1/);
  } finally {
    await app.close();
    await closePool();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
