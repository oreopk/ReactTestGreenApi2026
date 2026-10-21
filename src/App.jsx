import { useState, useEffect } from 'react';
import './App.css';
import { nanoid } from 'nanoid';
import { IMaskInput } from 'react-imask';

function App() {
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState('');
  const [chatError, setChatError] = useState('');
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [receiveError, setReceiveError] = useState('');

  const apiUrl = 'https://api.green-api.com';

  useEffect(() => {
    if (!isLoggedIn || !chatId) {
      return;
    }

    const controller = new AbortController();
    const baseUrl = `${apiUrl}/waInstance${idInstance.trim()}`;
    const token = apiTokenInstance.trim();

    let timer;

    async function receiveMessages() {
      let delay = 1000;

      try {
        const response = await fetch(
          `${baseUrl}/receiveNotification/${token}?receiveTimeout=5`,
          { signal: controller.signal },
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

        if (controller.signal.aborted) {
          return;
        }

        if (!notification) {
          setReceiveError('');
          return;
        }

        const { body, receiptId } = notification;

        const text =
          body.messageData?.textMessageData?.textMessage ??
          body.messageData?.extendedTextMessageData?.text;

        if (
          body.typeWebhook === 'incomingMessageReceived' &&
          String(body.senderData?.chatId) === String(chatId) &&
          typeof text === 'string'
        ) {
          const newMessage = {
            id: nanoid(),
            idMessage: body.idMessage,
            text,
            direction: 'incoming',
          };

          setMessages((prev) => {
            if (
              controller.signal.aborted ||
              prev.some((item) => item.idMessage === body.idMessage)
            ) {
              return prev;
            }

            return [...prev, newMessage];
          });
        }

        const deleteResponse = await fetch(
          `${baseUrl}/deleteNotification/${token}/${receiptId}`,
          {
            method: 'DELETE',
            signal: controller.signal,
          },
        );

        if (!deleteResponse.ok) {
          throw new Error(deleteResponse.status);
        }

        if (!controller.signal.aborted) {
          setReceiveError('');
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setReceiveError(error.message);
        delay = 3000;
      } finally {
        if (!controller.signal.aborted) {
          timer = setTimeout(receiveMessages, delay);
        }
      }
    }

    receiveMessages();

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [isLoggedIn, chatId, idInstance, apiTokenInstance, apiUrl]);

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError('');

    if (!idInstance.trim() || !apiTokenInstance.trim()) {
      setLoginError('Заполни оба поля');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${apiUrl}/waInstance${idInstance.trim()}/getStateInstance/${apiTokenInstance.trim()}`,
      );

      if (!response.ok) {
        throw new Error(`Ошибка запроса: ${response.status}`);
      }

      const data = await response.json();

      if (data.stateInstance !== 'authorized') {
        throw new Error('Нет инстанса');
      }

      setIsLoggedIn(true);
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateChat(event) {
    event.preventDefault();
    setChatError('');

    const phone = phoneNumber.replace(/[+\s()-]/g, '');

    if (!/^7\d{10}$/.test(phone)) {
      setChatError('Введите корректный номер');
      return;
    }

    if (phone === recipient || isCreatingChat || isSending) {
      return;
    }

    setIsCreatingChat(true);

    try {
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

      const data = await response.json();

      if (!data.exist || !data.chatId) {
        throw new Error('Получатель не найден');
      }

      setChatId(data.chatId);
      setRecipient(phone);
      setMessages([]);
      setMessage('');
      setSendError('');
    } catch (error) {
      setChatError(error.message);
    } finally {
      setIsCreatingChat(false);
    }
  }

  async function handleSendMessage(event) {
    event.preventDefault();

    const text = message.trim();

    if (!text || !chatId || isSending || isCreatingChat) {
      return;
    }

    setSendError('');
    setIsSending(true);

    try {
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

      const data = await response.json();

      const newMessage = {
        id: nanoid(),
        idMessage: data.idMessage,
        text,
        direction: 'outgoing',
      };

      setMessages((prev) => [...prev, newMessage]);
      setMessage('');
    } catch (error) {
      setSendError(error.message);
    } finally {
      setIsSending(false);
    }
  }

  return isLoggedIn ? (
    <main>
      <h1>Чат</h1>
      <form onSubmit={handleCreateChat}>
        <label>
          Номер получателя
          <IMaskInput
            mask="+{7}(000)000-00-00"
            placeholder="+79999999999"
            value={phoneNumber}
            unmask={true}
            onAccept={(value) => setPhoneNumber(value)}
          />
        </label>

        {chatError && <p style={{ color: 'red' }}>{chatError}</p>}

        <button type="submit" disabled={isCreatingChat || isSending}>
          {isCreatingChat ? 'Создание чата...' : 'Создать чат'}
        </button>
      </form>

      {recipient ? (
        <section>
          <p>Чат с {recipient}</p>
          <p>{receiveError}</p>
          <ul>
            {messages.map((item) => (
              <li key={item.id} style={{ whiteSpace: 'pre-wrap' }}>
                {item.direction === 'outgoing' ? 'Вы: ' : 'Собеседник: '}
                {item.text}
              </li>
            ))}
          </ul>

          <form onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Введите сообщение"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={4000}
              disabled={isSending || isCreatingChat}
            />

            <p>{sendError}</p>

            <button
              type="submit"
              disabled={isSending || isCreatingChat || !message.trim()}
            >
              {isSending ? 'Отправляем...' : 'Отправить'}
            </button>
          </form>
        </section>
      ) : null}
    </main>
  ) : (
    <div className="main">
      <form className="login-form" onSubmit={handleLogin}>
        <label>
          idInstance
          <input
            type="text"
            name="idInstance"
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
          />
        </label>

        <label>
          apiTokenInstance
          <input
            type="password"
            name="apiTokenInstance"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
          />
        </label>
        <p style={{ color: 'red' }}>{loginError}</p>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </div>
  );
}

export default App;
