import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
    children: React.ReactNode;
    onClose: () => void;
    ariaLabelledBy: string;
}

export const Modal: React.FC<ModalProps> = ({ children, onClose, ariaLabelledBy }) => {
    const modalRoot = document.getElementById('modal-root');

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    if (!modalRoot) return null;

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4 print:hidden"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby={ariaLabelledBy}
        >
            <div onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>,
        modalRoot
    );
};
