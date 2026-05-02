# SnapLite - React Native Mobile App

SnapLite is a Snapchat-inspired mobile application built with React Native, Expo, Node.js, Express, and MongoDB. The project includes user authentication, friend requests, chat screens, media options, and a backend API connected to MongoDB.

The purpose of this project is to demonstrate full-stack mobile app development with a clean frontend, organized backend, authentication, and database integration.

## Tech Stack

Frontend: React Native, Expo, TypeScript  
Backend: Node.js, Express.js, MongoDB, Mongoose  
Authentication: JWT, bcrypt  
Environment: dotenv, CORS  

## Setup Instructions

Clone the repository:

```bash
git clone https://github.com/YOUR-USERNAME/SnapLite.git
cd SnapLite

Install frontend dependencies:

npm install

Install backend dependencies:

cd server
npm install

Create a .env file inside the server folder:

touch .env

Add the following values to server/.env:

PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

Start the backend server:

node index.js

Open another terminal and go to the main project folder:

cd SnapLite

Start the Expo app:

npx expo start

Run the app using Expo Go, iOS Simulator, or Android Emulator.

Local Backend URL

For simulator testing, the backend can usually run on:

http://localhost:5001

For testing on a real phone with Expo Go, use your computer's local IP address instead of localhost.

Example:

http://192.168.1.10:5001