import { useState } from "react";

// Same as NewTodoForm from the lectures (week 6)
export default function NewQuestionForm({ id, label, buttonText, onAdd }) {
  const [text, setText] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onAdd(text.trim());
    setText("");
  }

  return (
    <form className="discussion-form" onSubmit={handleSubmit}>
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <input
        type="text"
        id={id}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={label}
        autoComplete="off"
      />
      <button className="task-button" disabled={text.trim().length === 0}>
        {buttonText}
      </button>
    </form>
  );
}
