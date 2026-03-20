export type Locale = 'en' | 'lv';

export interface Dictionary {
  nav: {
    ariaLabel: string;
    about: string;
    sources: string;
    contact: string;
  };
  language: {
    switcherAriaLabel: string;
    english: string;
    latvian: string;
  };
  hero: {
    title: string;
    description: string;
    formNoteBefore: string;
    formNoteEmphasis: string;
    formNoteAfter: string;
    previewTitle: string;
    previewDate: string;
    badgeNew: string;
    badgeUpdated: string;
    badgeEu: string;
    item1Title: string;
    item1Source: string;
    item2Title: string;
    item2Source: string;
    item3Title: string;
    item3Source: string;
  };
  trust: {
    label: string;
    sourceLikumi: string;
    sourceSaeima: string;
    sourceEurLex: string;
    sourceRegulators: string;
  };
  benefits: {
    sectionTitle: string;
    card1Title: string;
    card1Text: string;
    card2Title: string;
    card2Text: string;
    card3Title: string;
    card3Text: string;
  };
  footer: {
    text: string;
  };
  subscribe: {
    emailPlaceholder: string;
    emailAriaLabel: string;
    subscribe: string;
    subscribing: string;
    errorInvalidEmail: string;
    errorGeneric: string;
    modalTitle: string;
    modalText: string;
    close: string;
  };
  cookie: {
    message: string;
    dismiss: string;
    link: string;
  };
  confirm: {
    metadataTitle: string;
    titleSuccess: string;
    titleAlready: string;
    titleError: string;
    invalidLink: string;
    invalidOrExpired: string;
    alreadyConfirmed: string;
    updateFailed: string;
    successMessage: string;
    backHome: string;
  };
  apiSubscribe: {
    rateLimited: string;
    emailRequired: string;
    invalidEmail: string;
    alreadySubscribed: string;
    subscribeFailed: string;
    successMessage: string;
    unexpectedError: string;
  };
}
