import React, { useState } from 'react';
import UserSetup from './UserSetup';
import Chat from './Chat';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  return (
    <div className="div_center">
      <div className='container'>
      <h1 className='heading'>Simple Chat App</h1>
      {user ? (
        <Chat user={user} />
      ) : (
        <UserSetup setUser={setUser} />
      )}
      </div>
    </div>
  );
}

export default App;