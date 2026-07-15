import { describe, expect, it } from 'vitest';

import {
  createTelHref,
  defaultSiteSettings,
  formatDisplayPhone,
} from '@/lib/site-settings/site-settings-types';
import {
  isSafeCtaUrl,
  parseSiteSettingGroup,
  parseSiteSettings,
} from '@/lib/site-settings/site-settings-validation';

describe('site settings validation', () => {
  it('parses the default setting set', () => {
    const parsed = parseSiteSettings(defaultSiteSettings);

    expect(parsed.general.companyName).toBe('Orontes Teknoloji');
    expect(parsed.contact.emailPrimary).toBe('info@orontesteknoloji.com');
    expect(parsed.legal.cookiePolicyEnabled).toBe(true);
  });

  it('rejects invalid email and phone values', () => {
    expect(() =>
      parseSiteSettingGroup('contact', {
        ...defaultSiteSettings.contact,
        emailPrimary: 'not-an-email',
      }),
    ).toThrow();

    expect(() =>
      parseSiteSettingGroup('contact', {
        ...defaultSiteSettings.contact,
        phonePrimary: 'abc',
      }),
    ).toThrow();
  });

  it('rejects unsafe URLs while allowing safe CTA protocols', () => {
    expect(isSafeCtaUrl('/servis-talebi')).toBe(true);
    expect(isSafeCtaUrl('tel:+905536065703')).toBe(true);
    expect(isSafeCtaUrl('mailto:info@orontesteknoloji.com')).toBe(true);
    expect(isSafeCtaUrl('javascript:alert(1)')).toBe(false);
    expect(() =>
      parseSiteSettingGroup('social', {
        ...defaultSiteSettings.social,
        instagram: 'javascript:alert(1)',
      }),
    ).toThrow();
  });

  it('validates maintenance settings', () => {
    const parsed = parseSiteSettingGroup('system', {
      maintenanceMode: true,
      maintenanceMessage: 'Planlı bakım yapılmaktadır.',
    });

    expect(parsed.maintenanceMode).toBe(true);
  });

  it('normalizes Turkish phone numbers for display and tel links', () => {
    expect(formatDisplayPhone('05536065703')).toBe('0553 606 57 03');
    expect(formatDisplayPhone('5536065703')).toBe('0553 606 57 03');
    expect(formatDisplayPhone('+905536065703')).toBe('0553 606 57 03');

    expect(createTelHref('05536065703')).toBe('tel:+905536065703');
    expect(createTelHref('5536065703')).toBe('tel:+905536065703');
    expect(createTelHref('+905536065703')).toBe('tel:+905536065703');
  });
});
