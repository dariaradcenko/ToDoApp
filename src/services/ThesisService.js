import Parse from "./parse.js";
import { fetchLists } from "./listServices.js";
import { dateInputValue } from "../utils/taskDates.js";

// Account helpers stay in the service layer, not in screen components.
// The screen gets a plain object, not a Parse database object (Week 8).
export function currentUser() {
  const user = Parse.User.current();
  return user ? { id: user.id } : null;
}

// Other services need the real user object to make owner queries and ACLs.
// Keep it inside the service layer rather than passing it to components.
export function requireUser() {
  const user = Parse.User.current();
  if (!user) throw new Error("Sign in to load or save your project online.");
  return user;
}

// Follow the teammate's List/TodoItem pattern: Project is the online collection.
// Each account owns its own project, just as each account owns a private task list.
const Project = Parse.Object.extend("Project");
export const PROJECT_STATUSES = ["Not started", "In progress", "Completed"];
// Initial form values for an account with no saved project yet.
// Returning these values does not create a database record; Save does that.
export const DEFAULT_PROJECT = {
  name: "Alex",
  title: "Children’s mental health",
  currentTaskId: "",
  status: "In progress",
  startDate: "2026-01-06",
  deadline: "2026-06-28",
  memberCount: 3,
};

// Keep the seven form fields, trim text, and convert the number input to a number.
function cleanProject(input) {
  return {
    name: input.name.trim(),
    title: input.title.trim(),
    status: input.status,
    currentTaskId: input.currentTaskId,
    startDate: input.startDate,
    deadline: input.deadline,
    memberCount: Number(input.memberCount),
  };
}

// Keep basic checks here as well as the form's required/min/type attributes.
// Return an error message, or an empty string when the values are valid.
export function getProjectError(project) {
  if (!project.name || !project.title) {
    return "Please enter your name and project name.";
  }
  if (!project.startDate || !project.deadline) {
    return "Please choose a start date and deadline.";
  }
  if (project.deadline <= project.startDate) {
    return "The deadline must be after the start date.";
  }
  if (!Number.isInteger(project.memberCount) || project.memberCount < 1) {
    return "The group must have at least one member. Use a whole number.";
  }
  return "";
}

function projectFromRecord(record) {
  return cleanProject({
    name: record.get("name"),
    title: record.get("title"),
    status: record.get("status"),
    currentTaskId: record.get("currentTaskId") || "",
    startDate: dateInputValue(record.get("startDate")),
    deadline: dateInputValue(record.get("deadline")),
    memberCount: record.get("memberCount"),
  });
}

function projectQuery(user) {
  const query = new Parse.Query(Project);
  query.equalTo("owner", user);
  return query;
}

// Let loading/saving errors reach the components, which already display them.
export async function loadProject() {
  const user = requireUser();
  const record = await projectQuery(user).first();
  // A new account starts with form defaults. Nothing is uploaded until Save.
  if (!record) return { ...DEFAULT_PROJECT };
  const project = projectFromRecord(record);
  if (getProjectError(project)) throw new Error("Invalid saved project");
  return project;
}

export async function saveProject(input) {
  const project = cleanProject(input);
  const error = getProjectError(project);
  if (error) throw new Error(error);

  const user = requireUser();
  let record = await projectQuery(user).first();
  if (!record) {
    record = new Project();
    record.set("owner", user);
    // Like createPrivateList, give the signed-in account read/write access.
    // A member count is display information; it does not grant other users access.
    record.setACL(new Parse.ACL(user));
  }
  record.set("name", project.name);
  record.set("title", project.title);
  record.set("status", project.status);
  record.set("currentTaskId", project.currentTaskId);
  record.set("startDate", new Date(`${project.startDate}T12:00:00`));
  record.set("deadline", new Date(`${project.deadline}T12:00:00`));
  record.set("memberCount", project.memberCount);
  await record.save();
  return projectFromRecord(record);
}

// Like the Week 8 example, turn the record's ACL into a simple flag for the UI.
// Back4App still checks server permissions when a change is actually saved.
function canWrite(record) {
  const acl = record.getACL();
  if (!acl) return true;
  const user = Parse.User.current();
  return acl.getPublicWriteAccess() || Boolean(user && acl.getWriteAccess(user));
}

// This adapter belongs to the homepage. The teammate's list/todo services stay unchanged.
// Read the existing records directly because their fetchTodos only returns id/text/done,
// while the homepage also needs each task's saved due date and list id.
export async function fetchHomepageTaskData() {
  const lists = await fetchLists();
  const TodoItem = Parse.Object.extend("TodoItem");
  const List = Parse.Object.extend("List");
  const groups = await Promise.all(lists.map(async (list) => {
    const query = new Parse.Query(TodoItem);
    query.equalTo("list", List.createWithoutData(list.id));
    query.ascending("createdAt");
    const records = await query.find();
    return records.map((record) => ({
      id: record.id,
      text: record.get("text") ?? "Untitled task",
      done: Boolean(record.get("done")),
      date: record.get("date")?.toISOString() ?? null,
      listId: list.id,
      canWrite: list.type !== "supervisor" && canWrite(record),
    }));
  }));
  return { lists, todos: groups.flat() };
}
