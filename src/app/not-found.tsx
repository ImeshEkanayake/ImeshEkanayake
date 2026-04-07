import Link from "next/link";

export default function NotFound() {
  return (
    <main className="setup-page">
      <div className="setup-card">
        <p className="setup-eyebrow">Not found</p>
        <h1>That strand of the story does not exist yet.</h1>
        <p>Choose one of the published tabs to continue the journey.</p>
        <Link href="/">Return to the full story</Link>
      </div>
    </main>
  );
}
