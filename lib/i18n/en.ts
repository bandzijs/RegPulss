import type { Dictionary } from './types';

export const en: Dictionary = {
  nav: {
    ariaLabel: 'Main navigation',
    about: 'About',
    sources: 'Sources',
    contact: 'Contact',
  },
  language: {
    switcherAriaLabel: 'Site language',
    english: 'English',
    latvian: 'Latvian',
  },
  hero: {
    title: 'Stay ahead of regulatory changes in Latvia.',
    description:
      'Regulatory updates with direct links to official sources. Delivered to your inbox.',
    formNoteBefore: 'No spam, ',
    formNoteEmphasis: 'unsubscribe',
    formNoteAfter: ' anytime.',
    previewTitle: 'Weekly Regulatory Update',
    previewDate: 'January 6, 2026',
    badgeNew: 'New',
    badgeUpdated: 'Updated',
    badgeEu: 'EU',
    item1Title: 'Data Protection Amendment',
    item1Source: '→ likumi.lv',
    item2Title: 'Labor Law Changes',
    item2Source: '→ Saeima',
    item3Title: 'GDPR Enforcement Guidelines',
    item3Source: '→ EUR-Lex',
  },
  trust: {
    label: 'Monitoring official sources',
    sourceLikumi: 'likumi.lv',
    sourceSaeima: 'Saeima',
    sourceEurLex: 'EUR-Lex',
    sourceRegulators: 'Official regulators',
  },
  benefits: {
    sectionTitle: 'Built for professionals',
    card1Title: 'Clear summaries',
    card1Text:
      'Plain-language explanations of what changed, why it matters, and who it affects.',
    card2Title: 'Direct citations',
    card2Text:
      'Every update includes links to official texts from likumi.lv, Saeima, and EUR-Lex.',
    card3Title: 'Save time',
    card3Text:
      'Stop manually scanning multiple legal websites. Get updates delivered to your inbox.',
  },
  footer: {
    text: 'Built for professionals. Based on official regulatory sources.',
  },
  subscribe: {
    emailPlaceholder: 'Enter your work email',
    emailAriaLabel: 'Email address',
    subscribe: 'Subscribe',
    subscribing: 'Subscribing...',
    errorInvalidEmail: 'Please enter a valid email address.',
    errorGeneric: 'An error occurred. Please try again.',
    modalTitle: 'Almost there!',
    modalText: 'Please check your email to confirm your subscription.',
    close: 'Close',
  },
  cookie: {
    message:
      'We use cookies to enhance your experience and analyze site usage.',
    dismiss: 'Accept',
    link: 'Privacy Policy',
  },
  confirm: {
    metadataTitle: 'Confirm Subscription — RegPulss',
    titleSuccess: 'Subscription Confirmed',
    titleAlready: 'Already Confirmed',
    titleError: 'Confirmation Failed',
    invalidLink: 'Invalid confirmation link.',
    invalidOrExpired: 'This confirmation link is invalid or has expired.',
    alreadyConfirmed: 'Your subscription is already confirmed.',
    updateFailed: 'Something went wrong. Please try again later.',
    successMessage:
      'Your subscription has been confirmed! You will now receive regulatory updates.',
    backHome: 'Back to RegPulss',
  },
  apiSubscribe: {
    rateLimited:
      'Too many subscription attempts. Please try again later.',
    emailRequired: 'Email is required',
    invalidEmail: 'Please enter a valid email address.',
    alreadySubscribed: 'This email is already subscribed.',
    subscribeFailed: 'Failed to subscribe. Please try again.',
    successMessage:
      'Please check your email to confirm your subscription.',
    unexpectedError:
      'An error occurred during subscription. Please try again.',
  },
};
