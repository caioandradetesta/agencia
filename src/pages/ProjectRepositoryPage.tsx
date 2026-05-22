import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  Trash2, 
  FileText, 
  Plus, 
  File, 
  Loader2, 
  Briefcase, 
  FolderOpen,
  Folder,
  Notebook,
  Lock,
  FileSpreadsheet,
  FileImage,
  FileArchive
} from 'lucide-react';
import { api, getFullUrl } from '../lib/api';
import './ProjectRepositoryPage.css';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  client_name?: string;
  created_at: string;
}

interface ProjectFolder {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
}

interface ProjectFile {
  id: string;
  name: string;
  description?: string;
  file_url: string;
  folder_id?: string | null;
  created_at: string;
}

interface ProjectNote {
  id: string;
  name: string;
  content: string;
  created_at: string;
}

export const ProjectRepositoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Loading & Error States
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [notes, setNotes] = useState<ProjectNote[]>([]);
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
  
  // Secure Note Modal State
  const [selectedNote, setSelectedNote] = useState<ProjectNote | null>(null);
  
  // Folders State
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  
  // Drag and Drop State
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [dragOverRoot, setDragOverRoot] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImage = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    return ext ? ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext) : false;
  };

  const getFolderFileCount = (folderId: string) => {
    return files.filter(f => f.folder_id === folderId).length;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch Project details
      const projectRes = await api.get(`/api/projects/${id}`);
      setProject(projectRes.data);
      
      // Fetch Project Folders
      const foldersRes = await api.get(`/api/projects/${id}/folders`);
      setFolders(foldersRes.data);
      
      // Fetch Project Files
      const filesRes = await api.get(`/api/projects/${id}/files`);
      setFiles(filesRes.data);
      
      // Fetch Project Notes
      const notesRes = await api.get(`/api/projects/${id}/notes`);
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

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      alert('Digite o nome da pasta.');
      return;
    }

    try {
      setCreatingFolder(true);
      const res = await api.post(`/api/projects/${id}/folders`, {
        name: newFolderName.trim()
      });
      setFolders([...folders, res.data]);
      setNewFolderName('');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao criar pasta: ' + (err.response?.data?.error || err.message));
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleFolderDelete = async (folderId: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Tem certeza que deseja excluir a pasta "${name}"? Todos os arquivos dentro dela serão excluídos permanentemente.`)) return;

    try {
      await api.delete(`/api/projects/folders/${folderId}`);
      setFolders(folders.filter(f => f.id !== folderId));
      if (currentFolderId === folderId) {
        setCurrentFolderId(null);
      }
      // Reload files list
      const filesRes = await api.get(`/api/projects/${id}/files`);
      setFiles(filesRes.data);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao excluir pasta: ' + err.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!fileName) {
        setFileName(file.name.replace(/\.[^/.]+$/, ""));
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
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const uploadRes = await api.post('/api/upload?type=project_files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const fileUrl = uploadRes.data.url;
      
      await api.post(`/api/projects/${id}/files`, {
        name: fileName.trim(),
        description: fileDescription.trim(),
        file_url: fileUrl,
        folder_id: currentFolderId
      });
      
      setFileName('');
      setFileDescription('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      const filesRes = await api.get(`/api/projects/${id}/files`);
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
      await api.delete(`/api/projects/files/${fileId}`);
      setFiles(files.filter(f => f.id !== fileId));
    } catch (err: any) {
      alert('Erro ao excluir arquivo: ' + err.message);
    }
  };

  const handleDragStart = (e: React.DragEvent, fileId: string) => {
    e.dataTransfer.setData('text/plain', fileId);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    setDragOverFolderId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
    setDragOverRoot(false);
  };

  const handleDrop = async (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    setDragOverFolderId(null);
    setDragOverRoot(false);
    const fileId = e.dataTransfer.getData('text/plain');
    if (!fileId) return;

    try {
      await api.patch(`/api/projects/files/${fileId}`, {
        folder_id: folderId
      });
      
      setFiles(prevFiles => prevFiles.map(f => f.id === fileId ? { ...f, folder_id: folderId } : f));
    } catch (err: any) {
      console.error(err);
      alert('Erro ao mover arquivo: ' + (err.response?.data?.error || err.message));
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
      
      await api.post(`/api/projects/${id}/notes`, {
        name: noteName.trim(),
        content: noteContent.trim()
      });
      
      setNoteName('');
      setNoteContent('');
      
      const notesRes = await api.get(`/api/projects/${id}/notes`);
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
      await api.delete(`/api/projects/notes/${noteId}`);
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

  if (loading) {
    return (
      <div className="project-repo-loading">
        <Loader2 className="animate-spin" size={48} />
        <p>Carregando repositório do projeto...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="project-repo-error animate-fade-in">
        <h2>Ops! Ocorreu um problema</h2>
        <p>{error || 'Projeto não encontrado.'}</p>
        <button className="back-btn-error" onClick={() => navigate('/projects')}>
          <ArrowLeft size={18} /> Voltar para Projetos
        </button>
      </div>
    );
  }

  return (
    <div className="project-repo-page animate-fade-in">
      {/* Back Header & Breadcrumbs */}
      <div className="repo-header-nav">
        <button className="back-btn" onClick={() => navigate('/projects')}>
          <ArrowLeft size={18} />
          Voltar para Projetos
        </button>
        <div className="repo-breadcrumbs">
          <span onClick={() => navigate('/projects')}>Projetos</span>
          <span className="separator">/</span>
          <span className="current">{project.name}</span>
          <span className="separator">/</span>
          <span className="current-sub">Repositório</span>
        </div>
      </div>

      {/* Project Mini Profile */}
      <div className="project-profile-card">
        <div className="project-info-main">
          <div className="project-logo-large">
            <Briefcase size={36} />
          </div>
          <div className="project-text">
            <h2>{project.name}</h2>
            {project.description && <p className="project-desc-subtitle">{project.description}</p>}
          </div>
        </div>
        
        <div className="project-contact-details">
          {project.client_name && (
            <div className="contact-pill client-name-pill">
              <span>Cliente: <strong>{project.client_name}</strong></span>
            </div>
          )}
          <div className={`status-badge ${project.status}`}>
            <span>Status: {project.status === 'active' ? 'Ativo' : 'Concluído'}</span>
          </div>
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
                    placeholder="Ex: Briefing Inicial" 
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

            {/* Files List with Folders Navigation */}
            <div className="items-list-card">
              <div className="list-header-repo">
                <div className="repo-title-nav">
                  <div className="repo-breadcrumbs">
                    <span 
                      className={`breadcrumb-item ${currentFolderId === null ? 'active' : 'clickable'} ${dragOverRoot ? 'drag-over' : ''}`}
                      onClick={() => setCurrentFolderId(null)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (currentFolderId !== null) setDragOverRoot(true);
                      }}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, null)}
                    >
                      <FolderOpen size={16} /> Raiz
                    </span>
                    {currentFolderId !== null && (
                      <>
                        <span className="breadcrumb-separator">/</span>
                        <span className="breadcrumb-item active">
                          {folders.find(f => f.id === currentFolderId)?.name || 'Pasta'}
                        </span>
                      </>
                    )}
                  </div>
                  
                  {currentFolderId !== null && (
                    <button 
                      onClick={() => setCurrentFolderId(null)}
                      className="btn-back-root"
                    >
                      Voltar para a Raiz
                    </button>
                  )}
                </div>
              </div>

              {currentFolderId === null && (
                <div className="create-folder-section">
                  <form onSubmit={handleCreateFolder} className="create-folder-form">
                    <input 
                      type="text" 
                      placeholder="Nome da nova pasta..." 
                      value={newFolderName}
                      onChange={e => setNewFolderName(e.target.value)}
                      required
                    />
                    <button type="submit" className="create-folder-btn" disabled={creatingFolder}>
                      {creatingFolder ? 'Criando...' : <><Plus size={16} /> Criar Pasta</>}
                    </button>
                  </form>
                </div>
              )}

              {/* Contents Area */}
              {currentFolderId === null ? (
                // Root View: List Folders + Root Files
                folders.length === 0 && files.filter(f => !f.folder_id).length === 0 ? (
                  <div className="empty-state">
                    <FolderOpen size={40} />
                    <p>Nenhum arquivo ou pasta enviado ainda.</p>
                    <span>Use o formulário para fazer upload ou crie uma pasta para organizar.</span>
                  </div>
                ) : (
                  <div className="repo-items-container">
                    {folders.length > 0 && (
                      <div className="folders-section animate-fade-in">
                        <h4 className="section-title">Pastas</h4>
                        <div className="folders-grid">
                          {folders.map(folder => (
                            <div 
                              key={folder.id} 
                              className={`folder-card clickable ${dragOverFolderId === folder.id ? 'drag-over' : ''}`}
                              onClick={() => setCurrentFolderId(folder.id)}
                              onDragOver={(e) => handleDragOver(e, folder.id)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, folder.id)}
                            >
                              <div className="folder-icon-wrapper">
                                <Folder size={32} className="folder-icon" />
                              </div>
                              <div className="folder-info">
                                <span className="folder-name" title={folder.name}>{folder.name}</span>
                                <span className="folder-count">
                                  {getFolderFileCount(folder.id)} {getFolderFileCount(folder.id) === 1 ? 'arquivo' : 'arquivos'}
                                </span>
                              </div>
                              <button 
                                className="folder-delete-btn"
                                onClick={(e) => handleFolderDelete(folder.id, folder.name, e)}
                                title="Excluir Pasta e Conteúdos"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="files-section animate-fade-in">
                      {folders.length > 0 && <h4 className="section-title">Arquivos na Raiz</h4>}
                      {files.filter(f => !f.folder_id).length === 0 ? (
                        folders.length > 0 ? (
                          <p className="no-root-files">Nenhum arquivo na raiz. Todos estão organizados em pastas.</p>
                        ) : null
                      ) : (
                        <div className="files-grid">
                          {files.filter(f => !f.folder_id).map(file => (
                            <div 
                              key={file.id} 
                              draggable
                              onDragStart={(e) => handleDragStart(e, file.id)}
                              className="file-item-card clickable"
                              onClick={() => window.open(getFullUrl(file.file_url), '_blank')}
                              title="Clique para abrir o arquivo em uma nova janela"
                            >
                              <div className="file-item-icon">
                                {isImage(file.file_url) ? (
                                  <img 
                                    src={getFullUrl(file.file_url)} 
                                    alt={file.name} 
                                    className="file-image-preview" 
                                  />
                                ) : (
                                  getFileIcon(file.file_url)
                                )}
                              </div>
                              
                              <div className="file-item-info">
                                <h4>{file.name}</h4>
                                {file.description && <p className="file-desc">{file.description}</p>}
                                <span className="file-date">{formatDate(file.created_at)}</span>
                              </div>

                              <div className="file-item-actions" onClick={e => e.stopPropagation()}>
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
                )
              ) : (
                // Inside Folder View: List files inside currentFolderId
                files.filter(f => f.folder_id === currentFolderId).length === 0 ? (
                  <div className="empty-state">
                    <FolderOpen size={40} />
                    <p>Esta pasta está vazia.</p>
                    <span>Use o formulário ao lado para enviar arquivos diretamente para esta pasta.</span>
                    <button 
                      className="delete-current-folder-btn-empty"
                      onClick={(e) => {
                        const folder = folders.find(f => f.id === currentFolderId);
                        if (folder) handleFolderDelete(folder.id, folder.name, e);
                      }}
                    >
                      <Trash2 size={14} /> Excluir Pasta Vazia
                    </button>
                  </div>
                ) : (
                  <div className="repo-items-container animate-fade-in">
                    <div className="folder-actions-header">
                      <p>Visualizando arquivos da pasta <strong>{folders.find(f => f.id === currentFolderId)?.name}</strong></p>
                      <button 
                        className="delete-current-folder-btn"
                        onClick={(e) => {
                          const folder = folders.find(f => f.id === currentFolderId);
                          if (folder) handleFolderDelete(folder.id, folder.name, e);
                        }}
                      >
                        <Trash2 size={14} /> Excluir esta Pasta
                      </button>
                    </div>

                    <div className="files-grid">
                      {files.filter(f => f.folder_id === currentFolderId).map(file => (
                        <div 
                          key={file.id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, file.id)}
                          className="file-item-card clickable"
                          onClick={() => window.open(getFullUrl(file.file_url), '_blank')}
                          title="Clique para abrir o arquivo em uma nova janela"
                        >
                          <div className="file-item-icon">
                            {isImage(file.file_url) ? (
                              <img 
                                src={getFullUrl(file.file_url)} 
                                alt={file.name} 
                                className="file-image-preview" 
                              />
                            ) : (
                              getFileIcon(file.file_url)
                            )}
                          </div>
                          
                          <div className="file-item-info">
                            <h4>{file.name}</h4>
                            {file.description && <p className="file-desc">{file.description}</p>}
                            <span className="file-date">{formatDate(file.created_at)}</span>
                          </div>

                          <div className="file-item-actions" onClick={e => e.stopPropagation()}>
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
                  </div>
                )
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
                    placeholder="Ex: Credenciais de Acesso" 
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
                    <div 
                      key={note.id} 
                      className="note-item-card clickable"
                      onClick={() => setSelectedNote(note)}
                      title="Clique para visualizar a nota completa"
                    >
                      <div className="note-card-header">
                        <h4>{note.name}</h4>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNoteDelete(note.id, note.name);
                          }}
                          className="note-delete-btn"
                          title="Excluir Nota"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="note-card-body">
                        <div className="note-card-secure-badge">
                          <Lock size={12} />
                          <span>Conteúdo Protegido</span>
                        </div>
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

      {/* Note Detail Modal */}
      {selectedNote && (
        <div className="repo-modal-overlay animate-fade-in" onClick={() => setSelectedNote(null)}>
          <div className="repo-modal-content animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="repo-modal-header">
              <div className="repo-modal-title">
                <Lock size={20} className="modal-title-icon" />
                <h3>{selectedNote.name}</h3>
              </div>
              <button className="repo-modal-close-btn" onClick={() => setSelectedNote(null)}>&times;</button>
            </div>
            
            <div className="repo-modal-body">
              <pre className="note-modal-text">{selectedNote.content}</pre>
            </div>
            
            <div className="repo-modal-footer">
              <span className="note-modal-date">Criado em: {formatDate(selectedNote.created_at)}</span>
              <button className="repo-modal-btn-close" onClick={() => setSelectedNote(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
