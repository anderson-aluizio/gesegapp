import { useState } from 'react';

export function useDialog() {
    const [visible, setVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const show = (title: string, desc: string) => {
        setTitle(title);
        setDescription(desc);
        setVisible(true);
    };

    const hide = () => {
        setVisible(false);
    };

    return {
        visible,
        title,
        description,
        show,
        hide,
    };
}
