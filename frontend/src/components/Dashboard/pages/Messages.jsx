import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format, isToday, isYesterday } from 'date-fns';
import './Messages.css';
import { Send, Paperclip, Smile, MoreVertical, Search, Phone, Video } from 'lucide-react';
import { useSession } from '../../../context/SessionContext';

const MessagesPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [projectCollaborators, setProjectCollaborators] = useState([]);
  const [activeTab, setActiveTab] = useState('conversations');
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState({
    conversations: false,
    collaborators: false,
    messages: false
  });
  const [error, setError] = useState({
    conversations: null,
    collaborators: null,
    messages: null
  });
  const messagesEndRef = useRef(null);
  const { user } = useSession();

  const apiBaseUrl = 'http://localhost:5000/api/chat';

  // Helper function to generate initials for default avatar
  const getInitials = (name = '') => {
    const names = name.split(' ');
    let initials = names[0]?.substring(0, 1) || '';
    if (names.length > 1) {
      initials += names[names.length - 1]?.substring(0, 1) || '';
    }
    return initials.toUpperCase();
  };

  // Safe participant names getter
  const getParticipantNames = (conversation) => {
    if (!conversation?.participants?.length) return 'Unknown User';
    return conversation.participants
      .map(p => `${p?.prenom || ''} ${p?.nom || ''}`.trim())
      .filter(Boolean)
      .join(', ') || 'Unknown User';
  };

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(prev => ({ ...prev, conversations: true }));
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${apiBaseUrl}/conversations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Transform the data to ensure all necessary fields are present
        const transformedConversations = (response.data || []).map(conv => ({
          ...conv,
          participants: conv.participants.map(p => ({
            ...p,
            // Ensure invited users are properly displayed
            nom: p.nom === 'Invité' ? p.email : p.nom,
            prenom: p.prenom === 'Temporaire' ? '' : p.prenom
          }))
        }));
        
        setConversations(transformedConversations);
        setError(prev => ({ ...prev, conversations: null }));
      } catch (error) {
        console.error('Failed to fetch conversations', error);
        setError(prev => ({ 
          ...prev, 
          conversations: error.response?.data?.error || 'Failed to load conversations' 
        }));
      } finally {
        setLoading(prev => ({ ...prev, conversations: false }));
      }
    };

    fetchConversations();
    
    const intervalId = setInterval(fetchConversations, 30000);
    return () => clearInterval(intervalId);
  }, [apiBaseUrl]);

  // Fetch project collaborators
  useEffect(() => {
    const fetchCollaborators = async () => {
      setLoading(prev => ({ ...prev, collaborators: true }));
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${apiBaseUrl}/collaborators`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setProjectCollaborators(response.data || []);
        setError(prev => ({ ...prev, collaborators: null }));
      } catch (error) {
        console.error('Failed to fetch collaborators', error);
        setError(prev => ({ 
          ...prev, 
          collaborators: error.response?.data?.error || 'Failed to load collaborators' 
        }));
      } finally {
        setLoading(prev => ({ ...prev, collaborators: false }));
      }
    };

    fetchCollaborators();
  }, [apiBaseUrl]);

  // Fetch messages for selected conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedConversation?.id) {
        setLoading(prev => ({ ...prev, messages: true }));
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`${apiBaseUrl}/messages/${selectedConversation.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          setMessages(response.data || []);
          setError(prev => ({ ...prev, messages: null }));
        } catch (error) {
          console.error('Failed to fetch messages', error);
          setError(prev => ({ 
            ...prev, 
            messages: error.response?.data?.error || 'Failed to load messages' 
          }));
        } finally {
          setLoading(prev => ({ ...prev, messages: false }));
        }
      }
    };

    fetchMessages();
    
    let intervalId;
    if (selectedConversation?.id) {
      intervalId = setInterval(fetchMessages, 5000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedConversation, apiBaseUrl]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation?.id) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${apiBaseUrl}/messages`, {
        conversation_id: selectedConversation.id,
        content: newMessage
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Update messages immediately
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      
      // Update conversation in the list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { 
                ...conv, 
                last_message: response.data, 
                updated_at: new Date().toISOString() 
              } 
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to send message', error);
      alert(error.response?.data?.error || 'Failed to send message');
    }
  };

  // Start new conversation with collaborator
  const startConversation = async (collaborator, projectId) => {
    if (!collaborator?.id || !projectId) {
      console.error('Missing required data:', { collaborator, projectId });
      return;
    }

    try {
      setLoading(prev => ({ ...prev, conversations: true }));
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${apiBaseUrl}/conversation`,
        {
          user_id: collaborator.id,
          project_id: projectId
        },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data?.id) {
        throw new Error('Invalid response from server');
      }

      const project = projectCollaborators.find(p => p.project_id === projectId);
      
      const newConversation = {
        id: response.data.id,
        project_id: projectId,
        project_title: project?.project_title || 'Unknown Project',
        participants: [{
          id: collaborator.id,
          prenom: collaborator.prenom,
          nom: collaborator.nom,
          email: collaborator.email,
          role: collaborator.role
        }],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_message: null,
        unread_count: 0
      };

      setConversations(prev => {
        const exists = prev.some(conv => conv.id === newConversation.id);
        return exists ? prev : [newConversation, ...prev];
      });

      setActiveTab('conversations');
      setSelectedConversation(newConversation);
      setMessages([]);
      
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setError(prev => ({
        ...prev,
        conversations: 'Failed to start conversation. Please try again.'
      }));
    } finally {
      setLoading(prev => ({ ...prev, conversations: false }));
    }
  };

  // Format date for messages
  const formatMessageDate = (date) => {
    if (!date) return '';
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    } else if (isYesterday(messageDate)) {
      return 'Yesterday';
    }
    return format(messageDate, 'dd/MM/yyyy');
  };

  // Filter conversations by search term
  const filteredConversations = conversations.filter(conv => {
    const participantNames = getParticipantNames(conv).toLowerCase();
    const projectTitle = conv.project_title?.toLowerCase() || '';
    return (
      participantNames.includes(searchTerm.toLowerCase()) ||
      projectTitle.includes(searchTerm.toLowerCase())
    );
  });

  // Sort conversations by last message date
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    const dateA = a.last_message ? new Date(a.last_message.created_at) : new Date(a.updated_at);
    const dateB = b.last_message ? new Date(b.last_message.created_at) : new Date(b.updated_at);
    return dateB - dateA;
  });

  // Add a function to check if a message is from the current user
  const isCurrentUserMessage = (message) => {
    return message.sender_id === user?.id;
  };

  const renderCollaboratorsList = () => {
    if (loading.collaborators) {
      return (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading collaborators...</p>
        </div>
      );
    }

    if (error.collaborators) {
      return (
        <div className="error-container">
          <p>{error.collaborators}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      );
    }

    if (!projectCollaborators || projectCollaborators.length === 0) {
      return (
        <div className="empty-state">
          <p>No collaborators found</p>
        </div>
      );
    }

    return projectCollaborators.map(project => (
      <div key={project.project_id} className="project-collaborators">
        <h3 className="project-title">{project.project_title}</h3>
        <div className="collaborators-list">
          {project.collaborators?.map(collaborator => (
            <div 
              key={collaborator.id} 
              className="collaborator-item"
              onClick={() => startConversation(collaborator, project.project_id)}
            >
              <div className="default-avatar">
                {getInitials(`${collaborator.prenom} ${collaborator.nom}`)}
              </div>
              <div className="collaborator-info">
                <h4>{collaborator.prenom} {collaborator.nom}</h4>
                <p className="collaborator-email">{collaborator.email}</p>
                <div className="collaborator-status">
                  {collaborator.role && (
                    <span className="role-badge">{collaborator.role}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <div className="messages-container">
      <div className="conversations-sidebar">
        <div className="conversations-header">
          <h2>Messages</h2>
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'conversations' ? 'active' : ''}`}
              onClick={() => setActiveTab('conversations')}
            >
              Conversations
            </button>
            <button 
              className={`tab ${activeTab === 'collaborators' ? 'active' : ''}`}
              onClick={() => setActiveTab('collaborators')}
            >
              Collaborators
            </button>
          </div>
        </div>

        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder={activeTab === 'conversations' ? "Search conversations" : "Search collaborators"} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {activeTab === 'conversations' ? (
          <div className="conversations-list">
            {loading.conversations ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading conversations...</p>
              </div>
            ) : error.conversations ? (
              <div className="error-container">
                <p>{error.conversations}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
              </div>
            ) : sortedConversations.length === 0 ? (
              <div className="empty-state">
                <p>No conversations yet</p>
                <p>Switch to the Collaborators tab to start a conversation</p>
              </div>
            ) : (
              sortedConversations.map(conversation => (
                <div 
                  key={conversation.id} 
                  className={`conversation-item ${selectedConversation?.id === conversation.id ? 'active' : ''}`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="conversation-avatar-container">
                    <div className="default-avatar">
                      {getInitials(getParticipantNames(conversation))}
                    </div>
                  </div>
                  <div className="conversation-details">
                    <div className="conversation-header">
                      <h3>{getParticipantNames(conversation)}</h3>
                      <span className="conversation-time">
                        {conversation.last_message ? 
                          formatMessageDate(conversation.last_message.created_at) : 
                          formatMessageDate(conversation.updated_at)}
                      </span>
                    </div>
                    <p className="project-title">{conversation.project_title}</p>
                    <p className="last-message">
                      {conversation.last_message ? 
                        conversation.last_message.content.slice(0, 30) + 
                        (conversation.last_message.content.length > 30 ? '...' : '') : 
                        'No messages yet'}
                    </p>
                    {conversation.unread_count > 0 && (
                      <span className="unread-badge">{conversation.unread_count}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="collaborators-container">
            {renderCollaboratorsList()}
          </div>
        )}
      </div>

      <div className="messages-panel">
        {selectedConversation ? (
          <>
            <div className="messages-header">
              <div className="participant-info">
                <div className="default-avatar large">
                  {getInitials(getParticipantNames(selectedConversation))}
                </div>
                <div>
                  <h2>{getParticipantNames(selectedConversation)}</h2>
                  <p className="project-name">{selectedConversation.project_title}</p>
                </div>
              </div>
            </div>

            <div className="messages-list">
              {loading.messages ? (
                <div className="text-center">Loading messages...</div>
              ) : error.messages ? (
                <div className="text-red-500 text-center">{error.messages}</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">No messages yet</div>
              ) : (
                messages.map(message => (
                  <div
                    key={message.id}
                    className={`message-container ${isCurrentUserMessage(message) ? 'sent' : 'received'}`}
                  >
                    <div className={`message ${isCurrentUserMessage(message) ? 'sent' : 'received'}`}>
                      {!isCurrentUserMessage(message) && (
                        <div className="sender-name">{message.sender_name}</div>
                      )}
                      <div className="message-content">{message.content}</div>
                      <div className="message-time">
                        {formatMessageDate(message.created_at)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="message-input-container" onSubmit={handleSendMessage}>
              <button type="button" className="input-action-btn">
                <Paperclip size={20} />
              </button>
              <button type="button" className="input-action-btn">
                <Smile size={20} />
              </button>
              <input 
                type="text" 
                placeholder="Type a message..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="message-input"
              />
              <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="no-conversation-selected">
            <h2>Select a conversation to start messaging</h2>
            <p>Or choose a collaborator from your projects to start a new conversation</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;