import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  Trash2, 
  Download, 
  FileText, 
  Plus, 
  File, 
  Loader2, 
  Building2, 
  Mail, 
  Phone, 
  FileSpreadsheet, 
  FileImage, 
  FileArchive, 
  FolderOpen,
  Notebook
} from 'lucide-react';
import { api } from '../lib/api';
import './ClientRepositoryPage.css';

interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  logo_url?: string;
  created_at: string;
}

interface ClientFile {
  id: string;
  name: string;
  description?: string;
  file_url: string;
  created_at: string;
}

interface ClientNote {
  id: string;
  name: string;
  content: string;
  created_at: string;
}

export const ClientRepositoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Loading & Error States
  const [client, setClient] = useState<Client | null>(null);
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tabs State
  const [activeTab, setActiveTab] = useState<'files' | 'notes'>('files');
  
  // Form States
  const [fileName, setFileName] = useState('');
  const [fileDescription, setFileDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [noteName, setNoteName] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch Client details
      const clientRes = await api.get(`/api/clients/${id}`);
      setClient(clientRes.data);
      
      // Fetch Client Files
      const filesRes = await api.get(`/api/clients/${id}/files`);
      setFiles(filesRes.data);
      
      // Fetch Client Notes
      const notesRes = await api.get(`/api/clients/${id}/notes`);
      setNotes(notesRes.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Erro ao carregar dados do repositório.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Auto fill file name if empty
      if (!fileName) {
        setFileName(file.name.replace(/\.[^/.]+$/, "")); // remove extension
      }
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Selecione um arquivo para enviar.');
      return;
    }
    if (!fileName.trim()) {
      alert('Digite um nome para o arquivo.');
      return;
    }

    try {
      setUploading(true);
      
      // 1. Upload file to backend server
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const uploadRes = await api.post('/api/upload?type=client_files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const fileUrl = uploadRes.data.url;
      
      // 2. Save file metadata in DB
      await api.post(`/api/clients/${id}/files`, {
        name: fileName.trim(),
        description: fileDescription.trim(),
        file_url: fileUrl
      });
      
      // 3. Reset form and reload
      setFileName('');
      setFileDescription('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Reload files list
      const filesRes = await api.get(`/api/clients/${id}/files`);
      setFiles(filesRes.data);
      
      alert('Arquivo enviado com sucesso!');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao enviar arquivo: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (fileId: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o arquivo "${name}"?`)) return;
    try {
      await api.delete(`/api/clients/files/${fileId}`);
      setFiles(files.filter(f => f.id !== fileId));
    } catch (err: any) {
      alert('Erro ao excluir arquivo: ' + err.message);
    }
  };

  const handleNoteSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteName.trim() || !noteContent.trim()) {
      alert('Preencha o nome e o texto da nota.');
      return;
    }

    try {
      setSavingNote(true);
      
      await api.post(`/api/clients/${id}/notes`, {
        name: noteName.trim(),
        content: noteContent.trim()
      });
      
      setNoteName('');
      setNoteContent('');
      
      // Reload notes list
      const notesRes = await api.get(`/api/clients/${id}/notes`);
      setNotes(notesRes.data);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar nota: ' + (err.response?.data?.error || err.message));
    } finally {
      setSavingNote(false);
    }
  };

  const handleNoteDelete = async (noteId: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a nota "${name}"?`)) return;
    try {
      await api.delete(`/api/clients/notes/${noteId}`);
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (err: any) {
      alert('Erro ao excluir nota: ' + err.message);
    }
  };

  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (!ext) return <File size={28} className="file-icon-default" />;
    
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
      return <FileImage size={28} className="file-icon-image" />;
    }
    if (['pdf'].includes(ext)) {
      return <FileText size={28} className="file-icon-pdf" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return <FileSpreadsheet size={28} className="file-icon-sheet" />;
    }
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
      return <FileArchive size={28} className="file-icon-archive" />;
    }
    return <File size={28} className="file-icon-default" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFullFileUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    // Base URL is http://localhost:3000 in dev or empty in prod
    const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:3000';
    return `${baseUrl}${url}`;
  };

  if (loading) {
    return (
      <div className="client-repo-loading">
        <Loader2 className="animate-spin" size={48} />
        <p>Carregando repositório do cliente...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="client-repo-error animate-fade-in">
        <h2>Ops! Ocorreu um problema</h2>
        <p>{error || 'Cliente não encontrado.'}</p>
        <button className="back-btn-error" onClick={() => navigate('/clients')}>
          <ArrowLeft size={18} /> Voltar para Clientes
        </button>
      </div>
    );
  }

  return (
    <div className="client-repo-page animate-fade-in">
      {/* Back Header & Breadcrumbs */}
      <div className="repo-header-nav">
        <button className="back-btn" onClick={() => window.close()}>
          <ArrowLeft size={18} />
          Fechar Repositório
        </button>
        <div className="repo-breadcrumbs">
          <span onClick={() => navigate('/clients')}>Clientes</span>
          <span className="separator">/</span>
          <span className="current">{client.company}</span>
          <span className="separator">/</span>
          <span className="current-sub">Repositório</span>
        </div>
      </div>

      {/* Client Mini Profile */}
      <div className="client-profile-card">
        <div className="client-info-main">
          <div className="client-logo-large">
            {client.logo_url ? (
              <img src={client.logo_url} alt={client.company} />
            ) : (
              <Building2 size={36} />
            )}
          </div>
          <div className="client-text">
            <h2>{client.company}</h2>
            <p className="client-responsible">Responsável: <strong>{client.name}</strong></p>
          </div>
        </div>
        
        <div className="client-contact-details">
          {client.email && (
            <div className="contact-pill">
              <Mail size={14} />
              <span>{client.email}</span>
            </div>
          )}
          {client.phone && (
            <div className="contact-pill">
              <Phone size={14} />
              <span>{client.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="repo-tabs">
        <button 
          className={`tab-item ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          <FolderOpen size={18} />
          Arquivos
          <span className="tab-badge">{files.length}</span>
        </button>
        <button 
          className={`tab-item ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <Notebook size={18} />
          Notas
          <span className="tab-badge">{notes.length}</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="repo-content-grid">
        {activeTab === 'files' ? (
          <div className="files-section-grid">
            {/* Upload File Form */}
            <div className="form-card upload-form-card">
              <h3>Enviar Novo Arquivo</h3>
              <form onSubmit={handleFileUpload} className="repo-form">
                <div className="form-group">
                  <label htmlFor="fileName">Nome do Arquivo *</label>
                  <input 
                    type="text" 
                    id="fileName"
                    placeholder="Ex: Contrato Assinado" 
                    value={fileName}
                    onChange={e => setFileName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="fileDescription">Descrição</label>
                  <textarea 
                    id="fileDescription"
                    placeholder="Breve descrição sobre o arquivo..."
                    value={fileDescription}
                    onChange={e => setFileDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label>Arquivo *</label>
                  <div 
                    className={`file-dropzone ${selectedFile ? 'has-file' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                      required
                    />
                    <Upload size={24} className="upload-icon" />
                    {selectedFile ? (
                      <div className="selected-file-details">
                        <span className="file-name">{selectedFile.name}</span>
                        <span className="file-size">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    ) : (
                      <span>Clique para selecionar ou solte um arquivo aqui</span>
                    )}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="submit-btn" 
                  disabled={uploading || !selectedFile}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Enviar Arquivo
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Files List */}
            <div className="items-list-card">
              <div className="list-header">
                <h3>Arquivos do Cliente</h3>
              </div>
              
              {files.length === 0 ? (
                <div className="empty-state">
                  <FolderOpen size={40} />
                  <p>Nenhum arquivo enviado ainda.</p>
                  <span>Use o formulário ao lado para fazer o upload do primeiro documento.</span>
                </div>
              ) : (
                <div className="files-grid">
                  {files.map(file => (
                    <div key={file.id} className="file-item-card">
                      <div className="file-item-icon">
                        {getFileIcon(file.file_url)}
                      </div>
                      
                      <div className="file-item-info">
                        <h4>{file.name}</h4>
                        {file.description && <p className="file-desc">{file.description}</p>}
                        <span className="file-date">{formatDate(file.created_at)}</span>
                      </div>

                      <div className="file-item-actions">
                        <a 
                          href={getFullFileUrl(file.file_url)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="file-action-btn download"
                          title="Visualizar / Baixar"
                        >
                          <Download size={16} />
                        </a>
                        <button 
                          onClick={() => handleFileDelete(file.id, file.name)}
                          className="file-action-btn delete"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="notes-section-grid">
            {/* Create Note Form */}
            <div className="form-card note-form-card">
              <h3>Incluir Nova Nota</h3>
              <form onSubmit={handleNoteSave} className="repo-form">
                <div className="form-group">
                  <label htmlFor="noteName">Nome da Nota *</label>
                  <input 
                    type="text" 
                    id="noteName"
                    placeholder="Ex: Ata de Reunião" 
                    value={noteName}
                    onChange={e => setNoteName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="noteContent">Texto *</label>
                  <textarea 
                    id="noteContent"
                    placeholder="Escreva a anotação aqui..."
                    value={noteContent}
                    onChange={e => setNoteContent(e.target.value)}
                    rows={8}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="submit-btn" 
                  disabled={savingNote}
                >
                  {savingNote ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Salvar Nota
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Notes List */}
            <div className="items-list-card">
              <div className="list-header">
                <h3>Notas e Anotações</h3>
              </div>
              
              {notes.length === 0 ? (
                <div className="empty-state">
                  <Notebook size={40} />
                  <p>Nenhuma nota adicionada ainda.</p>
                  <span>Use o formulário ao lado para criar a primeira anotação rápida.</span>
                </div>
              ) : (
                <div className="notes-grid">
                  {notes.map(note => (
                    <div key={note.id} className="note-item-card">
                      <div className="note-card-header">
                        <h4>{note.name}</h4>
                        <button 
                          onClick={() => handleNoteDelete(note.id, note.name)}
                          className="note-delete-btn"
                          title="Excluir Nota"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="note-card-body">
                        <p>{note.content}</p>
                      </div>
                      <div className="note-card-footer">
                        <span>{formatDate(note.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
