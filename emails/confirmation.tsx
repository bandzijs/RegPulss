import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Hr,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export type ConfirmationEmailProps = {
  confirmUrl: string;
  unsubscribeUrl: string;
};

export default function ConfirmationEmail({
  confirmUrl,
  unsubscribeUrl,
}: ConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Confirm your subscription</Preview>
      <Body
        style={{
          backgroundColor: '#0b0b0b',
          color: '#e5e7eb',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
          padding: '0',
          margin: '0',
        }}
      >
        <Container
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: '0 16px',
          }}
        >
          <Section
            style={{
              marginTop: '40px',
              backgroundColor: '#111827',
              borderRadius: '12px',
              padding: '28px 20px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Text
              style={{
                fontSize: '14px',
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '12px',
                textAlign: 'center',
              }}
            >
              RegPulss
            </Text>

            <Text
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#ffffff',
                textAlign: 'center',
                margin: '0 0 16px 0',
              }}
            >
              Confirm your subscription
            </Text>

            <Text
              style={{
                fontSize: '14px',
                lineHeight: '1.65',
                color: '#d1d5db',
                textAlign: 'center',
                margin: '0 0 22px 0',
              }}
            >
              Click the button below to confirm your email address and start
              receiving regulatory updates.
            </Text>

            <Section style={{ textAlign: 'center', marginBottom: '22px' }}>
              <Button
                href={confirmUrl}
                style={{
                  display: 'inline-block',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  padding: '14px 28px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                Confirm Subscription
              </Button>
            </Section>

            <Hr style={{ borderColor: 'rgba(229,231,235,0.14)', margin: '20px 0' }} />

            <Text
              style={{
                fontSize: '12px',
                color: '#9ca3af',
                textAlign: 'center',
                lineHeight: '1.6',
              }}
            >
              Don’t want these emails?{' '}
              <a
                href={unsubscribeUrl}
                style={{ color: '#9ca3af', textDecoration: 'underline' }}
              >
                Unsubscribe
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

