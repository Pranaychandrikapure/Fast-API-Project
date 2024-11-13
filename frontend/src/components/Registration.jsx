import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation

const Register = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otherInfo, setOtherInfo] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [token, setToken] = useState("");

  const navigate = useNavigate(); // Initialize useNavigate

  const submitRegistration = async () => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username, email: email, password: password, other_info: otherInfo }),
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/register", requestOptions);
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.detail || "Failed to register");
        return;
      }

      console.log("Registered successfully");

      if (data.access_token) {
        localStorage.setItem("token", data.access_token); // Store token
        setToken(data.access_token);
        setErrorMessage("");

        navigate("/login"); // Navigate to login page on successful registration
      } else {
        setErrorMessage("No token returned");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      setErrorMessage("An error occurred. Please try again later.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === confirmPassword && password.length > 5) {
      submitRegistration();
    } else {
      setErrorMessage("Passwords do not match or length is less than 6 characters.");
    }
  };

  return (
    <>
      <div className="column">
        <form onSubmit={handleSubmit} className="box">
          <h1 className="title has-text-centered">Register</h1>

          {errorMessage && <p className="notification is-danger">{errorMessage}</p>}

          <div className="field">
            <label className="label">Email Address</label>
            <div className="control">
              <input
                type="email"
                placeholder="Enter Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Other information</label>
            <div className="control">
              <input
                type="text"
                placeholder="Enter other information"
                value={otherInfo}
                onChange={(e) => setOtherInfo(e.target.value)}
                className="input"
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Username</label>
            <div className="control">
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Password</label>
            <div className="control">
              <input
                type="password"
                placeholder="Enter password (greater than 5)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Confirm Password</label>
            <div className="control">
              <input
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                required
              />
            </div>
          </div>

          <br />
          <button className="button is-success is-dark is-fullwidth" type="submit">
            Register
          </button>
        </form>

        {token && <p className="message is-primary message-header">Registered successfully! </p>}
      </div>
    </>
  );
};

export default Register;
