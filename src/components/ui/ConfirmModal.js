import Modal from "./Modal";

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  eyebrow = "OFFICEFLOW SAYS",
  title,
  titleId = "confirm-modal-title",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow={eyebrow}
      title={title}
      titleId={titleId}
    >
      <p className="confirm-modal__message">{message}</p>
      <div className="form-actions confirm-modal__actions">
        <button
          type="button"
          className="text-button confirm-modal__cancel"
          onClick={onClose}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`primary-button${danger ? " confirm-modal__danger" : ""}`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmModal;
