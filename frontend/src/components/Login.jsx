import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const Login = ({ setIsAuthenticated, setUserEmail }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Initialize the useNavigate hook

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `username=${username}&password=${password}`,
      });

      if (!response.ok) {
        throw new Error("Invalid login credentials");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("email", data.email);  // Store the email in localStorage

      setIsAuthenticated(true);  // Update the authentication status
      setUserEmail(data.email);  // Update the email in state

      // Redirect to the notes page after successful login
      navigate("/notes"); // Updated to redirect to /notes instead of /profile
    } catch (error) {
      setError(error.message);  // Show the error message
    }
  };

  return (
    <div className="container">
      <div className="columns is-centered">
        <div className="column is-half">
          <h1 className="title has-text-centered">Login</h1>
          {error && <p className="notification is-danger">{error}</p>}
          <form onSubmit={handleSubmit} className="box">
            <div className="field">
              <label className="label">Username</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Password</label>
              <div className="control">
                <input
                  className="input"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field">
              <button type="submit" className="button is-primary is-fullwidth">
                Log In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
