import React from 'react';
import { useModal } from '@/contexts/ModalContext';
import { useProject } from '@/contexts/ProjectContext';
import { Modal } from '@/components/Modal';
import { ProjectHistoryModal } from '@/components/ProjectHistoryModal';
import { ArchivedProjectViewModal } from '@/components/ArchivedProjectViewModal';
import { SettingsModal } from '@/components/SettingsModal';

export const ModalManager: React.FC = () => {
    const { activeModal, closeModal, modalProps } = useModal();
    const { archivedProjects, handleClearHistory } = useProject();

    if (!activeModal) {
        return null;
    }

    let modalContent: React.ReactNode = null;
    let ariaId = '';

    switch (activeModal) {
        case 'history':
            ariaId = 'project-history-modal-title';
            modalContent = <ProjectHistoryModal projects={archivedProjects} onClearHistory={handleClearHistory} />;
            break;
        case 'settings':
            ariaId = 'settings-modal-title';
            modalContent = <SettingsModal onClose={closeModal} />;
            break;
        case 'archivedProject':
            if (modalProps.project) {
                ariaId = `archived-project-title-${modalProps.project.id}`;
                modalContent = <ArchivedProjectViewModal project={modalProps.project} onClose={closeModal} />;
            }
            break;
        default:
            return null;
    }

    return (
        <Modal onClose={closeModal} ariaLabelledBy={ariaId}>
            {modalContent}
        </Modal>
    );
};
