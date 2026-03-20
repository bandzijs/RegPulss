/**
 * BenefitsSection Component
 *
 * Highlights the key benefits for legal professionals:
 * - Clear, plain-language summaries
 * - Direct citations to official sources
 * - Time-saving delivery to inbox
 *
 * @component
 * @example
 * return <BenefitsSection dict={dictionary} />
 *
 * @returns {ReactElement} Benefits grid with feature cards
 */
import type { Dictionary } from '@/lib/i18n/types';

interface BenefitsSectionProps {
  dict: Pick<Dictionary, 'benefits'>;
}

export default function BenefitsSection({ dict }: BenefitsSectionProps) {
  const { benefits } = dict;

  return (
    <section className="benefits" id="about">
      <div className="container">
        <h2 className="section-title">{benefits.sectionTitle}</h2>

        <div className="benefits-grid">
          <div className="benefit">
            <h3 className="benefit-title">{benefits.card1Title}</h3>
            <p className="benefit-text">{benefits.card1Text}</p>
          </div>
          <div className="benefit">
            <h3 className="benefit-title">{benefits.card2Title}</h3>
            <p className="benefit-text">{benefits.card2Text}</p>
          </div>
          <div className="benefit">
            <h3 className="benefit-title">{benefits.card3Title}</h3>
            <p className="benefit-text">{benefits.card3Text}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
