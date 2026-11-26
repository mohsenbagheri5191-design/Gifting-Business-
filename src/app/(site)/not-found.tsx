import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-24 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="mt-4 text-5xl sm:text-6xl">This path leads nowhere — yet.</h1>
        <p className="mx-auto mt-4 max-w-md text-ink-soft">The page you&apos;re looking for has moved or never existed. Let&apos;s find you something lovely instead.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="btn btn-primary">
            Back home
          </Link>
          <Link href="/experiences" className="btn btn-outline">
            Browse experiences
          </Link>
        </div>
      </div>
    </div>
  );
}
