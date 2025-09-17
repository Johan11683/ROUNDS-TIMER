import React from "react";

export const FullscreenButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <button
      type="button"
      className="secondary btn-icon"
      onClick={onClick}
      title="Passer en plein écran"
      aria-label="Passer en plein écran"
    >
      ⤢
    </button>
  );
};
