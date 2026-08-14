"use client";

import { useMemo, useState } from "react";

type Creation = {
  id: string;
  name: string;
  category: string;
  description: string;
  installedAt: string;
  version: string;
  status: "Ready" | "Update" | "Local";
  color: string;
};

const categories = [
  "Media Tools",
  "Developer Tools",
  "Productivity",
  "Device Utilities",
  "AI Assistants",
  "Experiments",
  "Favorites",
  "Uncategorized",
  "Custom Category 1",
  "Custom Category 2",
];

const creations: Creation[] = [
  {
    id: "clip-forge",
    name: "Clip Forge",
    category: "Media Tools",
    description: "Trim, convert, and queue quick media exports.",
    installedAt: "2026-08-13",
    version: "1.4.0",
    status: "Ready",
    color: "cyan",
  },
  {
    id: "root-broker-plan",
    name: "Root Broker Plan",
    category: "Developer Tools",
    description: "Read-only planning surface for gated host actions.",
    installedAt: "2026-08-14",
    version: "0.2.1",
    status: "Local",
    color: "green",
  },
  {
    id: "prompt-vault",
    name: "Prompt Vault",
    category: "AI Assistants",
    description: "Store reusable Rabbit prompts and launch notes.",
    installedAt: "2026-08-10",
    version: "2.0.3",
    status: "Ready",
    color: "violet",
  },
  {
    id: "qr-runner",
    name: "QR Runner",
    category: "Device Utilities",
    description: "Open hosted links and verify scan-ready payloads.",
    installedAt: "2026-08-12",
    version: "1.1.2",
    status: "Update",
    color: "amber",
  },
  {
    id: "notes-brief",
    name: "Notes Brief",
    category: "Productivity",
    description: "Condense project notes into a reachable action list.",
    installedAt: "2026-08-08",
    version: "1.0.5",
    status: "Ready",
    color: "rose",
  },
  {
    id: "sandbox-lab",
    name: "Sandbox Lab",
    category: "Experiments",
    description: "Try small offline creation ideas before promoting.",
    installedAt: "2026-08-05",
    version: "0.9.8",
    status: "Local",
    color: "blue",
  },
];

