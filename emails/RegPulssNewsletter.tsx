import {
    Body,
    Container,
    Head,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Text,
    Row,
    Column,
  } from '@react-email/components';
  import * as React from 'react';
  
  interface RegPulssNewsletterProps {
    contentHtml: string;
    previewText?: string;
    date?: string;
    unsubscribeUrl?: string;
  }
  
  export default function RegPulssNewsletter({
    contentHtml,
    previewText = 'Jaunākie normatīvo aktu atjauninājumi — RegPulss',
    date,
    unsubscribeUrl = 'https://regpulss.lv/unsubscribe',
  }: RegPulssNewsletterProps) {
    const today =
      date ??
      new Date().toLocaleDateString('lv-LV', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
  
    return (
      <Html lang="lv">
        <Head />
        <Preview>{previewText}</Preview>
        <Body style={body}>
          <Container style={container}>
  
            {/* Header */}
            <Section style={header}>
              <Text style={logoText}>⚡ RegPulss</Text>
              <Text style={tagline}>Iknedēļas normatīvo aktu kopsavilkums</Text>
              <Text style={dateStyle}>{today}</Text>
            </Section>
  
            {/* Intro */}
            <Section style={introSection}>
              <Text style={introText}>
                Šajā izdevumā — svarīgākie grozījumi un jaunie normatīvie akti,
                kas ietekmē Latvijas uzņēmumus un juridisko nozari.
              </Text>
            </Section>
  
            <Hr style={divider} />
  
            {/* Bot content */}
            <Section style={contentSection}>
              <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
            </Section>
  
            <Hr style={divider} />
  
            {/* Source CTA */}
            <Section style={ctaSection}>
              <Text style={ctaText}>
                Lasiet pilnus dokumentus{' '}
                <Link href="https://likumi.lv" style={ctaLink}>
                  likumi.lv
                </Link>
                {' '}un sekojiet jaunumiem{' '}
                <Link href="https://regpulss.lv" style={ctaLink}>
                  regpulss.lv
                </Link>
              </Text>
            </Section>
  
            <Hr style={divider} />
  
            {/* Footer */}
            <Section style={footer}>
              <Row>
                <Column style={{ textAlign: 'center' }}>
                  <Text style={footerLogo}>⚡ RegPulss</Text>
                  <Text style={footerLinks}>
                    <Link href="https://regpulss.lv" style={footerLink}>
                      regpulss.lv
                    </Link>
                    {' · '}
                    <Link href={unsubscribeUrl} style={footerLink}>
                      Atrakstīties
                    </Link>
                    {' · '}
                    <Link href="https://regpulss.lv/privacy" style={footerLink}>
                      Privātuma politika
                    </Link>
                  </Text>
                  <Text style={footerAddress}>
                    © {new Date().getFullYear()} RegPulss · Latvija
                  </Text>
                  <Text style={footerAddress}>
                    Jūs saņemat šo vēstuli, jo esat abonējis RegPulss
                    juridiskos jaunumus.
                  </Text>
                </Column>
              </Row>
            </Section>
  
          </Container>
        </Body>
      </Html>
    );
  }
  
  /* ─── Styles ─────────────────────────────────────────── */
  
  const body: React.CSSProperties = {
    backgroundColor: '#f5f5f0',
    fontFamily: 'Georgia, Arial, Helvetica, sans-serif',
    margin: '0',
    padding: '24px 0 40px',
  };
  
  const container: React.CSSProperties = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    maxWidth: '600px',
  };
  
  const header: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderBottom: '3px solid #b91c1c',
    padding: '32px 32px 24px',
    textAlign: 'center',
  };
  
  const logoText: React.CSSProperties = {
    color: '#1a1a1a',
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0',
    padding: '0',
    lineHeight: '1',
    letterSpacing: '-0.3px',
  };
  
  const tagline: React.CSSProperties = {
    color: '#555555',
    fontSize: '13px',
    margin: '8px 0 0',
    padding: '0',
  };
  
  const dateStyle: React.CSSProperties = {
    color: '#aaaaaa',
    fontSize: '12px',
    margin: '6px 0 0',
    padding: '0',
  };
  
  const introSection: React.CSSProperties = {
    backgroundColor: '#fafaf8',
    padding: '14px 32px',
    borderBottom: '1px solid #ebebeb',
  };
  
  const introText: React.CSSProperties = {
    color: '#7a7a72',
    fontSize: '13px',
    lineHeight: '1.6',
    margin: '0',
    fontStyle: 'italic',
  };
  
  const divider: React.CSSProperties = {
    borderColor: '#ebebeb',
    borderWidth: '1px',
    margin: '0',
  };
  
  const contentSection: React.CSSProperties = {
    padding: '28px 32px',
    fontSize: '15px',
    lineHeight: '1.7',
    color: '#2d2d2d',
  };
  
  const ctaSection: React.CSSProperties = {
    backgroundColor: '#fafaf8',
    padding: '14px 32px',
    textAlign: 'center',
  };
  
  const ctaText: React.CSSProperties = {
    color: '#7a7a72',
    fontSize: '13px',
    margin: '0',
  };
  
  const ctaLink: React.CSSProperties = {
    color: '#b91c1c',
    textDecoration: 'none',
    fontWeight: '500',
  };
  
  const footer: React.CSSProperties = {
    backgroundColor: '#2d2d2d',
    padding: '24px 32px',
    textAlign: 'center',
  };
  
  const footerLogo: React.CSSProperties = {
    color: '#e5e5e5',
    fontSize: '15px',
    fontWeight: 'bold',
    margin: '0 0 8px',
  };
  
  const footerLinks: React.CSSProperties = {
    color: '#6b6b6b',
    fontSize: '12px',
    margin: '0 0 8px',
  };
  
  const footerLink: React.CSSProperties = {
    color: '#8a8a8a',
    textDecoration: 'none',
  };
  
  const footerAddress: React.CSSProperties = {
    color: '#555555',
    fontSize: '11px',
    margin: '2px 0 0',
    lineHeight: '1.5',
  };