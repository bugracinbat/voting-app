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
  const [voted, setVoted] = useState<{ [issueId: number]: number | null }>({});
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
  const [comments, setComments] = useState<{ [issueId: number]: { user: string; text: string; date: string }[] }>({});
  const [commentInput, setCommentInput] = useState("");
  const [commentUser, setCommentUser] = useState("");

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

  const handleVote = (optionId: number) => {
    if (voted[selectedIssueId] !== undefined) return;
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
    setVoted((prev) => ({ ...prev, [selectedIssueId]: optionId }));
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

  return (
    <main className={`vercel-theme${theme === "light" ? " light" : ""}`}>
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
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
          <button
            className="add-issue-btn"
            onClick={() => setShowAddIssue(true)}
          >
            + Add Issue
          </button>
          <button className="reset-btn" onClick={handleResetVotes}>
            Reset Votes
          </button>
        </div>
      </header>
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
      <section className="issue-section">
        <h2>{selectedIssue.title}</h2>
        <p className="issue-desc">{selectedIssue.description}</p>
        <form aria-label="Voting options" className="voting-form">
          <fieldset disabled={voted[selectedIssueId] !== undefined}>
            <legend>Choose your option:</legend>
            {selectedIssue.options.map((option) => (
              <div key={option.id} className="option-row">
                <button
                  type="button"
                  onClick={() => handleVote(option.id)}
                  aria-pressed={voted[selectedIssueId] === option.id}
                  aria-label={`Vote for ${option.label}`}
                  className="vote-btn"
                  disabled={voted[selectedIssueId] !== undefined}
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
        <div className="total-votes">
          Total votes:{" "}
          {selectedIssue.options.reduce((sum, o) => sum + o.votes, 0)}
        </div>
        {voted[selectedIssueId] !== undefined && (
          <div className="thank-you" role="status" aria-live="polite">
            <p>Thank you for voting!</p>
          </div>
        )}
        {/* Comments Section */}
        <div className="comments-section">
          <h3>Comments</h3>
          <form className="comment-form" onSubmit={handleAddComment}>
            <input
              type="text"
              className="comment-user"
              placeholder="Your name"
              value={commentUser}
              onChange={e => setCommentUser(e.target.value)}
              required
              maxLength={32}
            />
            <textarea
              className="comment-input"
              placeholder="Add a comment..."
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              required
              maxLength={240}
            />
            <button type="submit" className="submit-comment-btn">Comment</button>
          </form>
          <ul className="comments-list">
            {(comments[selectedIssueId] || []).length === 0 && (
              <li className="no-comments">No comments yet.</li>
            )}
            {(comments[selectedIssueId] || []).map((c, i) => (
              <li key={i} className="comment-item">
                <span className="comment-user-label">{c.user}</span>
                <span className="comment-date">{new Date(c.date).toLocaleString()}</span>
                <div className="comment-text">{c.text}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
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
