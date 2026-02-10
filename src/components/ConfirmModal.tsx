import { Modal } from "antd";
import type { FormPopupProps } from "../types/initialTypes";

export const ConfirmModal = ({
  open,
  onSubmit,
  onCancel,
  content,
  title,
}: FormPopupProps) => {
  return (
    <Modal
      title={title}
      centered
      open={open}
      onOk={onSubmit}
      onCancel={onCancel}
    >
      <p>{content}</p>
    </Modal>
  );
};
