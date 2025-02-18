# Hobby Matcher
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
# SoulMagle - AI-Enabled Hobby Matcher

SoulMagle is an AI-driven platform designed to connect people with similar interests and hobbies for video calls. The platform uses advanced algorithms and a vector database to match users based on their shared preferences. With a modern, interactive React frontend and MongoDB as the primary database, SoulMagle delivers a seamless and engaging user experience.

### Demo
Link to demo video or hosted platform if available.

### Features
- **User Matching:** AI-powered matching algorithm to find people with similar interests.
- **Video Calls:** Real-time video chat feature.
- **Profile Customization:** Users can create and personalize their profiles with their hobbies and interests.
- **Real-Time Notifications:** Get notified when a matching user is available for a call.
- **Easy to Use:** Simple and intuitive interface for both desktop and mobile users.

### Technologies Used
- **Frontend:**
  - React.js
  - React Router
  - Axios (for API calls)
  - Tailwind CSS (or any other styling framework)

- **Backend:**
  - Node.js
  - Express.js
  - MongoDB (for user data and interactions)
  - Vector Database (used for storing and matching user preferences and interests)

- **Others:**
  - WebRTC (for video calls)
  - JWT (for authentication)
  - WebSockets (for real-time communication)

### How it Works
1. **User Profile Creation:** Users create their profile by listing their hobbies, interests, and other preferences.
2. **Vector Matching:** User preferences are transformed into vectors using NLP models. These vectors are stored in the vector database, enabling efficient similarity search.
3. **Finding Matches:** The backend fetches the closest matches by comparing vector data and AI-powered algorithms.
4. **Real-Time Video Chat:** Once a match is found, users can start a video call powered by WebRTC.
5. **MongoDB Database:** Stores user profiles, preferences, and interactions.

### Setup & Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Charu-sarswat/Hobby-matcher.git
   cd Hobby-matcher
 
 video  :https://drive.google.com/file/d/1ppV0zbi452hyZbgmRUR7XKa4pV53jnEd/view?usp=drive_link