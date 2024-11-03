const baseUrl = "http://localhost:3000";
const createClient = async (username) => {
  let res = await fetch(`${baseUrl}/createClient`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });
  res = await res.json();
  return res;
};

const receiveCertificate = async (username, certificate, signature) => {
  let res = await fetch(`${baseUrl}/receiveCertificate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, certificate, signature }),
  });
  res = await res.json();
  return res;
};

const sendMessage = async (senderUsername, receiverUsername, message) => {
  let res = await fetch(`${baseUrl}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ senderUsername, receiverUsername, message }),
  });
  res = await res.json();
  return res;
};

const receiveMessage = async (
  receiverUsername,
  senderUsername,
  header,
  ciphertext
) => {
  let res = await fetch(`${baseUrl}/receiveMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      receiverUsername,
      senderUsername,
      header,
      ciphertext,
    }),
  });
  res = await res.json();
  return res;
};

(async () => {
  try {
    const dennis = await createClient("Dennis");
    const otieno = await createClient("Otieno");
    let res = await receiveCertificate(
      "Dennis",
      otieno.certificate,
      otieno.certSignature
    );
    console.log(res);

    res = await receiveCertificate(
      "Otieno",
      dennis.certificate,
      dennis.certSignature
    );
    console.log(res);

    res = await sendMessage("Dennis", "Otieno", "Hello, Otieno!");
    console.log(res);

    res = await receiveMessage("Otieno", "Dennis", res.header, res.ciphertext);
    console.log(res);
  } catch (err) {
    console.error(err);
  }
})();
