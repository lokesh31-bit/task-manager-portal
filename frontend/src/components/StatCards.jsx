import React from 'react';

const StatCards = ({ stats }) => {
  const { total = 0, pending = 0, inProgress = 0, completed = 0 } = stats || {};

  const statItems = [
    {
      title: 'Total Tasks',
      value: total,
      color: 'var(--accent-primary)',
      bg: 'rgba(99, 102, 241, 0.1)',
      icon: '📊'
    },
    {
      title: 'Pending',
      value: pending,
      color: 'var(--warning)',
      bg: 'rgba(245, 158, 11, 0.1)',
      icon: '⏳'
    },
    {
      title: 'In Progress',
      value: inProgress,
      color: 'var(--info)',
      bg: 'rgba(2, 132, 199, 0.1)',
      icon: '⚙️'
    },
    {
      title: 'Completed',
      value: completed,
      color: 'var(--success)',
      bg: 'rgba(16, 185, 129, 0.1)',
      icon: '✅'
    }
  ];

  return (
    <div className="stats-grid">
      {statItems.map((item, index) => (
        <div key={index} className="card stat-card" style={{ borderLeft: `4px solid ${item.color}` }}>
          <div className="stat-icon" style={{ backgroundColor: item.bg, color: item.color }}>
            {item.icon}
          </div>
          <div className="stat-details">
            <h3>{item.title}</h3>
            <div className="stat-number">{item.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatCards;
