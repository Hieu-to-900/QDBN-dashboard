import { useState } from 'react';
import ImageUploader from './components/ImageUploader';

interface UploadedImage {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadedAt: Date;
  status: 'uploading' | 'success' | 'error';
}

function App() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  const handleUploadUpdate = (imageUpdate: UploadedImage) => {
    setUploadedImages(prev => {
      const existingImageIndex = prev.findIndex(img => img.id === imageUpdate.id && img.status === 'uploading');
      
      if (existingImageIndex !== -1) {
        const updatedImages = [...prev];
        updatedImages[existingImageIndex] = imageUpdate;
        return updatedImages;
      } else if (imageUpdate.status === 'uploading') {
        return [...prev, imageUpdate];
      }
      return [...prev, imageUpdate];
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '36rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '300', color: 'white', textAlign: 'center', marginBottom: '2.5rem', letterSpacing: '0.025em' }}>
          File Upload Widget
        </h1>
        
        <div style={{ backgroundColor: 'white', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
          <div style={{ backgroundColor: '#fbbf24', padding: '0.75rem 1.5rem', textAlign: 'center' }}>
            <h2 style={{ color: 'white', fontSize: '1.125rem', fontWeight: '400' }}>File Upload</h2>
          </div>
          
          <div style={{ padding: '2rem 3rem' }}>
            <p style={{ color: '#374151', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.625' }}>
              File Upload widget with multiple file selection, drag&drop support. You can drag & drop files from your desktop on this webpage.
            </p>
            
            <ImageUploader 
              onUploadComplete={handleUploadUpdate}
              maxFileSize={10 * 1024 * 1024}
              allowedTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
            />
            
            {uploadedImages.length > 0 && (
              <div style={{ marginTop: '1.25rem', border: '1px solid #9ca3af', padding: '1rem', minHeight: '70px' }}>
                <h3 style={{ color: '#4b5563', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Status Messages</h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {uploadedImages.map(image => (
                    <li key={image.id} style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '0.5rem',
                        height: '0.5rem',
                        borderRadius: '9999px',
                        marginRight: '0.5rem',
                        backgroundColor: image.status === 'success' ? '#10b981' :
                                       image.status === 'error' ? '#ef4444' :
                                       '#eab308'
                      }}></span>
                      {image.name} - {image.status}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {uploadedImages.length === 0 && (
              <div style={{ marginTop: '1.25rem', border: '1px solid #9ca3af', padding: '1rem', minHeight: '70px' }}>
                <h3 style={{ color: '#4b5563', fontSize: '0.875rem', fontWeight: '600' }}>Status Messages</h3>
              </div>
            )}
          </div>
        </div>
        
        <footer style={{ marginTop: '1.5rem', textAlign: 'center', color: 'white', fontSize: '0.875rem' }}>
          <p>© 2016 File Upload widget. All Rights Reserved | Design by W3layouts</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
