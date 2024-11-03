const express = require("express");
const { MessengerClient } = require("./messenger");
const cors = require("cors");
const {
  generateEG,
  computeDH,
  decryptWithGCM,
  generateECDSA,
  signWithECDSA,
  HMACtoAESKey,
  bufferToString,
  govEncryptionDataStr,
  getJsonFile,
  writeToJsonFile,
} = require("./lib.js");
const { get } = require("node:http");
const { subtle } = require("node:crypto").webcrypto;
const app = express();

app.use(cors());
app.use(express.json());

// Placeholder for storing clients (in a real application, use a database)
const clients = {};

// Initialize keys (in practice, load from secure storage)
let caKeyPair;
let govKeyPair;

// Initialize the Certificate Authority and Government Keys
(async function initializeKeys() {
  caKeyPair = await generateECDSA(); // For certificate signing
  govKeyPair = await generateEG(); // Government key pair for encryption
})();

// Create a new client instance
app.post("/createClient", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).send({ error: "Username is required" });

  // Initialize MessengerClient with CA and government public keys
  const client = new MessengerClient(caKeyPair.pub, govKeyPair.pub);
  clients[username] = client;

  // Generate a certificate for the client
  const certificate = await client.generateCertificate(username);
  const certString = JSON.stringify(certificate);

  // Sign the certificate using the CA private key
  const certSignature = await signWithECDSA(caKeyPair.sec, certString);
  writeToJsonFile(`chats/${username}.json`, { messages: {} });
  res.status(201).send({
    certificate,
    certSignature: Buffer.from(certSignature).toString("base64"),
  });
});

// Receive a certificate from another user
app.post("/receiveCertificate", async (req, res) => {
  const { username, certificate, signature } = req.body;
  const client = clients[username];

  if (!client) return res.status(404).send({ error: "Client not found" });

  try {
    const certSignature = Buffer.from(signature, "base64");
    await client.receiveCertificate(certificate, certSignature);
    res.status(200).send({ message: "Certificate received and validated" });
  } catch (err) {
    console.log(err.message);
    res.status(400).send({ error: "Invalid certificate or signature" });
  }
});

// Send a message to another user
app.post("/sendMessage", async (req, res) => {
  const { senderUsername, receiverUsername, message } = req.body;
  const senderClient = clients[senderUsername];

  if (!senderClient) return res.status(404).send({ error: "Sender not found" });
  if (!clients[receiverUsername])
    return res.status(404).send({ error: "Receiver not found" });

  try {
    const [header, ciphertext] = await senderClient.sendMessage(
      receiverUsername,
      message
    );

    recipientMessages = getJsonFile(`chats/${receiverUsername}.json`);
    let messages = recipientMessages.messages[senderUsername] || [];
    messages.push({
      header,
      ciphertext: Buffer.from(ciphertext).toString("base64"),
    });
    recipientMessages.messages[senderUsername] = messages;

    writeToJsonFile(`chats/${receiverUsername}.json`, recipientMessages);

    res.status(200).send({
      header,
      ciphertext: Buffer.from(ciphertext).toString("base64"),
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).send({ error: "Failed to send message" });
  }
});

// Receive a message from another user
app.post("/receiveMessage", async (req, res) => {
  let { receiverUsername, senderUsername, header, ciphertext } = req.body;
  if (!header || !ciphertext) {
    let messages = getJsonFile(`chats/${receiverUsername}.json`);
    messages = messages.messages[senderUsername];
    header = messages[messages.length - 1].header;
    ciphertext = messages[messages.length - 1].ciphertext;
  }

  const receiverClient = clients[receiverUsername];

  if (!receiverClient)
    return res.status(404).send({ error: "Receiver not found" });
  if (!clients[senderUsername])
    return res.status(404).send({ error: "Sender not found" });

  try {
    const message = await receiverClient.receiveMessage(senderUsername, [
      header,
      Buffer.from(ciphertext, "base64"),
    ]);
    res.status(200).send({ message });
  } catch (err) {
    console.log(err);
    res.status(400).send({ error: "Failed to decrypt message" });
  }
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
