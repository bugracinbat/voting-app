import { useState, useEffect } from "react";
import "./App.css";

interface Option {
  id: number;
  label: string;
  votes: number;
}

interface Issue {
  id: number;
  title: string;
  description: string;
  options: Option[];
}

const initialIssues: Issue[] = [
  {
    id: 1,
    title: "Should we adopt a 4-day workweek?",
    description:
      "Vote on whether to move to a 4-day workweek for all employees.",
    options: [
      { id: 1, label: "Yes", votes: 0 },
      { id: 2, label: "No", votes: 0 },
      { id: 3, label: "Undecided", votes: 0 },
    ],
  },
  {
    id: 2,
    title: "Preferred Frontend Framework",
    description: "Which frontend framework should we use for our next project?",
    options: [
      { id: 1, label: "React", votes: 0 },
      { id: 2, label: "Vue", votes: 0 },
      { id: 3, label: "Svelte", votes: 0 },
    ],
  },
];

const STORAGE_KEY = "voting-app-state-v1";

function App() {
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [selectedIssueId, setSelectedIssueId] = useState<number>(issues[0].id);
  const [voted, setVoted] = useState<{
    [issueId: number]: { user: string; optionId: number };
  }>({});
  const [showAddIssue, setShowAddIssue] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Add Issue State
  const [newIssue, setNewIssue] = useState({
    title: "",
    description: "",
    options: ["", ""],
  });
  const [addError, setAddError] = useState("");

  // Comments State
  const [comments, setComments] = useState<{
    [issueId: number]: { user: string; text: string; date: string }[];
  }>({});
  const [commentInput, setCommentInput] = useState("");
  const [commentUser, setCommentUser] = useState("");

  // Username State
  const [username, setUsername] = useState<string>("");
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);

  const selectedIssue = issues.find((issue) => issue.id === selectedIssueId)!;

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.issues && parsed.voted && parsed.theme) {
          setIssues(parsed.issues);
          setVoted(parsed.voted);
          setTheme(parsed.theme);
        }
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ issues, voted, theme }));
  }, [issues, voted, theme]);

  // Load comments from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("voting-app-comments-v1");
    if (saved) {
      try {
        setComments(JSON.parse(saved));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  // Save comments to localStorage on changes
  useEffect(() => {
    localStorage.setItem("voting-app-comments-v1", JSON.stringify(comments));
  }, [comments]);

  // Load username from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("voting-app-username-v1");
    if (saved) setUsername(saved);
    else setShowUsernamePrompt(true);
  }, []);

  // Save username to localStorage
  useEffect(() => {
    if (username) localStorage.setItem("voting-app-username-v1", username);
  }, [username]);

  const handleVote = (optionId: number) => {
    if (!username) {
      setShowUsernamePrompt(true);
      return;
    }
    if (hasVoted(selectedIssueId)) return;
    setIssues((prevIssues) =>
      prevIssues.map((issue) =>
        issue.id === selectedIssueId
          ? {
              ...issue,
              options: issue.options.map((opt) =>
                opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
              ),
            }
          : issue
      )
    );
    setVoted((prev) => ({
      ...prev,
      [selectedIssueId]: { user: username, optionId },
    }));
  };

  // Username prompt handler
  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) setShowUsernamePrompt(false);
  };

  // Check if user has voted on the issue
  const hasVoted = (issueId: number) => {
    return voted[issueId] && voted[issueId].user === username;
  };

  // Add Issue Handler
  const handleAddIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newIssue.title.trim() ||
      !newIssue.description.trim() ||
      newIssue.options.some((opt) => !opt.trim())
    ) {
      setAddError("All fields and options are required.");
      return;
    }
    const nextId = Math.max(...issues.map((i) => i.id)) + 1;
    setIssues([
      ...issues,
      {
        id: nextId,
        title: newIssue.title,
        description: newIssue.description,
        options: newIssue.options.map((label, idx) => ({
          id: idx + 1,
          label,
          votes: 0,
        })),
      },
    ]);
    setShowAddIssue(false);
    setNewIssue({ title: "", description: "", options: ["", ""] });
    setAddError("");
    setSelectedIssueId(nextId);
  };

  // Reset Votes Handler (admin only)
  const handleResetVotes = () => {
    setIssues(
      issues.map((issue) => ({
        ...issue,
        options: issue.options.map((opt) => ({ ...opt, votes: 0 })),
      }))
    );
    setVoted({});
  };

  // Theme toggle
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // Delete Issue Handler
  const handleDeleteIssue = (id: number) => {
    if (issues.length === 1) return; // Prevent deleting last issue
    const filtered = issues.filter((issue) => issue.id !== id);
    setIssues(filtered);
    if (selectedIssueId === id) {
      setSelectedIssueId(filtered[0].id);
    }
    // Remove vote for deleted issue
    setVoted((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  // Add Comment Handler
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentUser.trim() || !commentInput.trim()) return;
    setComments((prev) => {
      const prevComments = prev[selectedIssueId] || [];
      return {
        ...prev,
        [selectedIssueId]: [
          ...prevComments,
          {
            user: commentUser.trim(),
            text: commentInput.trim(),
            date: new Date().toISOString(),
          },
        ],
      };
    });
    setCommentInput("");
  };

  // Show spinner if issues are loading (simulate async for demo)
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 400); // simulate load
    return () => clearTimeout(t);
  }, []);

  // Track active section for nav highlight
  const [activeSection, setActiveSection] = useState("issues");
  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY < 300) setActiveSection("issues");
      else if (scrollY < 900) setActiveSection("results");
      else setActiveSection("about");
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className={`vercel-theme${theme === "light" ? " light" : ""}`}>
      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        username={username}
        setShowAddIssue={setShowAddIssue}
        activeSection={activeSection}
        handleResetVotes={handleResetVotes}
      />
      <header className="header">
        <h1>Public Voting</h1>
        <nav className="issue-nav" aria-label="Select issue">
          {issues.map((issue) => (
            <span key={issue.id} className="issue-tab-wrap">
              <button
                className={`issue-tab${
                  selectedIssueId === issue.id ? " active" : ""
                }`}
                onClick={() => setSelectedIssueId(issue.id)}
                aria-current={selectedIssueId === issue.id}
              >
                {issue.title}
              </button>
              <button
                className="delete-issue-btn"
                onClick={() => handleDeleteIssue(issue.id)}
                aria-label={`Delete issue: ${issue.title}`}
                disabled={issues.length === 1}
                title={
                  issues.length === 1
                    ? "At least one issue required"
                    : "Delete issue"
                }
              >
                🗑️
              </button>
            </span>
          ))}
        </nav>
        <div className="header-actions">
          <button className="reset-btn" onClick={handleResetVotes}>
            Reset Votes
          </button>
        </div>
      </header>
      {loading ? (
        <div className="spinner" aria-label="Loading" />
      ) : issues.length === 0 ? (
        <div className="empty-issues">
          No issues available. Add a new issue to get started.
        </div>
      ) : (
        <section
          className="issue-section"
          tabIndex={-1}
          aria-label={selectedIssue?.title}
        >
          <h2>{selectedIssue.title}</h2>
          <p className="issue-desc">{selectedIssue.description}</p>
          <form aria-label="Voting options" className="voting-form">
            <fieldset disabled={hasVoted(selectedIssueId)}>
              <legend>Choose your option:</legend>
              {selectedIssue.options.map((option) => (
                <div key={option.id} className="option-row">
                  <button
                    type="button"
                    onClick={() => handleVote(option.id)}
                    aria-pressed={
                      voted[selectedIssueId]?.optionId === option.id
                    }
                    aria-label={`Vote for ${option.label}`}
                    className="vote-btn"
                    disabled={hasVoted(selectedIssueId)}
                  >
                    {option.label}
                  </button>
                  <span aria-live="polite" className="vote-count">
                    {option.votes} vote{option.votes !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </fieldset>
          </form>
          {/* Results Bar Chart */}
          <ResultsBarChart options={selectedIssue.options} />
          {/* Total Votes */}
          <div className="total-votes" aria-live="polite">
            <span style={{ fontWeight: 600 }}>Total votes:</span>{" "}
            {selectedIssue.options.reduce((sum, o) => sum + o.votes, 0)}
          </div>
          {hasVoted(selectedIssueId) && (
            <div className="thank-you" role="status" aria-live="polite">
              <p>Thank you for voting!</p>
            </div>
          )}
          {/* Comments Section */}
          <div className="comments-section">
            <h3 tabIndex={0}>Comments</h3>
            <form className="comment-form" onSubmit={handleAddComment}>
              <input
                type="text"
                className="comment-user"
                placeholder="Your name"
                value={commentUser}
                onChange={(e) => setCommentUser(e.target.value)}
                required
                maxLength={32}
              />
              <textarea
                className="comment-input"
                placeholder="Add a comment..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                required
                maxLength={240}
              />
              <button type="submit" className="submit-comment-btn">
                Comment
              </button>
            </form>
            <ul className="comments-list">
              {(comments[selectedIssueId] || []).length === 0 && (
                <li className="no-comments">No comments yet.</li>
              )}
              {(comments[selectedIssueId] || []).map((c, i) => (
                <li key={i} className="comment-item">
                  <span className="comment-user-label">{c.user}</span>
                  <span className="comment-date">
                    {new Date(c.date).toLocaleString()}
                  </span>
                  <div className="comment-text">{c.text}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      {/* Add Issue Modal */}
      {showAddIssue && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Add new issue"
        >
          <form className="modal" onSubmit={handleAddIssue}>
            <h3>Add New Issue</h3>
            <label>
              Title
              <input
                type="text"
                value={newIssue.title}
                onChange={(e) =>
                  setNewIssue({ ...newIssue, title: e.target.value })
                }
                required
              />
            </label>
            <label>
              Description
              <textarea
                value={newIssue.description}
                onChange={(e) =>
                  setNewIssue({ ...newIssue, description: e.target.value })
                }
                required
              />
            </label>
            <label>Options</label>
            {newIssue.options.map((opt, idx) => (
              <div key={idx} className="option-input-row">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const opts = [...newIssue.options];
                    opts[idx] = e.target.value;
                    setNewIssue({ ...newIssue, options: opts });
                  }}
                  required
                  placeholder={`Option ${idx + 1}`}
                />
                {newIssue.options.length > 2 && (
                  <button
                    type="button"
                    className="remove-opt-btn"
                    onClick={() =>
                      setNewIssue({
                        ...newIssue,
                        options: newIssue.options.filter((_, i) => i !== idx),
                      })
                    }
                    aria-label="Remove option"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="add-opt-btn"
              onClick={() =>
                setNewIssue({ ...newIssue, options: [...newIssue.options, ""] })
              }
            >
              + Add Option
            </button>
            {addError && <div className="add-error">{addError}</div>}
            <div className="modal-actions">
              <button type="submit" className="submit-btn">
                Add Issue
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowAddIssue(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Username modal */}
      {showUsernamePrompt && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Enter username"
        >
          <form className="modal" onSubmit={handleUsernameSubmit}>
            <h3>Enter your name</h3>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              maxLength={32}
              autoFocus
              placeholder="Your name"
            />
            <div className="modal-actions">
              <button type="submit" className="submit-btn">
                Continue
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function Navbar({
  theme,
  toggleTheme,
  username,
  setShowAddIssue,
  activeSection,
  handleResetVotes,
}: {
  theme: string;
  toggleTheme: () => void;
  username: string;
  setShowAddIssue: (show: boolean) => void;
  activeSection: string;
  handleResetVotes: () => void;
}) {
  const navLinks = [
    { href: "#issues", label: "Issues", key: "issues" },
    { href: "#results", label: "Results", key: "results" },
    { href: "#about", label: "About", key: "about" },
  ];
  return (
    <nav className="main-navbar" aria-label="Main navigation">
      <div className="navbar-left">
        <span className="navbar-logo" aria-label="Voting App Home">
          {/* Vercel-like logo */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
          >
            <polygon
              points="16,4 30,28 2,28"
              fill={theme === "dark" ? "#fff" : "#18181b"}
            />
          </svg>
        </span>
        <span className="navbar-title">Votely</span>
      </div>
      <div className="navbar-center">
        {navLinks.map((link) => (
          <a
            key={link.key}
            href={link.href}
            className={`navbar-link${
              activeSection === link.key ? " active" : ""
            }`}
            aria-current={activeSection === link.key ? "page" : undefined}
          >
            {link.label}
            <span className="navbar-underline" />
          </a>
        ))}
      </div>
      <div className="navbar-right">
        <button
          className="navbar-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "🌙" : "☀️"}
        </button>
        <button
          className="navbar-btn add-issue-navbar"
          onClick={() => setShowAddIssue(true)}
        >
          <span className="plus-icon">+</span> Add Issue
        </button>
        <button className="navbar-btn reset-navbar" onClick={handleResetVotes}>
          Reset Votes
        </button>
        {username && (
          <span className="navbar-user" title="You are signed in as">
            👤 {username}
          </span>
        )}
      </div>
    </nav>
  );
}

function ResultsBarChart({ options }: { options: Option[] }) {
  const total = options.reduce((sum, o) => sum + o.votes, 0);
  if (total === 0) return null;
  return (
    <div className="results-bar-chart" aria-label="Results">
      {options.map((option) => {
        const percent = total ? Math.round((option.votes / total) * 100) : 0;
        return (
          <div key={option.id} className="bar-row">
            <span className="bar-label">{option.label}</span>
            <div className="bar-outer">
              <div
                className="bar-inner"
                style={{ width: percent + "%" }}
                aria-label={`${option.label} progress`}
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                role="progressbar"
              />
            </div>
            <span className="bar-percent">{percent}%</span>
          </div>
        );
      })}
    </div>
  );
}

export default App;
