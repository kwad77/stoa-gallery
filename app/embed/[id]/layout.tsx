import "@/app/globals.css";

/**
 * Embed layout drops the site header / footer so iframe consumers get
 * just the replay. Tailwind globals still load for styling.
 */
export default function EmbedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg text-ink">
        <main className="p-4">{children}</main>
      </body>
    </html>
  );
}
