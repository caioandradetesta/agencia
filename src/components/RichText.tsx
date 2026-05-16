import React from 'react';

interface RichTextProps {
  content: string;
}

export const RichText: React.FC<RichTextProps> = ({ content }) => {
  if (!content) return null;

  // Regex para capturar padrões de imagem markdown: ![texto](url)
  const parts = content.split(/(!\[.*?\]\(.*?\))/g);

  return (
    <div className="rich-text-content">
      {parts.map((part, i) => {
        const match = part.match(/!\[.*?\]\((.*?)\)/);
        if (match) {
          const url = match[1];
          return (
            <div key={i} className="rich-image-container">
              <img 
                src={url} 
                alt="Imagem anexada" 
                className="rich-image" 
                onClick={() => window.open(url, '_blank')}
              />
            </div>
          );
        }

        // Tratamento simples para URLs diretas de imagem caso não estejam no formato markdown
        const urlParts = part.split(/(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp))/gi);
        return (
          <span key={i}>
            {urlParts.map((urlPart, j) => {
              if (urlPart.match(/^https?:\/\//)) {
                return (
                  <div key={j} className="rich-image-container">
                    <img 
                      src={urlPart} 
                      alt="Imagem colada" 
                      className="rich-image"
                      onClick={() => window.open(urlPart, '_blank')}
                    />
                  </div>
                );
              }
              return urlPart;
            })}
          </span>
        );
      })}
    </div>
  );
};
