import { BackButton } from "@/components/ui/back-button";
import { Logo } from "@/components/ui/logo";

export function AuthHeader() {
  return (
    <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center">
      <BackButton href="/" />
      <Logo className="justify-self-center" />
    </header>
  );
}
