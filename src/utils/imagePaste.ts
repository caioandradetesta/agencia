import { api } from '../lib/api';

export const handleImagePaste = async (
  e: React.ClipboardEvent,
  uploadType: string,
  onImageUploaded: (url: string) => void
) => {
  const items = e.clipboardData?.items;
  if (!items) return;

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const file = items[i].getAsFile();
      if (!file) continue;

      // Se for uma imagem, impedimos o comportamento padrão de colar (que colaria dados binários ou lixo)
      e.preventDefault();

      const formData = new FormData();
      formData.append('file', file);

      try {
        // Mostra um feedback visual de carregamento se possível, mas aqui vamos focar na funcionalidade
        const response = await api.post(`/api/uploads?type=${uploadType}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (response.data.url) {
          onImageUploaded(response.data.url);
        }
      } catch (err) {
        console.error('Erro ao fazer upload da imagem colada:', err);
        alert('Erro ao processar imagem colada.');
      }
    }
  }
};

/**
 * Utilitário para inserir texto na posição do cursor em um HTMLTextAreaElement ou HTMLInputElement
 */
export const insertAtCursor = (element: HTMLTextAreaElement | HTMLInputElement, text: string) => {
  const start = element.selectionStart || 0;
  const end = element.selectionEnd || 0;
  const value = element.value;
  
  const newValue = value.substring(0, start) + text + value.substring(end);
  
  // Retorna o novo valor para que o estado do React possa ser atualizado
  return newValue;
};
