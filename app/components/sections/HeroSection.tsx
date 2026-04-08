/**
 * HeroSection Component
 *
 * Displays the main hero section with:
 * - Value proposition headline
 * - Call-to-action email subscription form
 * - Likumi.lv live stats widget
 *
 * @component
 * @example
 * return <HeroSection dict={dictionary} />
 *
 * @returns {ReactElement} Hero section with form and mockup
 */
import LikumiStatsWidget from '@/app/components/LikumiStatsWidget';
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
              <LikumiStatsWidget />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
