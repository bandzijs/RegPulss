import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components';

export interface NewsletterProps {
  subject: string;
  body: string;
}

export function Newsletter({ subject, body }: NewsletterProps) {
  return (
    <Html>
      <Head />
      <Preview>Regulatory updates for Latvia</Preview>
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
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '0 16px' }}>
          <Section
            style={{
              marginTop: '24px',
              backgroundColor: '#111827',
              borderRadius: '12px',
              padding: '24px 20px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Text
              style={{
                fontSize: '14px',
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '10px',
                textAlign: 'center',
                fontWeight: 700,
              }}
            >
              RegPulss
            </Text>

            <Text
              style={{
                fontSize: '12px',
                color: '#9ca3af',
                textAlign: 'center',
                marginBottom: '18px',
              }}
            >
              Regulatory newsletter
            </Text>

            <Text
              style={{
                fontSize: '22px',
                lineHeight: '1.35',
                color: '#ffffff',
                marginBottom: '14px',
                fontWeight: 700,
              }}
            >
              {subject}
            </Text>

            <Text
              style={{
                fontSize: '14px',
                lineHeight: '1.65',
                color: '#d1d5db',
                marginBottom: '18px',
                whiteSpace: 'pre-wrap',
              }}
            >
              {body}
            </Text>

            <Hr style={{ borderColor: 'rgba(229,231,235,0.14)', margin: '18px 0' }} />

            <Text
              style={{
                fontSize: '12px',
                color: '#9ca3af',
                textAlign: 'center',
                lineHeight: '1.6',
              }}
            >
              RegPulss — Regulatory updates for Latvia
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

Newsletter.PreviewProps = {
  subject: 'Weekly RegPulss Updates',
  body:
    'This week in Latvian regulatory updates...\n\n- New amendments to Labour Law\n- EU directive on data privacy updated',
};

export default Newsletter;
