import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Monaco Editor Example',
  description: 'Next.js 15 with Monaco Editor and Sentry',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
