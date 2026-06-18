import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-black/5 bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>ИП Емельянов Филипп Андреевич · г. Ялта</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/offer" className="hover:text-primary-dark">
            Оферта
          </Link>
          <Link href="/privacy" className="hover:text-primary-dark">
            Персональные данные
          </Link>
          <Link href="/cookies" className="hover:text-primary-dark">
            Cookie
          </Link>
        </nav>
      </div>
    </footer>
  );
}
