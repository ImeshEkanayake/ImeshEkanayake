"use client";

import { startTransition, useDeferredValue, useState } from "react";
import type { DraftCreationResult, IntakeCandidate, IntakeReviewBundle, IntakeSources } from "@/lib/ingest/types";
import styles from "./imports-workbench.module.css";

const initialSources: IntakeSources = {
  cvText: "",
  linkedInText: "",
  googleScholarText: "",
  manualNotes: "",
};

export function ImportsWorkbench() {
  const [sources, setSources] = useState<IntakeSources>(initialSources);
  const [review, setReview] = useState<IntakeReviewBundle | null>(null);
  const [draftResult, setDraftResult] = useState<DraftCreationResult | null>(null);
  const [search, setSearch] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const visibleCandidates = (review?.candidates ?? []).filter((candidate) => {
    if (!deferredSearch.trim()) {
      return true;
    }

    const query = deferredSearch.toLowerCase();
    return (
      candidate.title.toLowerCase().includes(query) ||
      candidate.summary.toLowerCase().includes(query) ||
      candidate.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  async function handleAnalyze(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/imports/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sources),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        throw new Error(payload.message || "Unable to analyse the intake payload.");
      }

      const payload = (await response.json()) as IntakeReviewBundle;

      startTransition(() => {
        setReview(payload);
        setDraftResult(null);
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to analyse intake data.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function updateCandidate(id: string, patch: Partial<IntakeCandidate>) {
    setReview((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        stats: {
          ...current.stats,
          approved: current.candidates.filter((candidate) =>
            candidate.id === id ? patch.approved ?? candidate.approved : candidate.approved,
          ).length,
        },
        candidates: current.candidates.map((candidate) =>
          candidate.id === id ? { ...candidate, ...patch } : candidate,
        ),
      };
    });
  }

  async function handleDraftCreation() {
    if (!review) {
      return;
    }

    setIsDrafting(true);
    setError(null);

    try {
      const response = await fetch("/api/imports/drafts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ candidates: review.candidates }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        throw new Error(payload.message || "Unable to create draft payloads.");
      }

      const payload = (await response.json()) as DraftCreationResult;

      startTransition(() => {
        setDraftResult(payload);
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create drafts.");
    } finally {
      setIsDrafting(false);
    }
  }

  const approvedCount =
    review?.candidates.filter((candidate) => candidate.approved && candidate.visibility === "public")
      .length ?? 0;

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>AI-assisted ingestion</p>
          <h1>Import, review, and turn raw source material into timeline drafts.</h1>
          <p>
            Paste your CV, LinkedIn export, Google Scholar data, and manual notes. The app extracts
            candidate milestones, classifies them into tabs, and prepares draft-ready Sanity payloads.
          </p>
        </div>
        <div className={styles.pipeline}>
          <span>1. Intake</span>
          <span>2. Extraction</span>
          <span>3. Normalisation</span>
          <span>4. Review</span>
          <span>5. Drafts</span>
        </div>
      </section>

      <form className={styles.form} onSubmit={handleAnalyze}>
        <label className={styles.field}>
          <span>CV or portfolio text</span>
          <textarea
            value={sources.cvText}
            onChange={(event) => setSources((current) => ({ ...current, cvText: event.target.value }))}
            placeholder="Paste plain text from your CV or personal notes."
          />
        </label>
        <label className={styles.field}>
          <span>LinkedIn export or summary</span>
          <textarea
            value={sources.linkedInText}
            onChange={(event) =>
              setSources((current) => ({ ...current, linkedInText: event.target.value }))
            }
            placeholder="Paste CSV rows or a structured summary."
          />
        </label>
        <label className={styles.field}>
          <span>Google Scholar data</span>
          <textarea
            value={sources.googleScholarText}
            onChange={(event) =>
              setSources((current) => ({ ...current, googleScholarText: event.target.value }))
            }
            placeholder="Paste JSON, citations, or raw publication text."
          />
        </label>
        <label className={styles.field}>
          <span>Manual notes and privacy guidance</span>
          <textarea
            value={sources.manualNotes}
            onChange={(event) =>
              setSources((current) => ({ ...current, manualNotes: event.target.value }))
            }
            placeholder="Add redactions, preferred tone, and milestone notes."
          />
        </label>

        <div className={styles.formActions}>
          <button type="submit" className={styles.primaryButton} disabled={isAnalyzing}>
            {isAnalyzing ? "Analysing..." : "Analyse sources"}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => {
              setSources(initialSources);
              setReview(null);
              setDraftResult(null);
            }}
          >
            Reset
          </button>
        </div>
      </form>

      {error ? <p className={styles.error}>{error}</p> : null}

      {review ? (
        <section className={styles.reviewSection}>
          <div className={styles.reviewHeader}>
            <div>
              <p className={styles.eyebrow}>Review sheet</p>
              <h2>{review.stats.total} candidate milestones extracted</h2>
            </div>
            <div className={styles.statGrid}>
              <span>{review.stats.sources.cvText} from CV</span>
              <span>{review.stats.sources.linkedInText} from LinkedIn</span>
              <span>{review.stats.sources.googleScholarText} from Scholar</span>
              <span>{review.stats.sources.manualNotes} from manual notes</span>
            </div>
          </div>

          {review.warnings.length ? (
            <div className={styles.warningList}>
              {review.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}

          <div className={styles.toolbar}>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search extracted milestones"
            />
            <button
              type="button"
              className={styles.primaryButton}
              disabled={approvedCount === 0 || isDrafting}
              onClick={handleDraftCreation}
            >
              {isDrafting ? "Preparing drafts..." : `Create drafts (${approvedCount})`}
            </button>
          </div>

          <div className={styles.candidateList}>
            {visibleCandidates.map((candidate) => (
              <article key={candidate.id} className={styles.candidateCard}>
                <div className={styles.candidateHeader}>
                  <div>
                    <p className={styles.candidateSource}>{candidate.source}</p>
                    <h3>{candidate.title}</h3>
                  </div>
                  <span className={styles.candidateDate}>{candidate.displayDate}</span>
                </div>
                <p>{candidate.summary}</p>
                <div className={styles.tagRow}>
                  {candidate.tabs.map((tab) => (
                    <span key={tab}>{tab}</span>
                  ))}
                </div>
                <div className={styles.controls}>
                  <label>
                    <input
                      type="checkbox"
                      checked={candidate.approved}
                      onChange={(event) =>
                        updateCandidate(candidate.id, { approved: event.target.checked })
                      }
                    />
                    Approve for draft creation
                  </label>
                  <label>
                    Visibility
                    <select
                      value={candidate.visibility}
                      onChange={(event) =>
                        updateCandidate(candidate.id, {
                          visibility: event.target.value as IntakeCandidate["visibility"],
                        })
                      }
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </label>
                </div>
              </article>
            ))}
          </div>

          {draftResult ? (
            <div className={styles.resultCard}>
              <p className={styles.eyebrow}>{draftResult.mode === "sanity" ? "Sanity drafts" : "Preview mode"}</p>
              <h3>{draftResult.documentsCreated} documents prepared</h3>
              <p>{draftResult.message}</p>
              <pre>{JSON.stringify(draftResult.documents, null, 2)}</pre>
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
