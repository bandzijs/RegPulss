import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import type { Locale } from '@/lib/i18n/types';

const sans =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Helvetica, sans-serif";
const serif = "Georgia, 'Times New Roman', Times, serif";

export interface ConfirmationProps {
  email: string;
  confirmationUrl: string;
  /** Public page URL: /unsubscribe?token=… */
  unsubscribeUrl: string;
  locale?: Locale;
}

const content = {
  en: {
    subject: 'Confirm your subscription',
    title: 'Confirm your subscription',
    body: 'Thank you for subscribing. Please confirm your email address by clicking the button below.',
    button: 'Confirm Subscription',
    fallback: 'If the button does not work, copy and paste this link into your browser:',
    unsubscribe: "Don't want these emails?",
    unsubscribeLink: 'Unsubscribe',
  },
  lv: {
    subject: 'Apstipriniet savu abonementu',
    title: 'Apstipriniet savu abonementu',
    body: 'Paldies, ka abonējāt. Lūdzu, apstipriniet savu e-pasta adresi, noklikšķinot uz pogas zemāk.',
    button: 'Apstiprināt abonementu',
    fallback: 'Ja poga nedarbojas, kopējiet un ielīmējiet šo saiti savā pārlūkprogrammā:',
    unsubscribe: 'Nevēlaties šos e-pastus?',
    unsubscribeLink: 'Atrakstīties',
  },
} as const;

export function Confirmation({
  email,
  confirmationUrl,
  unsubscribeUrl,
  locale = 'en',
}: ConfirmationProps) {
  const t = content[locale];
  return (
    <Html>
      <Head />
      <Preview>{t.subject}</Preview>
      <Body
        style={{
          backgroundColor: '#ffffff',
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            maxWidth: '560px',
            margin: '0 auto',
            padding: '48px 24px 0 24px',
            backgroundColor: '#ffffff',
          }}
        >
          <Section style={{ textAlign: 'center', padding: '0 0 40px 0' }}>
            <Text
              style={{
                margin: 0,
                fontFamily: sans,
                fontSize: '18px',
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              <span style={{ color: '#DC2626' }}>{'\u26A1'}</span>
              <span style={{ color: '#1a1a1a' }}> RegPulss</span>
            </Text>
          </Section>

          <Section style={{ padding: '0 8px 56px 8px' }}>
            <Text
              style={{
                margin: '0 0 32px 0',
                fontFamily: serif,
                fontSize: '28px',
                fontWeight: 700,
                color: '#1a1a1a',
                textAlign: 'center',
                lineHeight: 1.25,
              }}
            >
              {t.title}
            </Text>
            <Text
              style={{
                margin: '0 0 18px 0',
                fontFamily: sans,
                fontSize: '15px',
                lineHeight: 1.7,
                color: '#1a1a1a',
                textAlign: 'center',
                maxWidth: '440px',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              {t.body}
            </Text>
            <Text
              style={{
                margin: '0 0 28px 0',
                fontFamily: sans,
                fontSize: '14px',
                lineHeight: 1.6,
                color: '#666666',
                textAlign: 'center',
              }}
            >
              {email}
            </Text>
            <Section style={{ textAlign: 'center', paddingBottom: '48px' }}>
              <Button
                href={String(confirmationUrl)}
                style={{
                  display: 'inline-block',
                  backgroundColor: '#1a1a1a',
                  color: '#ffffff',
                  padding: '16px 40px',
                  borderRadius: 0,
                  textDecoration: 'none',
                  fontFamily: sans,
                  fontWeight: 600,
                  fontSize: '14px',
                  letterSpacing: '0.02em',
                }}
              >
                {t.button}
              </Button>
            </Section>
            <Text
              style={{
                margin: 0,
                fontFamily: sans,
                fontSize: '13px',
                lineHeight: 1.6,
                color: '#666666',
                textAlign: 'center',
              }}
            >
              {t.fallback}
              <br />
              <Link
                href={String(confirmationUrl)}
                style={{ color: '#DC2626', textDecoration: 'underline' }}
              >
                {confirmationUrl}
              </Link>
            </Text>
            <Text
              style={{
                margin: '16px 0 0 0',
                fontFamily: sans,
                fontSize: '12px',
                lineHeight: 1.6,
                color: '#666666',
                textAlign: 'center',
              }}
            >
              {t.unsubscribe}{' '}
              <Link
                href={String(unsubscribeUrl)}
                style={{ color: '#DC2626', textDecoration: 'underline' }}
              >
                {t.unsubscribeLink}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default Confirmation;
