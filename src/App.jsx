import { useState } from "react";
import "./App.css";
import Parse from "parse";
import AuthPage from "./pages/AuthPage.jsx";
import ListHandler from "./components/ListHandler.jsx";

Parse.serverURL = "https://parseapi.back4app.com";
Parse.initialize(
  import.meta.env.VITE_PARSE_APP_ID,
  import.meta.env.VITE_PARSE_JS_KEY,
);

function App() {
  const [user, setUser] = useState(Parse.User.current());

  function handleAuthenticated(loggedInUser) {
    setUser(loggedInUser);
  }

  function handleLogout() {
    Parse.User.logOut().then(() => setUser(null));
  }

  if (!user) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="main-inner">
      <ListHandler userId={user.id} />
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default App;
