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

const sans =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Helvetica, sans-serif";
const serif = "Georgia, 'Times New Roman', Times, serif";

export type ConfirmationEmailProps = {
  confirmUrl: string;
  unsubscribeUrl: string;
};

function ConfirmationEmail({
  confirmUrl,
  unsubscribeUrl,
}: ConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Confirm your subscription</Preview>
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
              Confirm your subscription
            </Text>
            <Text
              style={{
                margin: '0 0 40px 0',
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
              Thank you for subscribing. Please confirm your email address by
              clicking the button below.
            </Text>
            <Section style={{ textAlign: 'center', paddingBottom: '48px' }}>
              <Button
                href={String(confirmUrl)}
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
                Confirm Subscription
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
              If the button does not work, copy and paste this link into your
              browser:
              <br />
              <Link
                href={String(confirmUrl)}
                style={{ color: '#DC2626', textDecoration: 'underline' }}
              >
                {confirmUrl}
              </Link>
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: '#f5f5f5',
              padding: '28px 32px',
              textAlign: 'center',
            }}
          >
            <Text
              style={{
                margin: 0,
                fontFamily: sans,
                fontSize: '12px',
                lineHeight: 1.65,
                color: '#737373',
              }}
            >
              {"Don't want these emails? "}
              <Link
                href={String(unsubscribeUrl)}
                style={{ color: '#737373', textDecoration: 'underline' }}
              >
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ConfirmationEmail;
export { ConfirmationEmail };
