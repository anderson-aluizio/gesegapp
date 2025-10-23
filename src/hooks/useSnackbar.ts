import { useState } from 'react';

export type SnackbarType = 'success' | 'error' | 'info';

export function useSnackbar() {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState<SnackbarType>('info');

    const show = (msg: string, snackbarType: SnackbarType = 'info') => {
        setMessage(msg);
        setType(snackbarType);
        setVisible(true);
    };

    const hide = () => {
        setVisible(false);
    };

    return {
        visible,
        message,
        type,
        show,
        hide,
    };
}
