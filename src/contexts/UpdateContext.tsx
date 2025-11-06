import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { UpdateModal } from '@/components/UpdateModal';
import type { UpdateInfo } from '@/services/updateChecker';
import { registerUpdateModalHandler } from '@/utils/apiErrorHandler';

interface UpdateContextType {
    showUpdateModal: (updateInfo?: UpdateInfo) => void;
    hideUpdateModal: () => void;
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

interface UpdateProviderProps {
    children: ReactNode;
}

/**
 * Provider component that manages the app update modal.
 * Place this at the root of your app to handle forced updates globally.
 */
export const UpdateProvider: React.FC<UpdateProviderProps> = ({ children }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | undefined>(undefined);

    const showUpdateModal = useCallback((info?: UpdateInfo) => {
        setUpdateInfo(info);
        setModalVisible(true);
    }, []);

    const hideUpdateModal = useCallback(() => {
        setModalVisible(false);
        setUpdateInfo(undefined);
    }, []);

    useEffect(() => {
        registerUpdateModalHandler(showUpdateModal);
    }, [showUpdateModal]);

    return (
        <UpdateContext.Provider value={{ showUpdateModal, hideUpdateModal }}>
            {children}
            <UpdateModal visible={modalVisible} updateInfo={updateInfo} />
        </UpdateContext.Provider>
    );
};

/**
 * Hook to access update modal functions.
 * Use this to manually trigger the update modal if needed.
 */
export const useUpdate = (): UpdateContextType => {
    const context = useContext(UpdateContext);
    if (!context) {
        throw new Error('useUpdate must be used within an UpdateProvider');
    }
    return context;
};
