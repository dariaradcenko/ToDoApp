import parse from "parse";

const List = parse.Object.extend("List");

export async function fetchLists() {
  const user = parse.User.current();

  const privateQuery = new parse.Query(List);
  privateQuery.equalTo("owner", user);
  privateQuery.equalTo("type", "private");

  const sharedQuery = new parse.Query(List);
  sharedQuery.equalTo("type", "shared");

  const supervisorQuery = new parse.Query(List);
  supervisorQuery.equalTo("type", "supervisor");

  const query = parse.Query.or(privateQuery, sharedQuery, supervisorQuery);

  const results = await query.find();

  const listOrder = { private: 1, shared: 2, supervisor: 3 };

  return results
    .map((list) => ({
      id: list.id,
      name: list.get("name"),
      type: list.get("type"),
    }))
    .sort((a, b) => {
      return listOrder[a.type] - listOrder[b.type];
    });
}

export async function createPrivateList() {
  const user = parse.User.current();

  const query = new parse.Query(List);
  query.equalTo("owner", user);
  query.equalTo("type", "private");

  const existing = await query.first();

  if (existing) return existing;

  const list = new List();

  list.set("name", "My Tasks");
  list.set("type", "private");
  list.set("owner", user);

  list.setACL(new parse.ACL(user));

  return await list.save();
}
