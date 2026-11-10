import { Container } from "@/components/ui/Container";
import { bookCallHref } from "@/components/ui/BookCallButton";
import { HeaderNav } from "./HeaderNav";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <Container className="grid grid-cols-[auto_1fr] items-center gap-x-4 py-2.5 lg:grid-cols-[auto_1fr_auto]">
        <Logo />
        <HeaderNav bookHref={bookCallHref()} />
      </Container>
    </header>
  );
}
