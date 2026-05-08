import { api } from './api';

/**
 * Faz upload de um arquivo para o backend local no Dokploy
 * @param bucket Nome da pasta (ex: logos, contracts)
 * @param file O arquivo em si
 */
export const uploadFile = async (bucket: string, file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post(`/api/upload?type=${bucket}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.url;
  } catch (error) {
    console.error('Erro no upload:', error);
    throw new Error('Falha ao enviar arquivo para o servidor.');
  }
};
