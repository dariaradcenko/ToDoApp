import parse from "parse";

const SupervisorSuggestion = parse.Object.extend("SupervisorSuggestion");

const List = parse.Object.extend("List");

export async function fetchSuggestions(supervisorListId) {
  const supervisorList = List.createWithoutData(supervisorListId);

  const query = new parse.Query(SupervisorSuggestion);

  query.equalTo("supervisorList", supervisorList);
  query.ascending("createdAt");

  const results = await query.find();

  return results.map((suggestion) => ({
    id: suggestion.id,
    text: suggestion.get("text"),
    date: suggestion.get("date"),
    prio: suggestion.get("prio"),
  }));
}

export async function createSuggestion(
  text,
  date,
  prio,
  supervisorListId,
  sharedListId,
) {
  return await parse.Cloud.run("createSuggestion", {
    text,
    date,
    prio,
    supervisorListId,
    sharedListId,
  });
}

export async function acceptSuggestion(suggestionId) {
  return await parse.Cloud.run("acceptSuggestion", {
    suggestionId,
  });
}

export async function dismissSuggestion(suggestionId) {
  return await parse.Cloud.run("dismissSuggestion", {
    suggestionId,
  });
}
