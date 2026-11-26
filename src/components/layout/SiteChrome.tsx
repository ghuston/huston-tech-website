import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Notice } from "./Notice";

/**
 * The header, `main#main` and footer around every site page. Used by `app/(site)/layout.tsx` and the 404. Pages outside
 * the `(site)` group (the NFC card at /card) render their own `main#main` without the site navigation.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <Notice />
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Footer />
    </>
  );
}
