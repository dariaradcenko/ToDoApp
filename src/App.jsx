import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Parse, { configured } from "./services/parse.js";
import AuthPage from "./pages/AuthPage.jsx";
import Workspace from "./components/Workspace.jsx";

function App() {
  const [user, setUser] = useState(() =>
    configured ? Parse.User.current() : null,
  );

  function handleAuthenticated(loggedInUser) {
    setUser(loggedInUser);
  }

  function handleLogout() {
    Parse.User.logOut().then(() => setUser(null));
  }

  if (!configured) {
    return (
      <p>The project service is not configured. Please check your .env file.</p>
    );
  }

  if (!user) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/overview" replace />} />
      <Route
        path="/*"
        element={<Workspace userId={user.id} onLogout={handleLogout} />}
      />
    </Routes>
  );
}

export default App;
