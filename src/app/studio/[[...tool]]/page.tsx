import { StudioApp } from "@/components/layout/studio-app";
import { isSanityConfigured } from "@/lib/sanity/env";

export const dynamic = "force-static";
export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  if (!isSanityConfigured()) {
    return (
      <main className="setup-page">
        <div className="setup-card">
          <p className="setup-eyebrow">Studio setup needed</p>
          <h1>Connect a Sanity project to open the embedded CMS.</h1>
          <p>
            Add `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` to your environment,
            then restart the app. A write token is optional until you want the intake flow to create drafts.
          </p>
        </div>
      </main>
    );
  }

  return <StudioApp />;
}
