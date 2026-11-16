import { useState, useEffect } from "react";
import { fetchLists } from "../services/listServices";
import { createTodo } from "../services/todoServices";
import NewTodoForm from "./NewTodoForm";
import ToDoList from "./ToDoList";
import SupervisorSuggestions from "./supervisorSuggestions";

export default function ListHandler({ userId }) {
  const [lists, setLists] = useState([]);
  const [update, setUpdate] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadLists() {
      const result = await fetchLists();

      if (active) {
        setLists(result);
      }
    }

    setLists([]);
    loadLists();

    return () => {
      active = false;
    };
  }, [userId]);

  async function handleAdd(text, date, prio, listId) {
    await createTodo(text, date, prio, listId);

    setUpdate((current) => ({
      listId,
      version: (current?.version ?? 0) + 1,
    }));
  }

  const taskLists = lists.filter((list) => list.type !== "supervisor");

  return (
    <div className="lists-container">
      <h2>My Lists</h2>

      <NewTodoForm onAdd={handleAdd} lists={taskLists} />

      {lists.map((list) => (
        <div key={list.id} className="list-container">
          {list.type === "supervisor" ? (
            <SupervisorSuggestions listId={list.id} />
          ) : (
            <ToDoList
              listTitle={list.name}
              listId={list.id}
              refreshEvent={update}
            />
          )}
        </div>
      ))}
    </div>
  );
}
