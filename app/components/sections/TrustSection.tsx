/**
 * TrustSection Component
 *
 * Displays the list of official sources being monitored:
 * - likumi.lv (Latvian legal information system)
 * - Saeima (Latvian Parliament)
 * - EUR-Lex (EU legal database)
 * - Official regulators
 *
 * @component
 * @example
 * return <TrustSection dict={dictionary} />
 *
 * @returns {ReactElement} Trust section with source list
 */
import type { Dictionary } from '@/lib/i18n/types';

interface TrustSectionProps {
  dict: Pick<Dictionary, 'trust'>;
}

export default function TrustSection({ dict }: TrustSectionProps) {
  const { trust } = dict;

  return (
    <section className="trust" id="sources">
      <div className="container">
        <p className="trust-label">{trust.label}</p>
        <div className="sources-list">
          <span className="source">{trust.sourceLikumi}</span>
          <span className="source">{trust.sourceSaeima}</span>
          <span className="source">{trust.sourceEurLex}</span>
          <span className="source">{trust.sourceRegulators}</span>
        </div>
      </div>
    </section>
  );
}
