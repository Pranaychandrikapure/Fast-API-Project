import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const UserProfile = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatedEmail, setUpdatedEmail] = useState("");
  const [updatedOtherInfo, setUpdatedOtherInfo] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const navigate = useNavigate(); // Initialize useNavigate hook

  // Fetch the user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("token");

      const response = await fetch("http://127.0.0.1:8000/user/profile/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setError("Failed to fetch user profile");
        return;
      }

      const data = await response.json();
      setUserProfile(data);
      setUpdatedEmail(data.email);
      setUpdatedOtherInfo(data.other_info);
    };

    fetchUserProfile();
  }, []);

  // Handle profile edit submission
  const handleEditProfile = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://127.0.0.1:8000/users/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: updatedEmail,
          other_info: updatedOtherInfo,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedProfile = await response.json();
      setUserProfile(updatedProfile.user);
      setIsModalOpen(false);
    } catch (error) {
      setError(error.message);
    }
  };

  if (error) {
    return <div>{error}</div>;
  }

  if (!userProfile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="section">
      <div className="container">
        <div className="box">
          <h1 className="title is-3 has-text-centered">User Profile</h1>
          <div className="content">
            <p><strong>Username:</strong> {userProfile.username}</p>
            <p><strong>Email:</strong> {userProfile.email}</p>
            <p><strong>Other Info:</strong> {userProfile.other_info}</p>
          </div>
          <div className="field is-grouped is-grouped-right">
            <div className="control">
              <button
                className="button is-link"
                onClick={() => setIsModalOpen(true)}
              >
                Edit Profile
              </button>
            </div>
            <div className="control">
              <button
                className="button is-primary"
                onClick={() => navigate("/notes")} // Redirect to Notes page
              >
                View Notes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isModalOpen && (
        <div className="modal is-active">
          <div className="modal-background" onClick={() => setIsModalOpen(false)}></div>
          <div className="modal-content">
            <div className="box">
              <h2 className="title is-4">Edit Profile</h2>
              {error && <p className="has-text-danger">{error}</p>}
              <form onSubmit={handleEditProfile}>
                <div className="field">
                  <label className="label">Email</label>
                  <div className="control">
                    <input
                      type="email"
                      className="input"
                      value={updatedEmail}
                      onChange={(e) => setUpdatedEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="field">
                  <label className="label">Other Info</label>
                  <div className="control">
                    <textarea
                      className="textarea"
                      value={updatedOtherInfo}
                      onChange={(e) => setUpdatedOtherInfo(e.target.value)}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="field is-grouped is-grouped-right">
                  <div className="control">
                    <button type="submit" className="button is-link">
                      Save Changes
                    </button>
                  </div>
                  <div className="control">
                    <button
                      type="button"
                      className="button is-light"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
          <button className="modal-close is-large" aria-label="close" onClick={() => setIsModalOpen(false)}></button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
