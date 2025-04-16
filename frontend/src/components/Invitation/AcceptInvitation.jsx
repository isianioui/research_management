import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AcceptInvitation = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    
    useEffect(() => {
        const acceptInvitation = async () => {
            try {
                const response = await axios.post(`http://localhost:5000/api/invitations/accept/${token}`);
                if (response.data.requiresAuth) {
                    navigate('/login', { state: { redirectTo: `/project/${response.data.projectId}` } });
                } else {
                    navigate(`/project/${response.data.projectId}`);
                }
            } catch (error) {
                console.error('Error accepting invitation:', error);
            }
        };
        
        acceptInvitation();
    }, [token]);

    return <div>Processing invitation...</div>;
};

export default AcceptInvitation;
