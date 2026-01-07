'use client';

import { useEffect, useState } from 'react';

export default function SubscribeModal() {
  const [showModal, setShowModal] = useState(false);

  const handleCloseModal = () => {
    setShowModal(false);
    document.body.style.overflow = 'auto';
  };

  const handleModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        handleCloseModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  return (
    <>
      {/* Success Modal */}
      <div
        className={`modal ${showModal ? 'active' : ''}`}
        onClick={handleModalBackdropClick}
      >
        <div className="modal-content">
          <div className="modal-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="modal-title">You&apos;re subscribed!</h3>
          <p className="modal-text">
            Thank you for subscribing. You&apos;ll receive regulatory updates directly to your inbox.
          </p>
          <button className="modal-button" onClick={handleCloseModal}>
            Close
          </button>
        </div>
      </div>

      {/* Modal State Setter (exported for parent to use) */}
      <div style={{ display: 'none' }} id="modalTrigger" data-show={showModal.toString()} />
    </>
  );
}

export function useModal() {
  const [showModal, setShowModal] = useState(false);

  const openModal = () => {
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  return { showModal, openModal };
}
