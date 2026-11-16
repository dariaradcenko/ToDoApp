import parse from "parse";

const TodoItem = parse.Object.extend("TodoItem");

function toPlainObjectItem(parseObject) {
  return {
    id: parseObject.id,
    text: parseObject.get("text"),
    done: parseObject.get("done"),
  };
}

export async function fetchTodos(listId) {
  const query = new parse.Query(TodoItem);

  const List = parse.Object.extend("List");
  const list = List.createWithoutData(listId);

  query.equalTo("list", list);
  query.ascending("createdAt");

  const results = await query.find();
  return results.map(toPlainObjectItem);
}

export async function createTodo(text, date, prio, listId) {
  const item = new TodoItem();
  const List = parse.Object.extend("List");
  const query = new parse.Query(List);
  const list = await query.get(listId);
  item.set("text", text);
  item.set("done", false);
  item.set("date", date ? new Date(`${date}T12:00:00`) : null);
  item.set("prio", prio);
  item.set("list", list);
  item.setACL(list.getACL());
  return toPlainObjectItem(await item.save());
}

export async function setTodoDone(id, done) {
  const item = TodoItem.createWithoutData(id);
  item.set("done", done);
  return toPlainObjectItem(await item.save());
}

export async function deleteTodo(id) {
  const item = TodoItem.createWithoutData(id);
  await item.destroy();
}
