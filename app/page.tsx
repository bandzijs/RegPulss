import SubscribeForm from '@/app/components/SubscribeForm';
import CookieConsent from '@/app/components/CookieConsent';

export default function Home() {
  return (
    <>
      <CookieConsent />

      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="#DC2626" />
              </svg>
              <span className="logo-text">RegPulss</span>
            </div>
            <nav className="nav">
              <a href="#about" className="nav-link">About</a>
              <a href="#sources" className="nav-link">Sources</a>
              <a href="#contact" className="nav-link">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-left">
              <h1 className="hero-title">Stay ahead of regulatory changes in Latvia.</h1>
              <p className="hero-description">
                Regulatory updates with direct links to official sources. Delivered to your inbox.
              </p>

              <SubscribeForm />

              <p className="form-note">No spam, <span className="underline">unsubscribe</span> anytime.</p>
            </div>

            <div className="hero-right">
              <div className="mockup-container">
                <div className="newsletter-preview">
                  <div className="preview-header">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="#DC2626" />
                    </svg>
                    <span className="preview-title">Weekly Regulatory Update</span>
                  </div>
                  <div className="preview-date">January 6, 2026</div>
                  <div className="preview-items">
                    <div className="preview-item">
                      <div className="item-badge">New</div>
                      <div className="item-title">Data Protection Amendment</div>
                      <div className="item-source">→ likumi.lv</div>
                    </div>
                    <div className="preview-item">
                      <div className="item-badge">Updated</div>
                      <div className="item-title">Labor Law Changes</div>
                      <div className="item-source">→ Saeima</div>
                    </div>
                    <div className="preview-item">
                      <div className="item-badge">EU</div>
                      <div className="item-title">GDPR Enforcement Guidelines</div>
                      <div className="item-source">→ EUR-Lex</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="trust" id="sources">
        <div className="container">
          <p className="trust-label">Monitoring official sources</p>
          <div className="sources-list">
            <span className="source">likumi.lv</span>
            <span className="source">Saeima</span>
            <span className="source">EUR-Lex</span>
            <span className="source">Official regulators</span>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits" id="about">
        <div className="container">
          <h2 className="section-title">Built for professionals</h2>

          <div className="benefits-grid">
            <div className="benefit">
              <h3 className="benefit-title">Clear summaries</h3>
              <p className="benefit-text">Plain-language explanations of what changed, why it matters, and who it affects.</p>
            </div>
            <div className="benefit">
              <h3 className="benefit-title">Direct citations</h3>
              <p className="benefit-text">Every update includes links to official texts from likumi.lv, Saeima, and EUR-Lex.</p>
            </div>
            <div className="benefit">
              <h3 className="benefit-title">Save time</h3>
              <p className="benefit-text">Stop manually scanning multiple legal websites. Get updates delivered to your inbox.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" id="contact">
        <div className="container">
          <p className="footer-text">Built for professionals. Based on official regulatory sources.</p>
        </div>
      </footer>
    </>
  );
}
