import { useState } from 'react';

export function useDialog() {
    const [visible, setVisible] = useState(false);
    const [description, setDescription] = useState('');

    const show = (desc: string) => {
        setDescription(desc);
        setVisible(true);
    };

    const hide = () => {
        setVisible(false);
    };

    return {
        visible,
        description,
        show,
        hide,
    };
}
