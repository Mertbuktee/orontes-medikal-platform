# Components

## Layout

- TopBar
- Navbar
- Footer

## Common

- Container
- Section
- SectionHeading

## Consent

- CookieConsentProvider
- CookieConsentBanner
- CookiePreferencesDialog
- CookieSettingsButton
- AnalyticsConsentGate
- MarketingConsentGate

The consent provider is mounted in the public root layout. Optional analytics
or marketing integrations must be rendered only inside the matching consent
gate. No third-party tracking script should be inserted outside these gates.

Footer includes a reusable `Çerez Tercihleri` control so visitors can reopen
the preference center after making a choice.

## Sections

- Hero
- Stats
- Services
- Devices
- BoardRepair
- WhyUs
- Process
- BlogPreview
- Contact
- CTA

## UI

shadcn/ui
