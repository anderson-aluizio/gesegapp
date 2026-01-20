import { useState } from 'react';
import { ErrorDetails } from '@/components/ui/dialogs/ErrorDetailsDialog';

export function useErrorDialog() {
    const [visible, setVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);

    const show = (
        title: string,
        desc: string,
        error?: unknown,
        context?: Record<string, unknown>
    ) => {
        setTitle(title);
        setDescription(desc);

        if (error) {
            const details: ErrorDetails = {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                code: (error as { code?: string })?.code,
                context,
                timestamp: new Date().toISOString(),
            };
            setErrorDetails(details);
        } else {
            setErrorDetails(null);
        }

        setVisible(true);
    };

    const hide = () => {
        setVisible(false);
    };

    return {
        visible,
        title,
        description,
        errorDetails,
        show,
        hide,
    };
}
