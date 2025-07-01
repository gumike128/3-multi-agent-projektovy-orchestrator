import React, { createContext, useState, useContext, useMemo, useCallback, ReactNode } from 'react';
import type { ArchivedProject } from '@/types';

type ModalType = 'history' | 'settings' | 'archivedProject';

interface ModalProps {
    project?: ArchivedProject;
}

interface ModalContextType {
    openModal: (modalType: ModalType, props?: ModalProps) => void;
    closeModal: () => void;
    isModalOpen: boolean;
    activeModal: ModalType | null;
    modalProps: ModalProps;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeModal, setActiveModal] = useState<ModalType | null>(null);
    const [modalProps, setModalProps] = useState<ModalProps>({});

    const openModal = useCallback((modalType: ModalType, props: ModalProps = {}) => {
        setActiveModal(modalType);
        setModalProps(props);
    }, []);

    const closeModal = useCallback(() => {
        setActiveModal(null);
        setModalProps({});
    }, []);

    const value = useMemo(() => ({
        openModal,
        closeModal,
        isModalOpen: activeModal !== null,
        activeModal,
        modalProps,
    }), [openModal, closeModal, activeModal, modalProps]);

    return (
        <ModalContext.Provider value={value}>
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = (): ModalContextType => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};
