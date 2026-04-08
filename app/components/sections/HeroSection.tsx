/**
 * HeroSection Component
 *
 * Displays the main hero section with:
 * - Value proposition headline
 * - Call-to-action email subscription form
 * - Newsletter preview mockup
 *
 * @component
 * @example
 * return <HeroSection dict={dictionary} />
 *
 * @returns {ReactElement} Hero section with form and mockup
 */
import SubscribeForm from '@/app/components/SubscribeForm';
import type { Dictionary } from '@/lib/i18n/types';

interface HeroSectionProps {
  dict: Pick<Dictionary, 'hero' | 'subscribe'>;
}

export default function HeroSection({ dict }: HeroSectionProps) {
  const { hero, subscribe } = dict;

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-grid">
          <div className="hero-left">
            <h1 className="hero-title">{hero.title}</h1>
            <p className="hero-description">{hero.description}</p>

            <SubscribeForm messages={subscribe} />

            <p className="form-note">
              {hero.formNoteBefore}
              <span className="underline">{hero.formNoteEmphasis}</span>
              {hero.formNoteAfter}
            </p>
          </div>

          <div className="hero-right">
            <div className="mockup-container">
              <div className="newsletter-preview">
                <div className="preview-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="#DC2626" />
                  </svg>
                  <span className="preview-title">{hero.previewTitle}</span>
                </div>
                <div className="preview-date">{hero.previewDate}</div>
                <div className="preview-items">
                  <div className="preview-item">
                    <div className="item-badge">{hero.badgeNew}</div>
                    <div className="item-title">{hero.item1Title}</div>
                    <div className="item-source">{hero.item1Source}</div>
                  </div>
                  <div className="preview-item">
                    <div className="item-badge">{hero.badgeUpdated}</div>
                    <div className="item-title">{hero.item2Title}</div>
                    <div className="item-source">{hero.item2Source}</div>
                  </div>
                  <div className="preview-item">
                    <div className="item-badge">{hero.badgeEu}</div>
                    <div className="item-title">{hero.item3Title}</div>
                    <div className="item-source">{hero.item3Source}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
