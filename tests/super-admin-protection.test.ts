import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  login,
  readSupabaseEnv,
  reportSkip,
  rest,
  suiteCredentials,
  type Env,
  type Session,
} from "./support/harness";
import { isValidEmail } from "../src/services/accountSecurity";

/**
 * The primary Super Admin must stay locked no matter who tries to move it, and the
 * account's own login email must be the only identity field a human can change here.
 *
 * Every attack below is attempted through the ordinary REST interface with a real
 * staff session — a different super_admin, which is the strongest identity this
 * environment can present. Each assertion is followed by a re-read of the protected
 * row, because a request that is silently filtered by row-level security is just as
 * acceptable as one the database refuses outright; what is never acceptable is change.
 */

const env = readSupabaseEnv();
const run = env ? describe : describe.skip;
const creds = suiteCredentials();

type ProfileRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  is_primary_admin: boolean;
};

run("primary Super Admin identity lock", () => {
  let staff: Session | null = null;
  let customer: Session | null = null;
  let primary: ProfileRow | null = null;
  let otherStaffId = "";
  const touched = { transferredFlag: false };

  const readProfile = async (id: string): Promise<ProfileRow | null> => {
    const res = await rest(env!, staff?.token ?? null, `profiles?select=*&id=eq.${id}`);
    const rows = res.json<ProfileRow[]>();
    return rows[0] ?? null;
  };

  beforeAll(async () => {
    if (!env) return;
    staff = await login(env, creds.staffEmail, creds.staffPassword);
    customer = await login(env, creds.aEmail, creds.aPassword);
    if (!staff) return;

    const found = await rest(env, staff.token, "profiles?select=*&is_primary_admin=eq.true");
    primary = found.json<ProfileRow[]>()[0] ?? null;

    const others = await rest(
      env,
      staff.token,
      `profiles?select=*&role=neq.customer&id=neq.${primary?.id ?? ""}&order=created_at.asc&limit=1`
    );
    otherStaffId = others.json<ProfileRow[]>()[0]?.id ?? "";
  }, 60_000);

  afterAll(async () => {
    // If a future regression ever lets the flag be copied, put the fixture back.
    if (env && staff && touched.transferredFlag && otherStaffId) {
      await rest(env, staff.token, `profiles?id=eq.${otherStaffId}`, {
        method: "PATCH",
        body: { is_primary_admin: false },
      });
    }
  });

  it("needs a staff session and a profile flagged as the primary admin", () => {
    if (!staff || !primary) {
      reportSkip("staff session or a profiles.is_primary_admin row unavailable");
      return;
    }
    expect(primary.role).toBe("super_admin");
    expect(primary.status).toBe("active");
    expect(primary.is_primary_admin).toBe(true);
  });

  it("refuses to downgrade the primary Super Admin role", async () => {
    if (!env || !staff || !primary) return;
    const res = await rest(env, staff.token, `profiles?id=eq.${primary.id}`, {
      method: "PATCH",
      body: { role: "manager" },
    });
    expect([400, 403, 401], res.text).toContain(res.status);

    const after = await readProfile(primary.id);
    expect(after?.role).toBe("super_admin");
  }, 60_000);

  it("refuses to deactivate or suspend the primary Super Admin", async () => {
    if (!env || !staff || !primary) return;
    const res = await rest(env, staff.token, `profiles?id=eq.${primary.id}`, {
      method: "PATCH",
      body: { status: "suspended" },
    });
    expect([400, 403, 401], res.text).toContain(res.status);

    const after = await readProfile(primary.id);
    expect(after?.status).toBe("active");
  }, 60_000);

  it("refuses to revoke the primary-admin flag, which would drop every other lock", async () => {
    if (!env || !staff || !primary) return;
    const res = await rest(env, staff.token, `profiles?id=eq.${primary.id}`, {
      method: "PATCH",
      body: { is_primary_admin: false },
    });
    expect([400, 403, 401], res.text).toContain(res.status);

    const after = await readProfile(primary.id);
    expect(after?.is_primary_admin).toBe(true);
  }, 60_000);

  it("refuses to hand the primary-admin identity to another profile", async () => {
    if (!env || !staff || !primary || !otherStaffId) return;
    const res = await rest(env, staff.token, `profiles?id=eq.${otherStaffId}`, {
      method: "PATCH",
      body: { is_primary_admin: true },
    });

    const after = await readProfile(otherStaffId);
    if (after?.is_primary_admin) touched.transferredFlag = true;

    expect([400, 403, 401], res.text).toContain(res.status);
    expect(after?.is_primary_admin).toBe(false);

    const stillOne = await rest(env, staff.token, "profiles?select=id&is_primary_admin=eq.true");
    expect(stillOne.json<ProfileRow[]>()).toHaveLength(1);
  }, 60_000);

  it("leaves the protected row byte-identical after every attempt", async () => {
    if (!env || !staff || !primary) return;
    const after = await readProfile(primary.id);
    expect(after).not.toBeNull();
    expect({
      role: after?.role,
      status: after?.status,
      is_primary_admin: after?.is_primary_admin,
      email: after?.email,
    }).toEqual({
      role: primary.role,
      status: primary.status,
      is_primary_admin: primary.is_primary_admin,
      email: primary.email,
    });
  }, 60_000);

  it("does not let a customer promote themselves", async () => {
    if (!env || !customer || !staff) return;
    const res = await rest(env, customer.token, `profiles?id=eq.${customer.id}`, {
      method: "PATCH",
      body: { role: "super_admin", is_primary_admin: true },
    });
    const after = await rest(env, staff.token, `profiles?select=role,is_primary_admin&id=eq.${customer.id}`);
    const row = after.json<{ role: string; is_primary_admin: boolean }[]>()[0];
    // Refused outright, or silently pinned to the old values by the guard trigger.
    expect(row?.role).not.toBe("super_admin");
    expect(row?.is_primary_admin).not.toBe(true);
    if (res.status >= 400) expect(res.status).toBeLessThan(500);
  }, 60_000);

  it("keeps the ordinary staff fields writable, so the lock is not a blanket freeze", async () => {
    if (!env || !staff || !otherStaffId) return;
    const before = await readProfile(otherStaffId);
    const res = await rest(env, staff.token, `profiles?id=eq.${otherStaffId}`, {
      method: "PATCH",
      body: { full_name: before?.full_name ?? "Staff" },
    });
    expect([200, 204], res.text).toContain(res.status);
  }, 60_000);
});

describe("login email validation (no provider needed)", () => {
  it("accepts complete addresses and rejects partial ones", () => {
    expect(isValidEmail("owner@example.com")).toBe(true);
    expect(isValidEmail("  Owner@Example.CO.UK ")).toBe(true);
    expect(isValidEmail("owner@example")).toBe(false);
    expect(isValidEmail("owner@")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
    expect(isValidEmail("owner at example.com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});
