# Real-Time Chat Application Frontend

A modern, responsive, and beautifully designed frontend for a real-time chat application. Built with React and styled with Tailwind CSS, this project provides a premium user experience for joining chat rooms and conversing with others.

![Chat App Demo](./demo.png)
*(Note: You can replace `demo.png` with a screenshot of your application)*

## 📋 About The Project

This repository contains the complete frontend code for a room-based chat application. It's designed to connect to a WebSocket backend server to provide seamless, real-time communication. The interface is crafted with a focus on a minimal, dark-themed aesthetic, ensuring a great user experience out of the box.

### ✨ Features

* **Real-time Messaging:** Instantly send and receive messages using WebSockets.
* **Dynamic Rooms:** Join existing rooms or create new ones on the fly using a simple Room ID.
* **Premium Dark UI:** A sleek, modern interface styled with Tailwind CSS for a polished look and feel.
* **System Notifications:** Receive in-chat notifications for events like users joining.
* **Live Connection Status:** A visual indicator shows whether you are connected, disconnected, or have encountered an error.
* **Auto-Scrolling:** The chat view automatically scrolls to the latest message.
* **Responsive Design:** Looks great on both desktop and mobile devices.

***

### 🚀 Built With

* **[React.js](https://reactjs.org/)** - A JavaScript library for building user interfaces.
* **[Tailwind CSS](https://tailwindcss.com/)** - A utility-first CSS framework for rapid UI development.
* **[React Icons](https://react-icons.github.io/react-icons/)** - A library of popular icon packs for React projects.

***

## 🏁 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You need to have Node.js and npm (or yarn) installed on your machine.
* **npm**
    ```sh
    npm install npm@latest -g
    ```

### Installation

1.  **Clone the repository**
    ```sh
    git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
    ```
2.  **Navigate to the project directory**
    ```sh
    cd your-repo-name
    ```
3.  **Install NPM packages**
    ```sh
    npm install
    ```

***

## 🔌 Backend Requirement

This is a **frontend-only** application. To make it fully functional, you must have a WebSocket server running locally that the client can connect to.

* **Connection URL:** The client is hardcoded to connect to `ws://localhost:8080`.
* **Message Protocol:** The server must handle a specific JSON-based message format.

### Client-to-Server Messages

The client sends messages with a `type` and a `payload`.

1.  **Join Room:** Sent when a user joins a chat room.
    ```json
    {
      "type": "join",
      "payload": {
        "roomId": "your-room-id",
        "userName": "your-name"
      }
    }
    ```
2.  **Send Chat Message:** Sent when a user sends a message.
    ```json
    {
      "type": "chat",
      "payload": {
        "message": "Hello world!",
        "sender": "your-name"
      }
    }
    ```

### Server-to-Client Messages

The client expects to receive messages with a `type`.

1.  **System Message:** For notifications like users joining.
    ```json
    {
      "type": "system",
      "message": "Alice has joined the room."
    }
    ```
2.  **Chat Message:** For messages sent by other users.
    ```json
    {
      "type": "chat",
      "sender": "Alice",
      "message": "Hey everyone!",
      "timestamp": "..."
    }
    ```

***

## Usage

Once you have your backend server running, you can start the frontend React development server.

```sh
npm run dev