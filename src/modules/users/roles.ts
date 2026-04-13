import type { UserGlobalRoles } from "../../types/domain.js";

export const parseGlobalRoles = (value: string | null | undefined): UserGlobalRoles => ({
  admin: value?.includes("a") ?? false,
  developer: value?.includes("d") ?? false,
  chef: value?.includes("c") ?? false,
});

export const serializeGlobalRoles = (input: Partial<UserGlobalRoles> | undefined): string => {
  return [
    input?.admin ? "a" : "",
    input?.developer ? "d" : "",
    input?.chef ? "c" : "",
  ].join("");
};
