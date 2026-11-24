import Parse from "./parse.js";
import { fetchLists } from "./listServices.js";

// Two new tables in Back4App: Question and Reply.
const Question = Parse.Object.extend("Question");
const Reply = Parse.Object.extend("Reply");

// A question is either for the thesis group or for the supervisor.
// Each kind is attached to one type of list, so it gets that list's permissions.
const LIST_TYPE_FOR = { group: "shared", supervisor: "supervisor" };

// Components get plain objects, never Parse objects (week 8).
function toPlainQuestion(record) {
  return {
    id: record.id,
    text: record.get("text"),
    kind: record.get("kind"),
    authorName: record.get("authorName") ?? "Someone",
  };
}

function toPlainReply(record) {
  return {
    id: record.id,
    text: record.get("text"),
    authorName: record.get("authorName") ?? "Someone",
  };
}

// Every question this user is allowed to see, oldest first.
// The ACLs decide which ones come back, just like with tasks.
export async function fetchQuestions() {
  const query = new Parse.Query(Question);
  query.ascending("createdAt");
  const results = await query.find();
  return results.map(toPlainQuestion);
}

// kind is "group" or "supervisor".
export async function createQuestion(text, kind) {
  const user = Parse.User.current();

  // Find the list this question belongs to: the shared group list,
  // or the supervisor list.
  const lists = await fetchLists();
  const listInfo = lists.find((list) => list.type === LIST_TYPE_FOR[kind]);
  if (!listInfo) {
    throw new Error(
      kind === "group"
        ? "You don't have a shared group list yet, so nobody could see this discussion point."
        : "You don't have a supervisor list yet, so your supervisor couldn't see this question.",
    );
  }
  const list = await new Parse.Query("List").get(listInfo.id);

  const question = new Question();
  question.set("text", text);
  question.set("kind", kind);
  question.set("list", list);
  question.set("author", user);
  question.set("authorName", user.get("username"));
  // The question copies the list's permissions, the same trick createTodo uses:
  // whoever can see the list can see the question.
  const acl = list.getACL();
  if (acl) question.setACL(acl);

  return toPlainQuestion(await question.save());
}

// All replies to one question, oldest first.
export async function fetchReplies(questionId) {
  const query = new Parse.Query(Reply);
  query.equalTo("question", Question.createWithoutData(questionId));
  query.ascending("createdAt");
  const results = await query.find();
  return results.map(toPlainReply);
}

export async function createReply(questionId, text) {
  const user = Parse.User.current();
  const question = await new Parse.Query(Question).get(questionId);

  const reply = new Reply();
  reply.set("text", text);
  reply.set("question", question);
  reply.set("author", user);
  reply.set("authorName", user.get("username"));
  // A reply can be seen by exactly the people who can see its question.
  const acl = question.getACL();
  if (acl) reply.setACL(acl);

  return toPlainReply(await reply.save());
}
