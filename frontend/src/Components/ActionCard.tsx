import React from 'react';

function ActionCard({ actionKey, actionData }) {
  const iconName = actionData.icon;

  return (
    <div className="action-card">
      <div className="action-icon">
        <i className={`fas fa-${iconName}`} color={actionData.color || "#383838"}></i>
      </div>

      <h3 className="action-title">{actionKey.replace(/_/g, ' ')}</h3>

      <p className="action-description">{actionData.action}</p>
    </div>
  );
}

export default ActionCard;
