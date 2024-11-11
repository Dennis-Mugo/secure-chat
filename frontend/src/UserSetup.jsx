import React, { useState } from 'react';
import "./App.css";

function UserSetup({ setUser }) {
  const [username, setUsername] = useState('');
  const [certificate, setCertificate] = useState('');
  const [certSignature, setCertSignature] = useState('');

  const handleRegister = async () => {
    try {
      const response = await fetch('http://localhost:3000/createClient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) throw new Error('Registration failed');
      
      const data = await response.json();
      setCertificate(data.certificate);
      setCertSignature(data.certSignature);
      setUser({ username, certificate: data.certificate });

      // Store the certificate and signature in local storage
      sessionStorage.setItem('userCertificate', JSON.stringify({
        username,
        certificate: data.certificate,
        certSignature: data.certSignature,
      }));

      alert('User registered successfully.');
    } catch (error) {
      alert(error.message);
    }
  };

  

  return (
    <div className='user_setup_container'>
      <h2>User Setup</h2>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter username"
      />
      <button className='margin_top_bottom' onClick={handleRegister}>Register</button>
      
    </div>
  );
}

export default UserSetup;