/**
 * Footer Component
 *
 * Page footer with copyright and branding information
 *
 * @component
 * @example
 * return <Footer dict={dictionary} />
 *
 * @returns {ReactElement} Footer with site information
 */
import type { Dictionary } from '@/lib/i18n/types';

interface FooterProps {
  dict: Pick<Dictionary, 'footer'>;
}

export default function Footer({ dict }: FooterProps) {
  return (
    <footer className="footer" id="contact">
      <div className="container">
        <p className="footer-text">{dict.footer.text}</p>
      </div>
    </footer>
  );
}
