import React, { useState, useEffect } from 'react';

function Chat() {
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [receivedMessage, setReceivedMessage] = useState('');
  const [user, setUser] = useState(null);

  // Load the user data from localStorage when the component mounts
  useEffect(() => {
    const storedUserData = JSON.parse(sessionStorage.getItem('userCertificate'));
    if (storedUserData) {
      setUser(storedUserData);
    } else {
      alert("User data not found. Please sign up first.");
    }
  }, []);

  const handleReceiveCertificate = async () => {
    const receiverUsername = prompt("Enter the certificate's username:");
    try {
      const storedData = JSON.parse(sessionStorage.getItem('userCertificate'));
      let response = await fetch('http://localhost:3000/receiveCertificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: receiverUsername,
          certificate: storedData.certificate,
          signature: storedData.certSignature,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to add certificate');
      response = await response.json();
      alert("Certificate received and validated.");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSendMessage = async () => {
    if (!user) return alert("User data not available.");
    try {
      const response = await fetch('http://localhost:3000/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderUsername: user.username,
          receiverUsername: recipient,
          message,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      
      alert('Message sent!');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleReceiveMessage = async () => {
    if (!user) return alert("User data not available.");
    let receiveMessageFrom = prompt("Who do you want to receive a message from?");

    try {
      const response = await fetch('http://localhost:3000/receiveMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverUsername: user.username,
          senderUsername: receiveMessageFrom,
        }),
      });

      if (!response.ok) throw new Error('Failed to receive message');
      
      const data = await response.json();
      setReceivedMessage(data.message);
      alert('Message received successfully.');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className='chat_container'>
        <h2>Hello, {user?.username}</h2>
        <button onClick={handleReceiveCertificate}>Add another user's certificate</button>
        
      <h2>Chat with {recipient || '...'}</h2>
      <input
        type="text"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="Enter recipient username"
      />
      <br />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter message"
      />
      
      <br />
      <button onClick={handleSendMessage}>Send Message</button>
      <br />
      <hr style={{width: "90%", height: "0.01px", marginBottom: "20px"}} />
      <button onClick={handleReceiveMessage} style={{marginBottom: "15px"}}>Receive Message</button>
      {receivedMessage && (
        <div style={{width: "75%"}}>
          <h3 style={{textAlign: "center"}}>Received Message:</h3>
          <p style={{textAlign: "center", textJustify: "justify"}}>{receivedMessage}</p>
        </div>
      )}
    </div>
  );
}

export default Chat;
