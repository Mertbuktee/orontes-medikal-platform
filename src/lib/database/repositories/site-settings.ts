import type { Prisma, PrismaClient } from '@prisma/client';

import { isProductionDeployment } from '@/config/site';
import {
  defaultSiteSettings,
  siteSettingKeys,
  siteSettingGroupToKey,
  type SiteSettingGroup,
  type SiteSettings,
} from '@/lib/site-settings/site-settings-types';
import {
  parseSiteSettingGroup,
  parseSiteSettings,
} from '@/lib/site-settings/site-settings-validation';

export class SiteSettingsRepository {
  private readonly client: PrismaClient;

  constructor(client: PrismaClient) {
    this.client = client;
  }

  async getSettings(): Promise<SiteSettings> {
    const rows = await this.client.siteSetting.findMany({
      where: { key: { in: Object.values(siteSettingGroupToKey) } },
      select: { key: true, value: true },
    });

    const raw: Partial<Record<SiteSettingGroup, unknown>> = {};
    for (const [group, key] of Object.entries(siteSettingGroupToKey) as Array<
      [SiteSettingGroup, string]
    >) {
      const row = rows.find((item) => item.key === key);
      if (!row && isProductionDeployment(process.env)) {
        throw new Error(`Missing production Site Settings group: ${key}`);
      }
      raw[group] = row?.value ?? defaultSiteSettings[group];
    }

    return parseSiteSettings(raw);
  }

  async updateGroup<K extends SiteSettingGroup>(
    group: K,
    value: SiteSettings[K],
    updatedById: string,
  ) {
    const parsed = parseSiteSettingGroup(group, value);

    return this.client.siteSetting.upsert({
      where: { key: siteSettingGroupToKey[group] },
      create: {
        key: siteSettingGroupToKey[group],
        value: parsed as Prisma.InputJsonValue,
        type: `site-${group}`,
        updatedById,
      },
      update: {
        value: parsed as Prisma.InputJsonValue,
        type: `site-${group}`,
        updatedById,
      },
    });
  }

  async seedDefaults() {
    for (const group of Object.keys(
      siteSettingGroupToKey,
    ) as SiteSettingGroup[]) {
      await this.client.siteSetting.upsert({
        where: { key: siteSettingGroupToKey[group] },
        create: {
          key: siteSettingGroupToKey[group],
          value: defaultSiteSettings[group] as Prisma.InputJsonValue,
          type: `site-${group}`,
        },
        update: {
          value: defaultSiteSettings[group] as Prisma.InputJsonValue,
          type: `site-${group}`,
        },
      });
    }
  }

  getDashboardSummary() {
    return this.client.siteSetting.count({
      where: { key: { in: Object.values(siteSettingGroupToKey) } },
    });
  }

  async getMissingGroups() {
    const rows = await this.client.siteSetting.findMany({
      where: { key: { in: [...siteSettingKeys] } },
      select: { key: true },
    });
    const existing = new Set(rows.map((row) => row.key));
    return siteSettingKeys.filter((key) => !existing.has(key));
  }
}
