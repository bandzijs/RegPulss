import CookieConsent from '@/app/components/CookieConsent';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import ConfirmationToast from '@/app/components/ConfirmationToast';
import Header from '@/app/components/sections/Header';
import HeroSection from '@/app/components/sections/HeroSection';
import TrustSection from '@/app/components/sections/TrustSection';
import BenefitsSection from '@/app/components/sections/BenefitsSection';
import Footer from '@/app/components/sections/Footer';
import { Suspense } from 'react';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getLocale } from '@/lib/i18n/locale';

/**
 * Home Page Component
 *
 * Main landing page for RegPulss newsletter signup.
 * Displays sections for value proposition, social proof, benefits, and footer.
 *
 * @component
 * Structure:
 * - CookieConsent banner
 * - Header with navigation
 * - Hero section with signup form
 * - Trust section showing data sources
 * - Benefits section highlighting features
 * - Footer
 *
 * All content is wrapped with ErrorBoundary for production error handling.
 *
 * @returns {ReactElement} Complete landing page
 */
export default async function Home() {
  const locale = await getLocale();
  console.log('page locale:', locale);
  const dict = getDictionary(locale);

  return (
    <ErrorBoundary>
      <>
        <CookieConsent key={locale} content={dict.cookie} />
        <Suspense fallback={null}>
          <ConfirmationToast />
        </Suspense>
        <Header locale={locale} dict={{ nav: dict.nav, language: dict.language }} />
        <HeroSection locale={locale} dict={{ hero: dict.hero, subscribe: dict.subscribe }} />
        <TrustSection dict={{ trust: dict.trust }} />
        <BenefitsSection dict={{ benefits: dict.benefits }} />
        <Footer dict={{ footer: dict.footer }} />
      </>
    </ErrorBoundary>
  );
}
