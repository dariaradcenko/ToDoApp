import parse from "parse";

export async function checkIsSupervisor() {
  return await parse.Cloud.run("isSupervisor");
}
