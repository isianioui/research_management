import React from 'react';

const UserAvatar = ({ initials, imageUrl }) => {
  return imageUrl ? (
    <img 
      src={imageUrl} 
      alt="User avatar" 
      className="avatar-image"
      style={{ width: '32px', height: '32px',backgroundColor: '#3B82F9', borderRadius: '50%' }}
    />
  ) : (
    <div className="avatar-initials">
      {initials}
    </div>
  );
};


export default UserAvatar;




