import React from 'react';
import { useSession } from '../../../context/SessionContext';

const DashboardHeader = ({ date }) => {
  const { session } = useSession();

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
      <div>
        <p style={{ color: '#9CA3AF' }}>{date}</p>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginTop: '4px' }}>
          Welcome, {session.user?.nom} {session.user?.prenom}
        </h1>
      </div>
      <button style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1F2937', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', border: 'none', color: 'white' }}>
        <span>Customize</span>
      </button>
    </div>
  );
};

export default DashboardHeader;
