import React from 'react';
import DashboardHeader from '../components/DashboardHeader';
import FeatureGrid from '../components/FeatureGrid';

const Overview = () => {
  return (
    <>
      <DashboardHeader
        date={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        greeting={`Good ${getTimeOfDay()}, ${getUserName()}`}
      />
      <FeatureGrid />
    </>
  );
};

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

const getUserName = () => {
  // Replace with actual user name from your auth system
  return 'User';
};

export default Overview;