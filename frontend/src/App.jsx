import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Link, useNavigate, Navigate } from "react-router-dom";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./components/Registration";
import UserProfile from "./components/UserProfile"; // New UserProfile component
import Notes from "./components/Notes"; // New UserProfile component

const App = () => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Fetch welcome message
  const getWelcomeMessage = async () => {
    const requestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api", requestOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      console.error("Error fetching message:", error);
      setError("Failed to load message. Please try again later.");
    }
  };

  // Check if the user is logged in when the component mounts
  useEffect(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");

    if (token) {
      setIsAuthenticated(true);
      setUserEmail(email);
    }

    getWelcomeMessage();
  }, []);

  // Handle Logout
  const handleLogout = (navigate) => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    setIsAuthenticated(false);
    setUserEmail("");
    navigate("/login"); // Redirect to login page after logout
  };

  return (
    <Router>
      <AppLayout
        error={error}
        isAuthenticated={isAuthenticated}
        userEmail={userEmail}
        handleLogout={handleLogout}
        setIsAuthenticated={setIsAuthenticated}
        setUserEmail={setUserEmail}
      />
    </Router>
  );
};

// Separate Layout Component for structure
const AppLayout = ({ error, isAuthenticated, userEmail, handleLogout, setIsAuthenticated, setUserEmail }) => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Header */}
      <header className="navbar is-light">
        <div className="navbar-brand">
          <Link to="/" className="navbar-item">
            <strong>Fast API</strong>
          </Link>
        </div>

        <div className="navbar-menu">
          <div className="navbar-end">
            {isAuthenticated ? (
              <>
                <p className="navbar-item">Welcome, {userEmail}</p>
                <button
                  onClick={() => handleLogout(navigate)}
                  className="button is-danger is-dark"
                  style={{ margin: '10px' }}
                >
                  Logout
                </button>
                <Link to="/profile" className="button is-info is-dark" style={{ margin: '10px' }}>
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="button is-success is-dark"
                  style={{ margin: '10px' }}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="button is-info is-dark"
                  style={{ margin: '10px' }}
                >
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="section">
        <div className="container">
          <div className="columns is-centered">
            <div className="column is-half">
              <Routes>
                {/* Public Routes */}
                <Route
                  path="/login"
                  element={
                    isAuthenticated ? (
                      <Navigate to="/notes" replace /> // Redirect to Notes if already authenticated
                    ) : (
                      <Login setIsAuthenticated={setIsAuthenticated} setUserEmail={setUserEmail} />
                    )
                  }
                />

                <Route path="/register" element={<Register />} />
                <Route
                  path="/notes"
                  element={
                    <Notes />
                  }
                />

                {/* Protected Routes */}
                <Route
                  path="/profile"
                  element={
                    <UserProfile />
                  }
                />
              </Routes>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default App;
