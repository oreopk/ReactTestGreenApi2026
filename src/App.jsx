import { useState } from 'react';
import './App.css';

function App() {
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [recipient, setRecipient] = useState('');

  function handleLogin(event) {
    event.preventDefault();

    if (idInstance.trim() && apiTokenInstance.trim()) {
      setIsLoggedIn(true);
    }
  }

  function handleCreateChat(event) {
    event.preventDefault();

    if (phoneNumber.trim()) {
      setRecipient(phoneNumber.trim());
    }
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
