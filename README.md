# RegPulss

AI-powered regulatory newsletter for Latvian legal professionals.

## Overview

RegPulss is a modern Next.js landing page for an AI-generated regulatory newsletter targeting lawyers, legal counsel, and compliance professionals in Latvia. The newsletter provides short, plain-language summaries of regulatory updates with direct links to official sources.

## Features

- **Modern Next.js 14 Architecture**: Server-side rendering with App Router
- **Clean, Professional Design**: Minimalist aesthetic inspired by modern legal-tech products
- **Secure Email Subscriptions**: Server-side API with rate limiting and validation
- **Newsletter Preview**: Visual demonstration of what subscribers will receive
- **Official Sources**: Monitors likumi.lv, Saeima, EUR-Lex, and other regulatory sources
- **Mobile Responsive**: Fully responsive design that works on all devices
- **Accessibility**: Semantic HTML with proper ARIA labels
- **Type-Safe**: Full TypeScript implementation with strict mode
- **Tested**: Comprehensive test suite with Vitest
- **Optimized Fonts**: Next.js font optimization for better performance

## Design Philosophy

The landing page follows the **5 Cs framework** for high conversion:

1. **Clarity**: Single goal (email sign-ups), clear value proposition
2. **Context**: Addresses specific pain points of legal professionals
3. **Creative**: Modern, restrained design appropriate for legal-tech
4. **Credibility**: Emphasizes official sources and citations
5. **Call to Action**: Single, prominent CTA for newsletter subscription

## Technology Stack

### Core
- **Next.js 14**: React framework with App Router and server-side rendering
- **React 18**: Modern React with hooks and components
- **TypeScript 5**: Full type safety with strict mode enabled
- **Supabase**: Backend database and authentication

### Styling
- **CSS3**: Custom styles with CSS variables
- **Next.js Font Optimization**: Optimized Inter and Libre Baskerville fonts

### Testing
- **Vitest**: Fast unit test runner
- **React Testing Library**: Component testing
- **Jest DOM**: DOM testing utilities

### Development Tools
- **ESLint**: Code linting with Next.js rules
- **Zod**: Runtime type validation for environment variables

### Analytics & Monitoring
- **Vercel Analytics**: Web analytics integration

## Project Structure

```
.
├── app/
│   ├── api/
│   │   └── subscribe/
│   │       └── route.ts          # Subscription API endpoint
│   ├── components/
│   │   ├── sections/             # Page sections
│   │   │   ├── Header.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── TrustSection.tsx
│   │   │   ├── BenefitsSection.tsx
│   │   │   └── Footer.tsx
│   │   ├── CookieConsent.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── SubscribeForm.tsx
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── lib/
│   ├── env.ts                    # Environment validation
│   ├── logger.ts                 # Structured logging
│   ├── rate-limit.ts             # Rate limiting utility
│   ├── supabaseClient.ts         # Supabase client
│   └── useSupabase.ts            # Supabase hooks
├── __tests__/                    # Test files
│   ├── api/
│   ├── components/
│   ├── lib/
│   └── validators/
├── .env.example                  # Environment variables template
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
└── vitest.config.ts              # Test configuration
```

## Local Development

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for database)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/RegPulss.git
   cd RegPulss
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env.local
   ```
   
   Required variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests in watch mode
- `npm run test:ui` - Open test UI
- `npm run test:coverage` - Generate test coverage report

## Deployment

### Recommended: Vercel (Optimized for Next.js)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Import your repository
   - Vercel auto-detects Next.js configuration

3. **Set Environment Variables**
   
   In Vercel dashboard, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Deploy**
   - Automatic deployments on every push to main
   - Preview deployments for pull requests

### Alternative: Netlify

1. Build command: `npm run build`
2. Publish directory: `.next`
3. Add environment variables in Netlify dashboard

### Self-Hosted

1. Build the application:
   ```bash
   npm run build
   ```

2. Start production server:
   ```bash
   npm start
   ```

3. Server runs on port 3000 by default

## Color Palette

- **Primary (CTA)**: `#2b2b2b` (Dark grey/black)
- **Accent**: `#DC2626` (Red)
- **Text Primary**: `#1a1a1a`
- **Text Secondary**: `#666666`
- **Background**: `#ffffff`
- **Border**: `#e5e5e5`

## Typography

- **Headlines**: Libre Baskerville (serif)
- **Body**: Inter (sans-serif)

## Security Features

- ✅ **Rate Limiting**: 5 requests per hour per IP on subscription endpoint
- ✅ **Security Headers**: XSS protection, frame options, content type options
- ✅ **Server-Side Validation**: All email validation happens on the server
- ✅ **Environment Validation**: Zod-based runtime validation of environment variables
- ✅ **Error Boundaries**: React error boundaries catch and display errors gracefully
- ✅ **Type Safety**: Full TypeScript with strict mode enabled

## Testing

The project includes comprehensive tests:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Open test UI
npm run test:ui
```

**Current Test Coverage**: ~40% baseline (15 passing tests)

Test files cover:
- Email validation
- API endpoint responses
- Error boundary behavior
- Authentication hooks

## Performance

- ✅ **Next.js Font Optimization**: Fonts self-hosted and optimized
- ✅ **Image Optimization**: AVIF and WebP support
- ✅ **Compression**: Automatic gzip compression
- ✅ **Code Splitting**: Automatic route-based code splitting

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Node.js 18+ required for development

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

© 2026 RegPulss. All rights reserved.

## Contact

For questions or feedback about the newsletter, please visit the landing page.
