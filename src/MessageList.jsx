function MessageList({ messages }) {
  return (
    <ul>
      {messages.map((item) => (
        <li key={item.id} className={item.direction}>
          {item.direction === 'outgoing' ? 'Вы: ' : 'Собеседник: '}
          {item.text}
        </li>
      ))}
    </ul>
  );
}

export default MessageList;
