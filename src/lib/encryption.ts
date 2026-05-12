import CryptoJS from "crypto-js";

/**
 * Encryption utility for secure messaging
 * Uses AES-256 encryption with a conversation-specific key
 */

// Generate a conversation-specific encryption key
export function generateConversationKey(conversationId: string): string {
  // In production, this should be stored securely and unique per conversation
  // For now, we'll derive it from the conversation ID with a secret salt
  const SECRET_SALT =
    process.env.NEXT_PUBLIC_ENCRYPTION_SALT ||
    "careconnect-secure-messaging-2025";
  return CryptoJS.SHA256(conversationId + SECRET_SALT).toString();
}

// Encrypt message content
export function encryptMessage(
  content: string,
  conversationId: string
): string {
  try {
    const key = generateConversationKey(conversationId);
    const encrypted = CryptoJS.AES.encrypt(content, key).toString();
    return encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt message");
  }
}

// Decrypt message content
export function decryptMessage(
  encryptedContent: string,
  conversationId: string
): string {
  try {
    const key = generateConversationKey(conversationId);
    const decrypted = CryptoJS.AES.decrypt(encryptedContent, key);
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);

    if (!plaintext) {
      throw new Error("Decryption failed - empty result");
    }

    return plaintext;
  } catch (error) {
    console.error("Decryption error:", error);
    // Return a fallback message instead of throwing
    return "[Unable to decrypt message]";
  }
}

// Check if content is encrypted (starts with AES encryption signature)
export function isEncrypted(content: string): boolean {
  // AES encrypted messages from crypto-js typically start with "U2FsdGVkX1" (base64 for "Salted__")
  return content.startsWith("U2FsdGVk");
}
