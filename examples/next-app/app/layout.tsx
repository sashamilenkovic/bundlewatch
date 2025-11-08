export const metadata = {
  title: 'Bundle Watch + Next.js',
  description: 'Next.js example using Bundle Watch',
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
