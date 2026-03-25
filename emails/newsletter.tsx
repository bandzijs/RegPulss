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
  Link,
} from '@react-email/components';

export type NewsletterItem = {
  title: string;
  summary: string;
  sourceUrl: string;
};

export type NewsletterEmailProps = {
  issueNumber: number;
  date: string;
  intro: string;
  items: NewsletterItem[];
  unsubscribeUrl: string;
};

export default function NewsletterEmail({
  issueNumber,
  date,
  intro,
  items,
  unsubscribeUrl,
}: NewsletterEmailProps) {
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
              Issue #{issueNumber} • {date}
            </Text>

            <Text
              style={{
                fontSize: '14px',
                lineHeight: '1.65',
                color: '#d1d5db',
                marginBottom: '18px',
              }}
            >
              {intro}
            </Text>

            <Hr style={{ borderColor: 'rgba(229,231,235,0.14)', margin: '18px 0' }} />

            {items.map((item, idx) => (
              <Section
                key={`${item.title}-${idx}`}
                style={{
                  padding: '14px 0',
                  borderBottom:
                    idx === items.length - 1
                      ? 'none'
                      : '1px solid rgba(229,231,235,0.08)',
                }}
              >
                <Text
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#ffffff',
                    marginBottom: '6px',
                  }}
                >
                  {item.title}
                </Text>

                <Text
                  style={{
                    fontSize: '13px',
                    lineHeight: '1.6',
                    color: '#d1d5db',
                    marginBottom: '8px',
                  }}
                >
                  {item.summary}
                </Text>

                <Text style={{ fontSize: '13px', margin: 0 }}>
                  <Link
                    href={item.sourceUrl}
                    style={{
                      color: '#93c5fd',
                      textDecoration: 'underline',
                    }}
                  >
                    Read source
                  </Link>
                </Text>
              </Section>
            ))}

            <Hr style={{ borderColor: 'rgba(229,231,235,0.14)', margin: '18px 0' }} />

            <Text
              style={{
                fontSize: '12px',
                color: '#9ca3af',
                textAlign: 'center',
                lineHeight: '1.6',
              }}
            >
              <a
                href={unsubscribeUrl}
                style={{ color: '#9ca3af', textDecoration: 'underline' }}
              >
                Unsubscribe
              </a>{' '}
              • RegPulss — Regulatory updates for Latvia
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

