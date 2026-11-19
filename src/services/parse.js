import Parse from "parse";

// Week 8 keeps initialization in one service file. Other homepage services
// import this instance, so components do not need to know how Back4App connects.
const settings = import.meta.env || {};
export const configured = Boolean(settings.VITE_PARSE_APP_ID && settings.VITE_PARSE_JS_KEY);
if (configured) {
  Parse.initialize(settings.VITE_PARSE_APP_ID, settings.VITE_PARSE_JS_KEY);
  Parse.serverURL = "https://parseapi.back4app.com";
}

export default Parse;
