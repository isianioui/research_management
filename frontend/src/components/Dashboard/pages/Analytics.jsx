import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { useSession } from '../../../context/SessionContext';
import { useNavigate } from 'react-router-dom';
import './Analytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { session } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!session?.token) {
        console.log('No token available in session');
        setError('Veuillez vous connecter pour accéder aux statistiques');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching analytics with token:', session.token);
        const response = await axios.get('http://localhost:5000/api/projects/analytics', {
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Analytics response:', response.data);
        setAnalyticsData(response.data);
      } catch (err) {
        console.error('Error details:', err.response?.data || err.message);
        if (err.response?.status === 401) {
          setError('Session expirée. Veuillez vous reconnecter.');
          navigate('/login');
        } else {
          setError(err.response?.data?.message || 'Erreur lors du chargement des statistiques');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [session, navigate]);

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Chargement des statistiques...</p>
    </div>
  );

  if (error) return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <p>{error}</p>
      <button 
        onClick={() => navigate('/login')}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#4F46E5',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Se connecter
      </button>
    </div>
  );

  if (!analyticsData) return (
    <div className="no-data-container">
      <p>Aucune donnée disponible</p>
    </div>
  );

  // 1. Graphique des projets par statut (Pie Chart)
  const statusChartData = {
    labels: analyticsData.status_stats.map(item => item.status),
    datasets: [{
      data: analyticsData.status_stats.map(item => item.count),
      backgroundColor: [
        '#4F46E5',
        '#10B981',
        '#F59E0B',
        '#EF4444'
      ]
    }]
  };

  // 2. Graphique de progression par jours (Line Chart)
  const dailyProgressData = {
    labels: analyticsData.daily_progress.map(item => new Date(item.day).toLocaleDateString()),
    datasets: [{
      label: 'Projets créés',
      data: analyticsData.daily_progress.map(item => item.count),
      borderColor: '#4F46E5',
      tension: 0.1
    }]
  };

  // 3. Graphique des projets par méthodologie (Pie Chart)
  const methodologyChartData = {
    labels: analyticsData.methodology_stats.map(item => item.methodology),
    datasets: [{
      data: analyticsData.methodology_stats.map(item => item.count),
      backgroundColor: [
        '#4F46E5',
        '#10B981',
        '#F59E0B',
        '#EF4444'
      ]
    }]
  };

  // 4. Graphique de progression par étape (Bar Chart)
  const stepProgressData = {
    labels: analyticsData.step_progress.map(item => item.methodology),
    datasets: [
      {
        label: 'Introduction',
        data: analyticsData.step_progress.map(item => 
          (item.intro_completed / item.total_projects) * 100
        ),
        backgroundColor: '#4F46E5'
      },
      {
        label: 'Méthodes',
        data: analyticsData.step_progress.map(item => 
          (item.methods_completed / item.total_projects) * 100
        ),
        backgroundColor: '#10B981'
      },
      {
        label: 'Résultats',
        data: analyticsData.step_progress.map(item => 
          (item.results_completed / item.total_projects) * 100
        ),
        backgroundColor: '#F59E0B'
      },
      {
        label: 'Discussion',
        data: analyticsData.step_progress.map(item => 
          (item.discussion_completed / item.total_projects) * 100
        ),
        backgroundColor: '#EF4444'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Statistiques des projets'
      }
    }
  };

  return (
    <div className="analytics-container">
      <h1>Statistiques des Projets</h1>
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des statistiques...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
        </div>
      ) : !analyticsData ? (
        <div className="no-data-container">
          <p>Aucune donnée disponible</p>
        </div>
      ) : (
        <div className="charts-grid">
          <div className="chart-card">
            <h2>Statut des Projets</h2>
            <Pie data={statusChartData} options={chartOptions} />
          </div>
          <div className="chart-card">
            <h2>Progression Journalière</h2>
            <Line data={dailyProgressData} options={chartOptions} />
          </div>
          <div className="chart-card">
            <h2>Méthodologie des Projets</h2>
            <Pie data={methodologyChartData} options={chartOptions} />
          </div>
          <div className="chart-card">
            <h2>Progression des Étapes</h2>
            <Bar 
              data={stepProgressData} 
              options={{
                ...chartOptions,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                      display: true,
                      text: 'Pourcentage de complétion'
                    }
                  }
                }
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics; 