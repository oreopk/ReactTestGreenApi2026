import { useState, useEffect } from 'react';
import './App.css';
import { nanoid } from 'nanoid';
import { IMaskInput } from 'react-imask';
import MessageList from './MessageList';
import {
  sendMessage,
  getStateInstance,
  checkAccount,
  receiveNotification,
  deleteNotification,
} from './api';

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

  useEffect(() => {
    if (!isLoggedIn || !chatId) {
      return;
    }

    const controller = new AbortController();

    let timer;

    async function receiveMessages() {
      let delay = 1000;

      try {
        const notification = await receiveNotification(
          idInstance,
          apiTokenInstance,
          controller.signal,
        );

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

        await deleteNotification(
          idInstance,
          apiTokenInstance,
          receiptId,
          controller.signal,
        );

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
  }, [isLoggedIn, chatId, idInstance, apiTokenInstance]);

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError('');

    if (!idInstance.trim() || !apiTokenInstance.trim()) {
      setLoginError('Заполни оба поля');
      return;
    }

    setIsLoading(true);

    try {
      const data = await getStateInstance(idInstance, apiTokenInstance);

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
      const data = await checkAccount(idInstance, apiTokenInstance, phone);

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
      const data = await sendMessage(
        idInstance,
        apiTokenInstance,
        chatId,
        text,
      );

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

  function handleBack() {
    setIsLoggedIn(false);

    setIdInstance('');
    setApiTokenInstance('');
    setPhoneNumber('');
    setRecipient('');
    setChatId('');
    setMessage('');
    setMessages([]);

    setLoginError('');
    setChatError('');
    setSendError('');
    setReceiveError('');
  }

  return isLoggedIn ? (
    <main>
      <div className="chat-header">
        <h1>Чат</h1>

        <button
          type="button"
          className="back-button"
          onClick={handleBack}
          disabled={isSending || isCreatingChat}
        >
          Сменить инстанс
        </button>
      </div>
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
          <MessageList messages={messages} />

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
        <div className="login-header">
          <h1>Вход в чат MAX</h1>
        </div>
        <label>
          idInstance
          <input
            type="text"
            name="idInstance"
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            disabled={isLoading}
          />
        </label>

        <label>
          apiTokenInstance
          <input
            type="password"
            name="apiTokenInstance"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            disabled={isLoading}
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
