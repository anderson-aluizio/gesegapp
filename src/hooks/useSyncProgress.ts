import { useState } from 'react';

export function useSyncProgress() {
    const [visible, setVisible] = useState(false);
    const [progress, setProgress] = useState<string[]>([]);
    const [percentage, setPercentage] = useState(0);
    const [currentStep, setCurrentStep] = useState('');

    const show = () => {
        setVisible(true);
        setProgress([]);
        setPercentage(0);
        setCurrentStep('');
    };

    const hide = () => {
        setVisible(false);
        setProgress([]);
        setPercentage(0);
        setCurrentStep('');
    };

    const addProgress = (message: string) => {
        setProgress(prev => [...prev, message]);
    };

    const updateProgress = (step: string, percent: number) => {
        setCurrentStep(step);
        setPercentage(percent);
    };

    return {
        visible,
        progress,
        percentage,
        currentStep,
        show,
        hide,
        addProgress,
        updateProgress,
    };
}
