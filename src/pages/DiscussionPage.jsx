import { useState, useEffect } from "react";
import NewQuestionForm from "../components/NewQuestionForm.jsx";
import QuestionItem from "../components/QuestionItem.jsx";
import {
  fetchQuestions,
  createQuestion,
} from "../services/discussionServices.js";
import "./DiscussionPage.css";

// Same as the ToDoList from the lectures
export default function DiscussionPage() {
  const [questions, setQuestions] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  // Load all questions once, when the page opens.
  useEffect(() => {
    async function load() {
      try {
        setQuestions(await fetchQuestions());
        setStatus("ready");
      } catch (error) {
        console.error(error);
        setStatus("failed");
      }
    }
    load();
  }, []);

  async function handleAdd(text, kind) {
    setError("");
    try {
      const newQuestion = await createQuestion(text, kind);
      setQuestions((current) => [...current, newQuestion]);
    } catch (error) {
      setError(error.message);
    }
  }

  if (status === "loading")
    return (
      <main className="home-page">
        <p>Loading discussions…</p>
      </main>
    );
  if (status === "failed")
    return (
      <main className="home-page">
        <p className="workspace-error">
          Could not reach the server. Try again.
        </p>
      </main>
    );

  const groupQuestions = questions.filter(
    (question) => question.kind === "group",
  );
  const supervisorQuestions = questions.filter(
    (question) => question.kind === "supervisor",
  );

  return (
    <main className="home-page discussion-page">
      <header className="home-header">
        <h1>Discussions</h1>
        <p>
          Talk things through with your thesis group, and collect questions for
          your supervisor.
        </p>
      </header>

      {error && (
        <p className="workspace-error" role="alert">
          {error}
        </p>
      )}

      <div className="home-task-panels">
        <section className="summary-card discussion-card">
          <header className="summary-heading">
            <div>
              <h2 id="group-heading">
                Group discussions ({groupQuestions.length})
              </h2>
              <p>Visible to your thesis group</p>
            </div>
          </header>
          {groupQuestions.length === 0 ? (
            <p className="summary-empty">No discussion points yet.</p>
          ) : (
            <ul
              className="question-list"
              role="list"
              aria-labelledby="group-heading"
            >
              {groupQuestions.map((question) => (
                <QuestionItem key={question.id} question={question} />
              ))}
            </ul>
          )}
          <NewQuestionForm
            id="new-group-question"
            label="New discussion point"
            buttonText="+ Add discussion point"
            onAdd={(text) => handleAdd(text, "group")}
          />
        </section>

        <section className="summary-card discussion-card">
          <header className="summary-heading">
            <div>
              <h2 id="supervisor-heading">
                Questions for your supervisor ({supervisorQuestions.length})
              </h2>
              <p>Visible to your supervisor</p>
            </div>
          </header>
          {supervisorQuestions.length === 0 ? (
            <p className="summary-empty">
              No questions for your supervisor yet.
            </p>
          ) : (
            <ul
              className="question-list"
              role="list"
              aria-labelledby="supervisor-heading"
            >
              {supervisorQuestions.map((question) => (
                <QuestionItem key={question.id} question={question} />
              ))}
            </ul>
          )}
          <NewQuestionForm
            id="new-supervisor-question"
            label="New question for your supervisor"
            buttonText="+ Add question"
            onAdd={(text) => handleAdd(text, "supervisor")}
          />
        </section>
      </div>
    </main>
  );
}
