const apiUrl = 'https://api.green-api.com';

export async function sendMessage(idInstance, apiTokenInstance, chatId, text) {
  const response = await fetch(
    `${apiUrl}/waInstance${idInstance.trim()}/sendMessage/${apiTokenInstance.trim()}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId,
        message: text,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(response.status);
  }

  return response.json();
}

export async function getStateInstance(idInstance, apiTokenInstance) {
  const response = await fetch(
    `${apiUrl}/waInstance${idInstance.trim()}/getStateInstance/${apiTokenInstance.trim()}`,
  );

  if (!response.ok) {
    throw new Error(`Ошибка запроса: ${response.status}`);
  }

  return response.json();
}

export async function checkAccount(idInstance, apiTokenInstance, phone) {
  const response = await fetch(
    `${apiUrl}/waInstance${idInstance.trim()}/checkAccount/${apiTokenInstance.trim()}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: Number(phone),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(response.status);
  }

  return response.json();
}

export async function receiveNotification(
  idInstance,
  apiTokenInstance,
  signal,
) {
  const response = await fetch(
    `${apiUrl}/waInstance${idInstance.trim()}/receiveNotification/${apiTokenInstance.trim()}?receiveTimeout=5`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(`Ошибка: ${response.status}`);
  }

  let notification;

  const raw = await response.text();

  if (raw.trim()) {
    notification = JSON.parse(raw);
  } else {
    notification = null;
  }

  return notification;
}

export async function deleteNotification(
  idInstance,
  apiTokenInstance,
  receiptId,
  signal,
) {
  const response = await fetch(
    `${apiUrl}/waInstance${idInstance.trim()}/deleteNotification/${apiTokenInstance.trim()}/${receiptId}`,
    {
      method: 'DELETE',
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(response.status);
  }
}
