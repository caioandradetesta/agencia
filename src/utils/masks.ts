/**
 * Aplica máscara de telefone (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export const maskPhone = (value: string) => {
  if (!value) return '';
  
  // Remove tudo o que não é dígito
  const digits = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const limited = digits.slice(0, 11);
  
  // Aplica a máscara
  if (limited.length <= 10) {
    return limited
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  } else {
    return limited
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }
};
