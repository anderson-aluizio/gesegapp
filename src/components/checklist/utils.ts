export const validateItemIsRespondido = (
    isInconforme: boolean,
    funcionariosFilled: boolean,
    isDescricaoRequired: boolean,
    isDescricaoFilled: boolean,
    isFotoObrigatoria: boolean = false,
    fotoPath?: string,
    resposta?: string
): boolean => {
    if (!resposta || resposta.trim() === '') return false;

    if (isFotoObrigatoria && !fotoPath) return false;

    if (!isInconforme) return true;

    if (!funcionariosFilled) return false;

    if (isDescricaoRequired && !isDescricaoFilled) return false;

    return true;
};
export default validateItemIsRespondido;
