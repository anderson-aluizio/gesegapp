export const validateItemIsRespondido = (
    isInconforme: boolean,
    funcionariosFilled: boolean,
    isDescricaoRequired: boolean,
    isDescricaoFilled: boolean
): boolean => {
    if (!isInconforme) return true;
    if (!funcionariosFilled) return false;
    if (isDescricaoRequired && !isDescricaoFilled) return false;
    return true;
};
export default validateItemIsRespondido;
