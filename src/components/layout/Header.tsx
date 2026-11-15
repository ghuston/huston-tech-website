import { Container } from "@/components/hl/Container";
import { MarkSprite } from "@/components/hl/Marks";
import { HeaderNav } from "./HeaderNav";
import { Logo } from "./Logo";

/** Sticky site header (docs/STYLE-GUIDE.md §7.1): logo on the left, the six Rev 7.1 links on the right. */
export function Header() {
  return (
    <header className="hl hl-header sticky top-0 z-40">
      <MarkSprite />
      <Container className="grid grid-cols-[auto_1fr] items-center">
        <div className="flex h-[60px] items-center md:h-[72px]">
          <Logo />
        </div>
        <HeaderNav />
      </Container>
    </header>
  );
}
