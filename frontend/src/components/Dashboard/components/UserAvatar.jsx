import React, { useState, useEffect } from 'react';



const UserAvatar = ({ initials, imageUrl }) => {
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    // Reset error state when imageUrl changes
    setImageError(false);
  }, [imageUrl]);

  console.log('Rendering UserAvatar with:', { initials, imageUrl, imageError });

  if (!imageUrl || imageError) {
    console.log('Showing initials because:', !imageUrl ? 'no image URL' : 'image failed to load');
    return (
      <div style={{ 
        width: '32px', 
        height: '32px', 
        borderRadius: '50%', 
        backgroundColor: '#3B82F6', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        cursor: 'pointer', 
        color: 'white',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        {initials}
      </div>
    );
  }

  return (
    <img 
      src={imageUrl}
      alt="Avatar utilisateur"
      style={{ 
        width: '32px', 
        height: '32px', 
        borderRadius: '50%', 
        objectFit: 'cover',
        cursor: 'pointer'
      }}
      onError={(e) => {
        console.error('Error loading image:', e);
        console.error('Failed URL:', imageUrl);
        // Try to fetch the image directly to see the error
        fetch(imageUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.blob();
          })
          .then(() => console.log('Image is actually accessible'))
          .catch(error => console.error('Fetch error:', error));
        setImageError(true);
      }}
    />
  );
};

export default UserAvatar;