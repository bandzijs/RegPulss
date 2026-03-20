import LanguageSwitcher from '@/app/components/language-switcher';
import type { Dictionary } from '@/lib/i18n/types';
import type { Locale } from '@/lib/i18n/types';

/**
 * Header Component
 *
 * Main navigation header with logo and menu links:
 * - RegPulss branding
 * - Navigation to About, Sources, and Contact sections
 * - Language switcher (EN / LV)
 *
 * @component
 * @example
 * return <Header locale="en" dict={dictionary} />
 *
 * Accessibility:
 * - Semantic HTML5 (header element)
 * - Proper link structure with section anchors
 *
 * @returns {ReactElement} Navigation header with logo and menu
 */
interface HeaderProps {
  locale: Locale;
  dict: Pick<Dictionary, 'nav' | 'language'>;
}

export default function Header({ locale, dict }: HeaderProps) {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="#DC2626" />
            </svg>
            <span className="logo-text">RegPulss</span>
          </div>
          <nav className="nav" aria-label={dict.nav.ariaLabel}>
            <a href="#about" className="nav-link">
              {dict.nav.about}
            </a>
            <a href="#sources" className="nav-link">
              {dict.nav.sources}
            </a>
            <a href="#contact" className="nav-link">
              {dict.nav.contact}
            </a>
            <LanguageSwitcher
              locale={locale}
              labels={{
                switcherAriaLabel: dict.language.switcherAriaLabel,
                english: dict.language.english,
                latvian: dict.language.latvian,
              }}
            />
          </nav>
        </div>
      </div>
    </header>
  );
}
