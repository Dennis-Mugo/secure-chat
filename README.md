# Secure-Chat

This is a simple encrypted chat application built using React and express JS. The application allows users to:
1. Sign up with a username, generating a certificate and signature.
2. Add other users’ certificates to enable secure communication.
3. Send and receive encrypted messages.

## Features

- **User Registration**: Generate a certificate and signature upon registration.
- **Certificate Management**: Store and retrieve certificates of other users for secure communication.
- **Messaging**: Send and receive encrypted messages between users.

## Project Setup

### Prerequisites

- **Node.js** (v14+ recommended)
- **npm** (comes with Node.js)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/chat-application-frontend.git
   ```

2. **Setup the backend**
    *** Navigate to the backend directory ***
    ```bash
    cd backend
    ```

    *** Install dependencies ***
    ```bash
    npm install
    ```

    *** Run the tests ***
    ```bash
    npm test
    ```

    *** Run the backend ***
    ```bash
    node main.js
    ```

3. **Setup the frontend**
    *** From the project root, navigate to the frontend directory ***
    ```bash
    cd frontend
    ```

    *** Install dependencies ***
    ```bash
    npm install
    ```

    *** Run the frontend ***
    ```bash
    npm run dev
    ```

## Usage Guide

### 1. Register a User
- Each user (e.g., Alice and Bob) needs to register individually by entering a unique username and clicking "Register."
- This will generate a certificate and signature for the user, which will be saved in `sessionStorage` for future use.

### 2. Exchange Certificates
- Both users need to exchange their certificates with each other before they can start sending messages.
- Each user can add the other's certificate by clicking "Add Another User's Certificate" and entering the other user's username.
  - For example, Alice would enter Bob's username, and Bob would enter Alice’s username.

### 3. Send a Message
- After both users have added each other's certificates, they can begin communicating.
- To send a message, go to the "Chat with ...", enter the recipient's username, and type a message.
- Click "Send Message" to send an encrypted message to the recipient.

### 4. Receive a Message
- To retrieve a message from another user, click "Receive Message" on the Chat page and specify the sender's username.
- The received message will be decrypted and displayed in the chat interface.




