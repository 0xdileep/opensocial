import { randomUUID } from 'node:crypto';
import { query } from '../../db/client.js';
import { decryptSecret, encryptSecret } from '../../lib/crypto.js';
export async function createPlatformAccount(input) {
    const id = randomUUID();
    const result = await query(`insert into platform_accounts (
      id, workspace_id, platform, account_label, access_token, refresh_token, meta
    ) values ($1,$2,$3,$4,$5,$6,$7::jsonb)
    returning
      id,
      workspace_id as "workspaceId",
      platform,
      account_label as "accountLabel",
      access_token as "accessToken",
      refresh_token as "refreshToken",
      meta,
      created_at as "createdAt",
      updated_at as "updatedAt"`, [
        id,
        input.workspaceId,
        input.platform,
        input.accountLabel,
        encryptSecret(input.accessToken),
        input.refreshToken ? encryptSecret(input.refreshToken) : null,
        JSON.stringify(input.meta ?? {})
    ]);
    return hydrateSecrets(result.rows[0]);
}
export async function listPlatformAccounts(workspaceId) {
    const result = workspaceId
        ? await query(`select
          id,
          workspace_id as "workspaceId",
          platform,
          account_label as "accountLabel",
          access_token as "accessToken",
          refresh_token as "refreshToken",
          meta,
          created_at as "createdAt",
          updated_at as "updatedAt"
         from platform_accounts where workspace_id = $1 order by created_at desc`, [workspaceId])
        : await query(`select
          id,
          workspace_id as "workspaceId",
          platform,
          account_label as "accountLabel",
          access_token as "accessToken",
          refresh_token as "refreshToken",
          meta,
          created_at as "createdAt",
          updated_at as "updatedAt"
         from platform_accounts order by created_at desc`);
    return result.rows.map(hydrateSecrets);
}
export async function getPlatformAccount(workspaceId, platform) {
    const result = await query(`select
      id,
      workspace_id as "workspaceId",
      platform,
      account_label as "accountLabel",
      access_token as "accessToken",
      refresh_token as "refreshToken",
      meta,
      created_at as "createdAt",
      updated_at as "updatedAt"
     from platform_accounts
     where workspace_id = $1 and platform = $2
     order by created_at desc
     limit 1`, [workspaceId, platform]);
    return result.rows[0] ? hydrateSecrets(result.rows[0]) : null;
}
function hydrateSecrets(account) {
    return {
        ...account,
        accessToken: decryptSecret(account.accessToken) ?? '',
        refreshToken: decryptSecret(account.refreshToken ?? null)
    };
}
