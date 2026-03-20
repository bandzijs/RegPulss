import type { Dictionary } from './types';

export const lv: Dictionary = {
  nav: {
    ariaLabel: 'Galvenā navigācija',
    about: 'Par mums',
    sources: 'Avoti',
    contact: 'Kontakti',
  },
  language: {
    switcherAriaLabel: 'Vietnes valoda',
    english: 'Angļu',
    latvian: 'Latviešu',
  },
  hero: {
    title: 'Esiet soli priekšā normatīvo izmaiņu Latvijā.',
    description:
      'Normatīvo aktu atjauninājumi ar tiešām saitēm uz oficiālajiem avotiem. Jūsu e-pastā.',
    formNoteBefore: 'Bez surogātpasta — jebkurā brīdī varat ',
    formNoteEmphasis: 'atrakstīties',
    formNoteAfter: '.',
    previewTitle: 'Iknedēļas normatīvo aktu kopsavilkums',
    previewDate: '2026. gada 6. janvāris',
    badgeNew: 'Jauns',
    badgeUpdated: 'Atjaunināts',
    badgeEu: 'ES',
    item1Title: 'Datu aizsardzības grozījumi',
    item1Source: '→ likumi.lv',
    item2Title: 'Darba likuma izmaiņas',
    item2Source: '→ Saeima',
    item3Title: 'VDAR piemērošanas vadlīnijas',
    item3Source: '→ EUR-Lex',
  },
  trust: {
    label: 'Uzraudzām oficiālos avotus',
    sourceLikumi: 'likumi.lv',
    sourceSaeima: 'Saeima',
    sourceEurLex: 'EUR-Lex',
    sourceRegulators: 'Oficiālās uzraudzības iestādes',
  },
  benefits: {
    sectionTitle: 'Izstrādāts profesionāļiem',
    card1Title: 'Skaidri kopsavilkumi',
    card1Text:
      'Vienkāršā valodā: kas mainījies, kāpēc tas svarīgi un kam attiecas.',
    card2Title: 'Tiešas atsauces',
    card2Text:
      'Katram atjauninājumam pievienotas saites uz oficiālajiem tekstiem likumi.lv, Saeimā un EUR-Lex.',
    card3Title: 'Ietaupiet laiku',
    card3Text:
      'Vairs nav jāpārlūko vairākas juridiskās vietnes. Saņemiet atjauninājumus e-pastā.',
  },
  footer: {
    text: 'Izstrādāts profesionāļiem. Balstīts uz oficiālajiem normatīvajiem avotiem.',
  },
  subscribe: {
    emailPlaceholder: 'Ievadiet darba e-pastu',
    emailAriaLabel: 'E-pasta adrese',
    subscribe: 'Abonēt',
    subscribing: 'Notiek abonēšana...',
    errorInvalidEmail: 'Lūdzu, ievadiet derīgu e-pasta adresi.',
    errorGeneric: 'Radās kļūda. Lūdzu, mēģiniet vēlreiz.',
    modalTitle: 'Gandrīz gatavs!',
    modalText:
      'Lūdzu, pārbaudiet e-pastu, lai apstiprinātu abonementu.',
    close: 'Aizvērt',
  },
  cookie: {
    message:
      'Mēs izmantojam sīkdatnes, lai uzlabotu jūsu pieredzi un analizētu vietnes lietojumu.',
    dismiss: 'Pieņemt',
    link: 'Privātuma politika',
  },
  confirm: {
    metadataTitle: 'Apstiprināt abonementu — RegPulss',
    titleSuccess: 'Abonements apstiprināts',
    titleAlready: 'Jau apstiprināts',
    titleError: 'Apstiprināšana neizdevās',
    invalidLink: 'Nederīga apstiprināšanas saite.',
    invalidOrExpired: 'Šī apstiprināšanas saite ir nederīga vai beidzies derīgums.',
    alreadyConfirmed: 'Jūsu abonements jau ir apstiprināts.',
    updateFailed: 'Radās problēma. Lūdzu, mēģiniet vēlāk.',
    successMessage:
      'Jūsu abonements ir apstiprināts! Tagad saņemsiet normatīvo aktu atjauninājumus.',
    backHome: 'Atpakaļ uz RegPulss',
  },
  apiSubscribe: {
    rateLimited:
      'Pārāk daudz mēģinājumu. Lūdzu, mēģiniet vēlāk.',
    emailRequired: 'E-pasts ir obligāts',
    invalidEmail: 'Lūdzu, ievadiet derīgu e-pasta adresi.',
    alreadySubscribed: 'Šis e-pasts jau ir abonēts.',
    subscribeFailed: 'Neizdevās abonēt. Lūdzu, mēģiniet vēlreiz.',
    successMessage:
      'Lūdzu, pārbaudiet e-pastu, lai apstiprinātu abonementu.',
    unexpectedError:
      'Abonēšanas laikā radās kļūda. Lūdzu, mēģiniet vēlreiz.',
  },
};
