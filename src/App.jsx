import { useState } from 'react';
import './App.css';

function App() {
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');

  return (
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
        <button type="button">Войти</button>
      </form>
    </div>
  );
}

export default App;
