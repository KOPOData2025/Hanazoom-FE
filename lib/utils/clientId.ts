
export function generateClientId(): string {

  if (typeof window === "undefined") {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }


  const existingClientId = sessionStorage.getItem("hanazoom_client_id");
  if (existingClientId) {
    return existingClientId;
  }


  const clientId = `client_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;


  sessionStorage.setItem("hanazoom_client_id", clientId);

  return clientId;
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateConsistentUUID(input: string): string {

  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; 
  }


  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  const uuid = `${hex.substring(0, 8)}-${hex.substring(0, 4)}-4${hex.substring(
    1,
    4
  )}-8${hex.substring(2, 5)}-${hex.substring(0, 12)}`;

  return uuid;
}

export function generateSharedClientId(
  roomId: string,
  userType: "pb" | "client" = "client"
): string {

  if (typeof window === "undefined") {
    const shortRoomId = roomId.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4);
    const timestamp = Date.now().toString(36).substring(-4);
    const userPrefix = userType === "pb" ? "p" : "c";
    return `${userPrefix}${shortRoomId}${timestamp}`;
  }

  const key = `hanazoom_shared_client_${roomId}`;
  const existingClientId = sessionStorage.getItem(key);


  if (existingClientId && existingClientId.length <= 12) {
    return existingClientId;
  }



  const shortRoomId = roomId.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4);
  const timestamp = Date.now().toString(36).substring(-4); 
  const userPrefix = userType === "pb" ? "p" : "c";

  const sharedClientId = `${userPrefix}${shortRoomId}${timestamp}`;


  sessionStorage.setItem(key, sharedClientId);

  return sharedClientId;
}

export function getCurrentClientId(): string {
  return generateClientId();
}

export function resetClientId(): string {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("hanazoom_client_id");
  }
  return generateClientId();
}

export function isValidClientId(clientId: string): boolean {
  return clientId && clientId.startsWith("client_") && clientId.length > 20;
}

export function clearAllSharedClientIds(): void {
  if (typeof window === "undefined") return;

  const keys = Object.keys(sessionStorage);
  keys.forEach((key) => {
    if (key.startsWith("hanazoom_shared_client_")) {
      sessionStorage.removeItem(key);
    }
  });
}
