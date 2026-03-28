import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { listAttachmentsForDocument } from "../modules/attachments/read.js";
import { listGroups } from "../modules/groups/read.js";
import { listUsers } from "../modules/users/read.js";
import { listFormTemplates, listTemplateAssignments } from "../modules/templates/read.js";
import { listWorkflowTemplates } from "../modules/workflows/read.js";
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
    assert.doesNotMatch(templatesPage.body, /Template Review/);
    assert.match(templateDetailPage.body, /Back to Templates/);
    assert.match(templateDetailPage.body, /Customer Order Test/);
    assert.match(templateDetailPage.body, /MDX Source/);
    assert.match(templateDetailPage.body, /Open Workflow/);
    assert.match(templateDetailPage.body, /customer_order_number/);
    assert.match(templateNewPage.body, /Create Draft/);
    assert.match(templateNewPage.body, /Workflow Template/);
    assert.match(workflowsPage.body, /New Workflow/);
    assert.match(workflowsPage.body, /\/workflows\/66666666-6666-6666-6666-666666666661\?user=alice/);
    assert.match(workflowsPage.body, /Open Templates/);
    assert.doesNotMatch(workflowsPage.body, /Workflow Review/);
    assert.match(workflowDetailPage.body, /Back to Workflows/);
    assert.match(workflowDetailPage.body, /Action Overview/);
    assert.match(workflowDetailPage.body, /Sync external customer order status after approval/);
    assert.match(workflowDetailPage.body, /customerOrders\.setStatusFromContext/);
    assert.match(workflowDetailPage.body, /initialStatus/);
    assert.match(workflowDetailPage.body, /created/);
    assert.match(workflowNewPage.body, /Create Draft/);
    assert.match(adminPage.body, /New User/);
    assert.match(adminPage.body, /New Group/);
    assert.match(adminPage.body, /\/admin\/users\/11111111-1111-1111-1111-111111111111\?user=alice/);
    assert.match(adminPage.body, /\/admin\/groups\/33333333-3333-3333-3333-333333333333\?user=alice/);
    assert.match(adminUserNewPage.body, /Create User/);
    assert.match(adminGroupNewPage.body, /Create Group/);
    assert.match(documentsPage.body, /Apply Filters/);
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
    assert.match(documentDetail.body, /customer_order_number/);
    assert.match(documentDetail.body, /create_customer_order/);
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
