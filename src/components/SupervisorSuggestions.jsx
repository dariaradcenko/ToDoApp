import { useState, useEffect } from "react";
import {
  fetchSuggestions,
  createSuggestion,
  dismissSuggestion,
  acceptSuggestion,
} from "../services/suggestionServices";
import { checkIsSupervisor } from "../services/authServices";
import { formatTaskDate } from "../utils/taskDates.js";

export default function SupervisorSuggestions({
  listId,
  sharedListId,
  onSuggestionAccepted,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  const [prio, setPrio] = useState("medium");
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [saving, setSaving] = useState(false);
  const [respondingId, setRespondingId] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadRole() {
      try {
        const result = await checkIsSupervisor();

        if (active) {
          setIsSupervisor(result);
        }
      } catch (error) {
        if (active) {
          setError(error.message);
        }
      } finally {
        if (active) {
          setCheckingRole(false);
        }
      }
    }

    loadRole();
    return () => {
      active = false;
    };
  }, []);

  async function handleAddSuggestion(event) {
    event.preventDefault();

    if (!isSupervisor || !text.trim() || saving) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const newSuggestion = await createSuggestion(
        text.trim(),
        date,
        prio,
        listId,
        sharedListId,
      );

      setSuggestions((current) => [...current, newSuggestion]);

      setText("");
      setDate("");
      setPrio("medium");
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAccept(suggestionId) {
    if (respondingId) return;

    setRespondingId(suggestionId);
    setError("");

    try {
      await acceptSuggestion(suggestionId);

      // Remove it from the suggestion list
      setSuggestions((current) => current.filter((s) => s.id !== suggestionId));

      // Tell the parent to refresh the shared group list
      onSuggestionAccepted?.();
    } catch (error) {
      setError(error.message);
    } finally {
      setRespondingId(null);
    }
  }

  async function handleDismiss(suggestionId) {
    if (respondingId) return;

    setRespondingId(suggestionId);
    setError("");

    try {
      await dismissSuggestion(suggestionId);

      // Remove it from the suggestion list
      setSuggestions((current) => current.filter((s) => s.id !== suggestionId));
    } catch (error) {
      setError(error.message);
    } finally {
      setRespondingId(null);
    }
  }

  // Your existing useEffect for loading suggestions
  useEffect(() => {
    let active = true;

    async function loadSuggestions() {
      if (!listId) return;

      try {
        const results = await fetchSuggestions(listId);

        if (active) {
          setSuggestions(results);
        }
      } catch (error) {
        if (active) {
          setError(error.message);
        }
      }
    }

    loadSuggestions();

    return () => {
      active = false;
    };
  }, [listId]);

  return (
    <div className="tasks-page__suggestions">
      <div className="tasks-page__list-heading">
        <div>
          <span className="tasks-page__list-kind tasks-page__list-kind--supervisor">
            SUPERVISION
          </span>
          <h2>Supervisor Suggestions</h2>
          <p>
            {isSupervisor
              ? "Suggest next steps for the thesis group"
              : "Review feedback and choose what becomes a shared task"}
          </p>
        </div>
        <span className="tasks-page__count">{suggestions.length} pending</span>
      </div>

      {error && (
        <p className="tasks-page__error" role="alert">
          {error}
        </p>
      )}

      {!checkingRole && isSupervisor && (
        <form
          className="tasks-page__suggestion-form"
          onSubmit={handleAddSuggestion}
        >
          <h3>Add a suggestion</h3>
          <div className="tasks-page__suggestion-fields">
            <div className="tasks-page__field tasks-page__field--task">
              <label htmlFor="suggestion-text">Suggestion</label>
              <input
                id="suggestion-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. Review the theoretical framework"
                required
              />
            </div>
            <div className="tasks-page__field">
              <label htmlFor="suggestion-date">Due date (optional)</label>
              <input
                id="suggestion-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="tasks-page__field">
              <label htmlFor="suggestion-priority">Priority</label>
              <select
                id="suggestion-priority"
                value={prio}
                onChange={(e) => setPrio(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <button
            className="tasks-page__primary-button"
            type="submit"
            disabled={saving || !text.trim() || !sharedListId}
          >
            {saving ? "Saving…" : "+ Add suggestion"}
          </button>
          {!sharedListId && (
            <p className="tasks-page__error">
              The shared list is not available.
            </p>
          )}
        </form>
      )}

      {suggestions.length === 0 && !error ? (
        <div className="tasks-page__empty">
          <span className="tasks-page__empty-icon" aria-hidden="true">
            ✦
          </span>
          <p>No pending suggestions</p>
          <small>
            {isSupervisor
              ? "Add a suggestion using the form above."
              : "Your supervisor has no suggestions right now."}
          </small>
        </div>
      ) : (
        <ul className="tasks-page__items tasks-page__suggestion-items">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id} className="tasks-page__suggestion-item">
              <div className="tasks-page__suggestion-info">
                <span className="tasks-page__item-text">{suggestion.text}</span>
                <div className="tasks-page__item-meta">
                  {suggestion.prio && (
                    <span
                      className={`tasks-page__priority tasks-page__priority--${suggestion.prio}`}
                    >
                      {suggestion.prio} priority
                    </span>
                  )}
                  {suggestion.date && (
                    <span className="tasks-page__item-date">
                      Due {formatTaskDate(suggestion.date)}
                    </span>
                  )}
                </div>
              </div>
              {!checkingRole && !isSupervisor && (
                <div className="tasks-page__suggestion-actions">
                  <button
                    className="tasks-page__primary-button"
                    type="button"
                    onClick={() => handleAccept(suggestion.id)}
                    disabled={respondingId !== null}
                  >
                    Accept
                  </button>
                  <button
                    className="tasks-page__secondary-button"
                    type="button"
                    onClick={() => handleDismiss(suggestion.id)}
                    disabled={respondingId !== null}
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
