'use server';

import type { Prisma } from '@prisma/client';
import { revalidatePath, revalidateTag } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { AdminAuthRepository } from '@/lib/auth/admin-auth-repository';
import { requirePermission } from '@/lib/auth/admin-session';
import { getAdminRequestContext } from '@/lib/auth/request-context';
import { prisma } from '@/lib/database/prisma';
import { SiteSettingsRepository } from '@/lib/database/repositories/site-settings';
import {
  BRANDING_CACHE_TAG,
  GLOBAL_SEO_CACHE_TAG,
  SITE_SETTINGS_CACHE_TAG,
} from '@/lib/site-settings/public-site-settings';
import {
  siteSettingGroupToKey,
  type BrandingSettings,
  type SiteSettingGroup,
} from '@/lib/site-settings/site-settings-types';
import { parseSiteSettingGroup } from '@/lib/site-settings/site-settings-validation';
import { assertSameOriginAction } from '@/lib/security/action-origin';

export async function updateSiteSettingGroup(formData: FormData) {
  const group = String(formData.get('group') ?? '') as SiteSettingGroup;
  const permission =
    group === 'seo' || group === 'search' || group === 'analytics'
      ? 'settings.seo.manage'
      : 'settings.update';
  const session = await requirePermission(permission);
  await assertSameOriginAction();

  if (!(group in siteSettingGroupToKey)) {
    throw new Error('Invalid settings group.');
  }

  const repository = new SiteSettingsRepository(prisma);
  const payload = getGroupPayload(group, formData);
  const value = parseSiteSettingGroup(
    group,
    group === 'footer'
      ? { ...(await repository.getSettings()).footer, ...payload }
      : payload,
  );
  if (group === 'branding') {
    const branding = value as BrandingSettings;
    await assertActiveImageMedia([
      branding.logoMediaId,
      branding.logoDarkMediaId,
      branding.faviconMediaId,
      branding.appleTouchIconMediaId,
      branding.defaultOgImageMediaId,
    ]);
  }

  const record = await repository.updateGroup(
    group,
    value,
    session.userId,
  );

  await appendSettingsAudit(session.userId, record.id, {
    group,
    key: record.key,
    changedFields: Object.keys(value),
  });

  revalidateSiteSettings();
  redirect(`/admin/settings#${group}`);
}

function getGroupPayload(group: SiteSettingGroup, formData: FormData) {
  if (group === 'legal' || group === 'system' || group === 'footer') {
    const payload: Record<string, FormDataEntryValue | boolean> = {};
    for (const [key, value] of formData.entries()) {
      if (key !== 'group') payload[key] = value;
    }
    if (group === 'legal') {
      payload.privacyPolicyEnabled =
        formData.get('privacyPolicyEnabled') === 'true';
      payload.cookiePolicyEnabled =
        formData.get('cookiePolicyEnabled') === 'true';
      payload.kvkkEnabled = formData.get('kvkkEnabled') === 'true';
    }
    if (group === 'system') {
      payload.maintenanceMode = formData.get('maintenanceMode') === 'true';
    }
    if (group === 'footer') {
      if (formData.get('footerAdvanced') === 'true') {
        payload.poweredByEnabled = formData.get('poweredByEnabled') === 'true';
        payload.showMapEmbed = formData.get('showMapEmbed') === 'true';
      }
    }
    return payload;
  }

  return Object.fromEntries(
    Array.from(formData.entries()).filter(([key]) => key !== 'group'),
  );
}

async function assertActiveImageMedia(mediaIds: string[]) {
  const ids = mediaIds.filter(Boolean);
  if (!ids.length) return;

  const count = await prisma.media.count({
    where: {
      id: { in: ids },
      archivedAt: null,
      usageType: { in: ['IMAGE', 'LOGO', 'FAVICON', 'OPEN_GRAPH'] },
      mimeType: { startsWith: 'image/' },
    },
  });

  if (count !== new Set(ids).size) {
    throw new Error('Selected branding media must be active image media.');
  }
}

async function appendSettingsAudit(
  actorId: string,
  entityId: string,
  metadata: Prisma.InputJsonValue,
) {
  await new AdminAuthRepository(prisma).appendAuditLog({
    actorId,
    action: 'UPDATE',
    entityType: 'SiteSetting',
    entityId,
    metadata,
    context: getAdminRequestContext(await headers()),
  });
}

function revalidateSiteSettings() {
  revalidateTag(SITE_SETTINGS_CACHE_TAG, 'max');
  revalidateTag(GLOBAL_SEO_CACHE_TAG, 'max');
  revalidateTag(BRANDING_CACHE_TAG, 'max');
  revalidatePath('/');
  revalidatePath('/admin/settings');
  revalidatePath('/sitemap.xml');
  revalidatePath('/robots.txt');
}