type SortMode = "category" | "newest" | "oldest" | "name";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export default function Home() {
  const [view, setView] = useState<"folders" | "list">("folders");
  const [sortMode, setSortMode] = useState<SortMode>("category");
  const [selectedCategory, setSelectedCategory] = useState("Media Tools");
  const [query, setQuery] = useState("");
  const [removing, setRemoving] = useState<Creation | null>(null);
  const [editTarget, setEditTarget] = useState<Creation | null>(null);
  const [publishUrl, setPublishUrl] = useState(
    "https://beaudown.github.io/rabbit-custom-creations-ui/",
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const visible = creations.filter((creation) => {
      return (
        creation.name.toLowerCase().includes(normalized) ||
        creation.category.toLowerCase().includes(normalized) ||
        creation.description.toLowerCase().includes(normalized)
      );
    });

    return [...visible].sort((a, b) => {
      if (sortMode === "newest") {
        return b.installedAt.localeCompare(a.installedAt);
      }
      if (sortMode === "oldest") {
        return a.installedAt.localeCompare(b.installedAt);
      }
      if (sortMode === "name") {
        return a.name.localeCompare(b.name);
      }
      return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
    });
  }, [query, sortMode]);

  const folders = categories.map((category) => ({
    name: category,
    count: creations.filter((creation) => creation.category === category).length,
  }));

  const selectedCreations = filtered.filter(
    (creation) => creation.category === selectedCategory || view === "list",
  );

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=14&data=${encodeURIComponent(
    publishUrl,
  )}`;

  return (
    <main className="shell">
      <section className="device">
        <header className="topbar" aria-label="Creation manager controls">
          <div>
            <p className="eyebrow">Rabbit R1</p>
            <h1>Creations</h1>
          </div>
          <button className="iconButton" aria-label="Open settings">
            SET
          </button>
        </header>

        <div className="searchRow">
          <label className="search">
            <span>Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find creation"
            />
          </label>
          <button className="addButton">Add</button>
        </div>

        <div className="segmented" aria-label="View mode">
          <button
            className={view === "folders" ? "active" : ""}
            onClick={() => setView("folders")}
          >
            Folders
          </button>
          <button
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
          >
            All
          </button>
        </div>

        <label className="sortControl">
          <span>Sort</span>
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
          >
            <option value="category">Category folders</option>
            <option value="newest">Date installed: newest</option>
            <option value="oldest">Date installed: oldest</option>
            <option value="name">Name A-Z</option>
          </select>
        </label>

        {view === "folders" ? (
          <section className="folderGrid" aria-label="Creation folders">
            {folders.map((folder) => (
              <button
                key={folder.name}
                className={`folderCard ${
                  selectedCategory === folder.name ? "selected" : ""
                }`}
                onClick={() => setSelectedCategory(folder.name)}
              >
                <span className="folderTab" />
                <span className="folderTitle">{folder.name}</span>
                <span className="folderMeta">{folder.count} installed</span>
              </button>
            ))}
          </section>
        ) : null}

        <section className="contentHeader">
          <div>
            <p className="eyebrow">Current</p>
            <h2>{view === "folders" ? selectedCategory : "All Creations"}</h2>
          </div>
          <span>{selectedCreations.length}</span>
        </section>

        <section className="creationList" aria-label="Installed creations">
          {selectedCreations.length ? (
            selectedCreations.map((creation) => (
              <article className="creationCard" key={creation.id}>
                <div className={`mark ${creation.color}`}>
                  {creation.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="creationText">
                  <div className="creationTitle">
                    <h3>{creation.name}</h3>
                    <span>{creation.status}</span>
                  </div>
                  <p>{creation.description}</p>
                  <div className="metaLine">
                    <span>{creation.category}</span>
                    <span>v{creation.version}</span>
                    <span>{formatDate(creation.installedAt)}</span>
                  </div>
                </div>
                <div className="actions">
                  <button onClick={() => setEditTarget(creation)}>Move</button>
                  <button
                    className="danger"
                    onClick={() => setRemoving(creation)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="emptyState">
              <h3>No creations here</h3>
              <p>Add one or move an installed creation into this folder.</p>
            </div>
          )}
        </section>

        <section className="publishPanel" aria-label="GitHub Pages QR">
          <div>
            <p className="eyebrow">GitHub Pages</p>
            <h2>Scan to open</h2>
            <input
              value={publishUrl}
              onChange={(event) => setPublishUrl(event.target.value)}
              aria-label="Published GitHub Pages URL"
            />
          </div>
          <img src={qrUrl} alt="QR code for the hosted creations manager" />
        </section>
      </section>

      {removing ? (
        <div className="modalScrim" role="dialog" aria-modal="true">
          <div className="modal">
            <p className="eyebrow">Confirm uninstall</p>
            <h2>Remove {removing.name}?</h2>
            <p>
              This should uninstall the custom creation only after the device
              confirms the action. Keep this step explicit.
            </p>
            <div className="modalActions">
              <button onClick={() => setRemoving(null)}>Cancel</button>
              <button className="danger solid" onClick={() => setRemoving(null)}>
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editTarget ? (
        <div className="modalScrim" role="dialog" aria-modal="true">
          <div className="modal">
            <p className="eyebrow">Categorize</p>
            <h2>Move {editTarget.name}</h2>
            <div className="categoryChoices">
              {categories.slice(0, 8).map((category) => (
                <button key={category} onClick={() => setEditTarget(null)}>
                  {category}
                </button>
              ))}
            </div>
            <div className="modalActions">
              <button onClick={() => setEditTarget(null)}>Done</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
