import { useState, useEffect } from "react";
import NewQuestionForm from "./NewQuestionForm.jsx";
import { fetchReplies, createReply } from "../services/discussionServices.js";

// Like ToDoItem from the lectures
export default function QuestionItem({ question }) {
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!open) return;
    async function load() {
      try {
        setReplies(await fetchReplies(question.id));
        setStatus("ready");
      } catch (error) {
        console.error(error);
        setStatus("failed");
      }
    }
    load();
  }, [open, question.id]);

  async function handleAddReply(text) {
    try {
      const newReply = await createReply(question.id, text);
      // Updater function: time passes during the await (stale state lecture).
      setReplies((current) => [...current, newReply]);
    } catch (error) {
      console.error(error);
      setStatus("failed");
    }
  }

  return (
    <li className="question-item">
      <button
        type="button"
        className="question-toggle"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="question-text">{question.text}</span>
        <span className="question-meta">{question.authorName}</span>
        <span className="question-chevron" aria-hidden="true">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="question-replies">
          {status === "loading" && (
            <p className="summary-empty">Loading replies…</p>
          )}
          {status === "failed" && (
            <p className="form-error">Could not load the replies. Try again.</p>
          )}
          {status === "ready" &&
            (replies.length === 0 ? (
              <p className="summary-empty">No replies yet.</p>
            ) : (
              <ul className="reply-list" role="list">
                {replies.map((reply) => (
                  <li key={reply.id} className="reply">
                    <span className="reply-author">{reply.authorName}</span>
                    {reply.text}
                  </li>
                ))}
              </ul>
            ))}

          <NewQuestionForm
            id={`reply-${question.id}`}
            label="Write a reply"
            buttonText="Reply"
            onAdd={handleAddReply}
          />
        </div>
      )}
    </li>
  );
}
