import { useState } from 'react'
import './App.css'

interface Option {
  id: number
  label: string
  votes: number
}

interface Issue {
  id: number
  title: string
  description: string
  options: Option[]
}

const initialIssues: Issue[] = [
  {
    id: 1,
    title: 'Should we adopt a 4-day workweek?',
    description: 'Vote on whether to move to a 4-day workweek for all employees.',
    options: [
      { id: 1, label: 'Yes', votes: 0 },
      { id: 2, label: 'No', votes: 0 },
      { id: 3, label: 'Undecided', votes: 0 },
    ],
  },
  {
    id: 2,
    title: 'Preferred Frontend Framework',
    description: 'Which frontend framework should we use for our next project?',
    options: [
      { id: 1, label: 'React', votes: 0 },
      { id: 2, label: 'Vue', votes: 0 },
      { id: 3, label: 'Svelte', votes: 0 },
    ],
  },
]

function App() {
  const [issues, setIssues] = useState<Issue[]>(initialIssues)
  const [selectedIssueId, setSelectedIssueId] = useState<number>(issues[0].id)
  const [voted, setVoted] = useState<{ [issueId: number]: number | null }>({})

  const selectedIssue = issues.find((issue) => issue.id === selectedIssueId)!

  const handleVote = (optionId: number) => {
    if (voted[selectedIssueId] !== undefined) return
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
    )
    setVoted((prev) => ({ ...prev, [selectedIssueId]: optionId }))
  }

  return (
    <main className="vercel-theme">
      <header className="header">
        <h1>Public Voting</h1>
        <nav className="issue-nav" aria-label="Select issue">
          {issues.map((issue) => (
            <button
              key={issue.id}
              className={`issue-tab${
                selectedIssueId === issue.id ? ' active' : ''
              }`}
              onClick={() => setSelectedIssueId(issue.id)}
              aria-current={selectedIssueId === issue.id}
            >
              {issue.title}
            </button>
          ))}
        </nav>
      </header>
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
                  {option.votes} vote{option.votes !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </fieldset>
        </form>
        {voted[selectedIssueId] !== undefined && (
          <div className="thank-you" role="status" aria-live="polite">
            <p>Thank you for voting!</p>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
