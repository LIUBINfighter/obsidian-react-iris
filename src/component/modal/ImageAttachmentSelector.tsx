import React, { useState, useEffect } from 'react';
import { App, TFile, Notice } from 'obsidian';

interface ImageAttachmentSelectorProps {
  app: App;
  onImageSelected: (base64: string, file: TFile) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageAttachmentSelector: React.FC<ImageAttachmentSelectorProps> = ({
  app,
  onImageSelected,
  isOpen,
  onClose
}) => {
  const [images, setImages] = useState<TFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredImages, setFilteredImages] = useState<TFile[]>([]);
  
  // 加载所有图片附件
  useEffect(() => {
    if (!isOpen) return;
    
    const loadImages = async () => {
      setIsLoading(true);
      try {
        // 获取所有Markdown文件
        const files = app.vault.getFiles();
        
        // 过滤出图片文件
        const imageFiles = files.filter(file => {
          const ext = file.extension.toLowerCase();
          return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext);
        });
        
        setImages(imageFiles);
        setFilteredImages(imageFiles);
      } catch (error) {
        console.error('加载图片失败:', error);
        new Notice('加载图片失败');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadImages();
  }, [app.vault, isOpen]);
  
  // 过滤图片
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredImages(images);
      return;
    }
    
    const filtered = images.filter(file => 
      file.path.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredImages(filtered);
  }, [searchTerm, images]);
  
  // 处理图片选择
  const handleImageClick = async (file: TFile) => {
    try {
      // 读取文件内容为ArrayBuffer
      const buffer = await app.vault.readBinary(file);
      
      // 转换为base64
      const base64 = arrayBufferToBase64(buffer, file.extension);
      
      // 调用回调
      onImageSelected(base64, file);
      onClose();
    } catch (error) {
      console.error('读取图片失败:', error);
      new Notice('读取图片失败');
    }
  };
  
  // ArrayBuffer转Base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer, extension: string): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    const base64 = window.btoa(binary);
    const mimeType = getMimeType(extension);
    return `data:${mimeType};base64,${base64}`;
  };
  
  // 获取MIME类型
  const getMimeType = (extension: string): string => {
    const ext = extension.toLowerCase();
    switch (ext) {
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'gif': return 'image/gif';
      case 'webp': return 'image/webp';
      case 'svg': return 'image/svg+xml';
      default: return 'application/octet-stream';
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        backgroundColor: 'var(--background-primary)',
        borderRadius: '8px',
        width: '80%',
        maxWidth: '800px',
        maxHeight: '80vh',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <h3 style={{ margin: 0 }}>选择图片附件</h3>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer'
          }}>✕</button>
        </div>
        
        <input 
          type="text" 
          placeholder="搜索图片..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            padding: '8px',
            marginBottom: '15px',
            width: '100%',
            border: '1px solid var(--background-modifier-border)',
            borderRadius: '4px',
            backgroundColor: 'var(--background-primary)'
          }}
        />
        
        <div style={{
          overflowY: 'auto',
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '10px'
        }}>
          {isLoading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
              加载中...
            </div>
          ) : filteredImages.length > 0 ? (
            filteredImages.map(file => (
              <div 
                key={file.path}
                onClick={() => handleImageClick(file)}
                style={{
                  cursor: 'pointer',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  border: '1px solid var(--background-modifier-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '180px'
                }}
              >
                <div style={{
                  height: '120px',
                  overflow: 'hidden',
                  backgroundColor: 'var(--background-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img 
                    src={app.vault.getResourcePath(file)} 
                    alt={file.name}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                  />
                </div>
                <div style={{
                  padding: '8px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '12px'
                }}>
                  {file.name}
                </div>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
              未找到匹配的图片
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
