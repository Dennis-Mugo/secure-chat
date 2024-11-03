"use strict";

/** ******* Imports ********/

const { subtle } = require("crypto").webcrypto;
const fs = require("fs");

const {
  /* The following functions are all of the cryptographic
  primatives that you should need for this assignment.
  See lib.js for details on usage. */
  bufferToString,
  genRandomSalt,
  generateEG, // async
  computeDH, // async
  verifyWithECDSA, // async
  HMACtoAESKey, // async
  HMACtoHMACKey, // async
  HKDF, // async
  encryptWithGCM, // async
  decryptWithGCM,
  cryptoKeyToJSON, // async
  govEncryptionDataStr,
} = require("./lib");

/** ******* Implementation ********/

class MessengerClient {
  constructor(certAuthorityPublicKey, govPublicKey) {
    // the certificate authority DSA public key is used to
    // verify the authenticity and integrity of certificates
    // of other users (see handout and receiveCertificate)

    // you can store data as needed in these objects.
    // Feel free to modify their structure as you see fit.
    this.caPublicKey = certAuthorityPublicKey;
    this.govPublicKey = govPublicKey;
    this.conns = {}; // data for each active connection
    this.certs = {}; // certificates of other users
    this.EGKeyPair = {}; // keypair from generateCertificate
  }

  /**
   * Generate a certificate to be stored with the certificate authority.
   * The certificate must contain the field "username".
   *
   * Arguments:
   *   username: string
   *
   * Return Type: certificate object/dictionary
   */
  async generateCertificate(username) {
    // Generate an ElGamal key pair for the client
    this.EGKeyPair = await generateEG();
    const certificate = {
      username: username,
      pubKey: await cryptoKeyToJSON(this.EGKeyPair.pub),
    };
    return certificate;
  }

  /**
   * Receive and store another user's certificate.
   *
   * Arguments:
   *   certificate: certificate object/dictionary
   *   signature: ArrayBuffer
   *
   * Return Type: void
   */
  async receiveCertificate(certificate, signature) {
    // The signature will be on the output of stringifying the certificate
    // rather than on the certificate directly.
    const certString = JSON.stringify(certificate);
    const isValid = await verifyWithECDSA(
      this.caPublicKey,
      certString,
      signature
    );
    if (!isValid) {
      throw new Error(
        "Certificate validation failed. Possible tampering detected."
      );
    }
    this.certs[certificate.username] = certificate;
  }

  /**
   * Generate the message to be sent to another user.
   *
   * Arguments:
   *   name: string
   *   plaintext: string
   *
   * Return Type: Tuple of [dictionary, ArrayBuffer]
   */
  async sendMessage(name, plaintext) {
    const recipientCert = this.certs[name];
    if (!recipientCert) throw new Error("Recipient certificate not found");

    // Derive the shared secret using Diffie-Hellman
    const recipientPubKey = await subtle.importKey(
      "jwk",
      recipientCert.pubKey,
      { name: "ECDH", namedCurve: "P-384" },
      true,
      []
    );
    const sharedSecret = await computeDH(this.EGKeyPair.sec, recipientPubKey);

    // Derive AES key for encryption
    const aesKey = await HMACtoAESKey(sharedSecret, govEncryptionDataStr);
    const iv = genRandomSalt();

    // Ensure plaintext is in correct format for encryption
    const messageBuffer = Buffer.from(plaintext, "utf-8");

    // Encrypt the message with AES-GCM
    const ciphertext = await encryptWithGCM(aesKey, messageBuffer, iv);

    // Encrypt the session key with the government's public key
    const [vGov, cGov, ivGov] = await this.encryptForGovernment(aesKey);

    const header = {
      vGov,
      cGov,
      ivGov,
      receiverIV: iv,
      bufferIV: Buffer.from(iv).toString("base64"),
      messageID: Date.now(),
    };

    return [header, ciphertext];
  }

  /**
   * Decrypt a message received from another user.
   *
   * Arguments:
   *   name: string
   *   [header, ciphertext]: Tuple of [dictionary, ArrayBuffer]
   *
   * Return Type: string
   */
  async receiveMessage(name, [header, ciphertext]) {
    const senderCert = this.certs[name];
    if (!senderCert) throw new Error("Sender certificate not found");

    // Check if message has already been received using a unique identifier
    if (
      this.conns[name] &&
      this.conns[name].lastMessageID === header.messageID
    ) {
      throw new Error("Replay attack detected");
    }

    // If not a duplicate, process the message
    this.conns[name] = { lastMessageID: header.messageID };

    // Retrieve sender's public key and derive shared secret
    const senderPubKey = await subtle.importKey(
      "jwk",
      senderCert.pubKey,
      { name: "ECDH", namedCurve: "P-384" },
      true,
      []
    );
    const sharedSecret = await computeDH(this.EGKeyPair.sec, senderPubKey);

    // Derive AES key for decryption
    const aesKey = await HMACtoAESKey(sharedSecret, govEncryptionDataStr);
    let plaintext;
    try {
      plaintext = await decryptWithGCM(aesKey, ciphertext, header.receiverIV);
    } catch (err) {
      plaintext = await decryptWithGCM(
        aesKey,
        ciphertext,
        Buffer.from(header.bufferIV, "base64")
      );
    }

    return bufferToString(plaintext);
  }

  async encryptForGovernment(aesKey) {
    // Generate an ElGamal key pair for government encryption
    const govKeyPair = await generateEG();
    const govSharedSecret = await computeDH(govKeyPair.sec, this.govPublicKey);

    const govAESKey = await HMACtoAESKey(govSharedSecret, govEncryptionDataStr);
    const ivGov = genRandomSalt();
    const exportedKey = await subtle.exportKey("raw", aesKey);
    const cGov = await encryptWithGCM(govAESKey, exportedKey, ivGov);

    return [govKeyPair.pub, cGov, ivGov];
  }
}

module.exports = {
  MessengerClient,
};
