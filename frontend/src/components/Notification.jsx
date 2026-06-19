import React, { useEffect } from 'react';

const Notification = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="notification-container">
      <div className={`notification notification-${type}`}>
        <span>{message}</span>
      </div>
    </div>
  );
};

export default Notification;
