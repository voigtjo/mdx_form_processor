import type { MembershipRights } from "../../types/domain.js";

export const parseMembershipRights = (value: string): MembershipRights => ({
  read: value.includes("r"),
  write: value.includes("w"),
  execute: value.includes("x"),
  groupAdmin: value.includes("g"),
});

export const serializeMembershipRights = (input: Partial<MembershipRights>): string => {
  return [
    input.read ? "r" : "",
    input.write ? "w" : "",
    input.execute ? "x" : "",
    input.groupAdmin ? "g" : "",
  ].join("");
};
