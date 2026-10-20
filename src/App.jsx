import { useState } from 'react';
import './App.css';
import { nanoid } from 'nanoid';

function App() {
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  function handleLogin(event) {
    event.preventDefault();

    if (idInstance.trim() && apiTokenInstance.trim()) {
      setIsLoggedIn(true);
    }
  }

  function handleCreateChat(event) {
    event.preventDefault();

    const phone = phoneNumber.trim();

    if (phone && phone !== recipient) {
      setRecipient(phone);
      setMessages([]);
      setMessage('');
    }
  }

  function handleSendMessage(event) {
    event.preventDefault();

    if (!message.trim() || !recipient) {
      return;
    }

    const newMessage = {
      id: nanoid(),
      text: message.trim(),
    };

    setMessages((prev) => [...prev, newMessage]);

    setMessage('');
  }

  return isLoggedIn ? (
    <main>
      <h1>Чат</h1>
      <form onSubmit={handleCreateChat}>
        <label>
          Номер получателя
          <input
            type="tel"
            placeholder="+79999999999"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </label>

        <button type="submit">Создать чат</button>
      </form>

      {recipient ? (
        <section>
          <ul>
            {messages.map((item) => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ul>

          <form onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Введите сообщение"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <button type="submit">Отправить</button>
          </form>
        </section>
      ) : null}
    </main>
  ) : (
    <div className="main">
      <form className="login-form">
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
        <button type="button" onClick={handleLogin}>
          Войти
        </button>
      </form>
    </div>
  );
}

export default App;
