import type { Group, Membership, MembershipRights, User } from "../types/domain.js";

export type AppSectionKey = "workspace" | "documents" | "templates" | "workflows" | "apis" | "groups" | "admin";

export const hasGlobalRole = (user: User, role: keyof User["globalRoles"]): boolean => {
  return Boolean(user.globalRoles[role]);
};

export const getMembershipForGroup = (
  memberships: Membership[],
  groupId: string | undefined,
): Membership | undefined => {
  if (!groupId) {
    return undefined;
  }

  return memberships.find((membership) => membership.groupId === groupId);
};

export const canManageAdmins = (user: User): boolean => hasGlobalRole(user, "admin") || hasGlobalRole(user, "chef");

export const canEditApis = (user: User): boolean => {
  return hasGlobalRole(user, "admin") || hasGlobalRole(user, "developer") || hasGlobalRole(user, "chef");
};

export const canViewTemplatesAndWorkflows = (
  user: User,
  membershipRights: MembershipRights | undefined,
): boolean => {
  return hasGlobalRole(user, "developer") || hasGlobalRole(user, "chef") || Boolean(membershipRights?.groupAdmin);
};

export const canEditTemplatesAndWorkflows = (
  user: User,
  membershipRights: MembershipRights | undefined,
): boolean => {
  return canViewTemplatesAndWorkflows(user, membershipRights);
};

export const canViewApis = (user: User, membershipRights: MembershipRights | undefined): boolean => {
  return canEditApis(user) || Boolean(membershipRights?.groupAdmin);
};

export const canViewGroups = (user: User, membershipRights: MembershipRights | undefined): boolean => {
  return hasGlobalRole(user, "developer") || hasGlobalRole(user, "chef") || Boolean(membershipRights?.groupAdmin);
};

export const canViewAdmin = (user: User): boolean => {
  return hasGlobalRole(user, "admin") || hasGlobalRole(user, "chef");
};

export const canViewAllFunctionalTabs = (user: User): boolean => {
  return hasGlobalRole(user, "developer") || hasGlobalRole(user, "chef");
};

export const canViewGroupScopedAdminTabs = (membershipRights: MembershipRights | undefined): boolean => {
  return Boolean(membershipRights?.groupAdmin);
};

export const canManageGroup = (user: User, membershipRights: MembershipRights | undefined): boolean => {
  return canManageAdmins(user) || Boolean(membershipRights?.groupAdmin);
};

export const canViewSection = (input: {
  section: AppSectionKey;
  user: User;
  membershipRights: MembershipRights | undefined;
}): boolean => {
  if (input.section === "workspace" || input.section === "documents") {
    return true;
  }

  if (input.section === "templates" || input.section === "workflows") {
    return canViewTemplatesAndWorkflows(input.user, input.membershipRights);
  }

  if (input.section === "apis") {
    return canViewApis(input.user, input.membershipRights);
  }

  if (input.section === "groups") {
    return canViewGroups(input.user, input.membershipRights);
  }

  return canViewAdmin(input.user);
};

export const getVisibleSections = (input: {
  user: User;
  selectedGroup?: Group;
  selectedMembership?: Membership;
}): AppSectionKey[] => {
  return (["workspace", "documents", "templates", "workflows", "apis", "groups", "admin"] as AppSectionKey[])
    .filter((section) => canViewSection({
      section,
      user: input.user,
      membershipRights: input.selectedMembership?.rights,
    }));
};
