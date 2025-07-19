import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import './App.css';

// Types
interface User {
  id: string;
  name: string;
  totalPoints: number;
  rank?: number;
}

interface Claim {
  id: string;
  userId: string;
  userName: string;
  points: number;
  claimedAt: string;
}

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [claims, setClaims] = useState<Claim[]>([]);
  const [newUserName, setNewUserName] = useState<string>('');
  const [showAddUser, setShowAddUser] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [showParticles, setShowParticles] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('leaderboardUpdate', (updatedUsers: User[]) => {
      setUsers(updatedUsers);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Load initial data
  useEffect(() => {
    loadUsers();
    loadClaims();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadClaims = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/claims/history?limit=10`);
      setClaims(response.data.claims);
    } catch (error) {
      console.error('Error loading claims:', error);
    }
  };

  // Add new user
  const addUser = async () => {
    if (newUserName.trim()) {
      try {
        const response = await axios.post(`${API_BASE_URL}/users`, {
          name: newUserName.trim()
        });
        
        // Reload users to get updated list
        await loadUsers();
        setNewUserName('');
        setShowAddUser(false);
      } catch (error: any) {
        console.error('Error adding user:', error);
        alert(error.response?.data?.message || 'Failed to add user');
      }
    }
  };

  // Claim points for selected user
  const claimPoints = async () => {
    if (!selectedUser) return;
    
    setIsClaiming(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/claims/claim`, {
        userId: selectedUser
      });
      
      const { points, claim } = response.data;
      
      // Add to claims history
      setClaims(prev => [claim, ...prev.slice(0, 9)]);
      
      // Show confetti for top 3
      const updatedUser = users.find(u => u.id === selectedUser);
      if (updatedUser) {
        const newTotalPoints = updatedUser.totalPoints + points;
        const newRank = users.filter(u => u.totalPoints > newTotalPoints).length + 1;
        if (newRank <= 3) {
          setShowConfetti(true);
          setShowParticles(true);
          setTimeout(() => {
            setShowConfetti(false);
            setShowParticles(false);
          }, 5000);
        }
      }
      
      // Reload users to get updated rankings
      await loadUsers();
    } catch (error: any) {
      console.error('Error claiming points:', error);
      alert(error.response?.data?.message || 'Failed to claim points');
    } finally {
      setIsClaiming(false);
    }
  };

  // Get top 3 users for special display
  const topUsers = users.slice(0, 3);
  const otherUsers = users.slice(3);

  // Confetti component
  const Confetti = () => (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(100)].map((_, i) => (
        <div
          key={i}
          className={`absolute w-3 h-3 animate-bounce ${
            ['bg-yellow-400', 'bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-pink-400', 'bg-orange-400', 'bg-indigo-400'][i % 8]
          }`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${1 + Math.random() * 3}s`,
            transform: `rotate(${Math.random() * 360}deg)`
          }}
        />
      ))}
    </div>
  );

  // Particle effects component
  const Particles = () => (
    <div className="fixed inset-0 pointer-events-none z-40">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white animate-ping"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${1 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );

  // Floating orbs component
  const FloatingOrbs = ({ index }: { index: number }) => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className={`absolute w-4 h-4 rounded-full animate-pulse ${
            index === 0 ? 'bg-yellow-300/30' :
            index === 1 ? 'bg-gray-300/30' :
            'bg-amber-300/30'
          }`}
          style={{
            left: `${10 + (i * 10)}%`,
            top: `${20 + (i * 8)}%`,
            animationDelay: `${i * 0.2}s`,
            animationDuration: `${2 + i * 0.5}s`
          }}
        />
      ))}
    </div>
  );

  // Rotating border component
  const RotatingBorder = ({ index }: { index: number }) => (
    <div className="absolute inset-0 rounded-3xl overflow-hidden">
      <div className={`absolute inset-0 rounded-3xl animate-spin ${
        index === 0 ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400' :
        index === 1 ? 'bg-gradient-to-r from-gray-400 via-slate-500 to-gray-400' :
        'bg-gradient-to-r from-amber-500 via-orange-600 to-amber-500'
      }`} style={{ animationDuration: '3s' }}></div>
      <div className="absolute inset-1 bg-white rounded-3xl"></div>
    </div>
  );

  // Glowing aura component
  const GlowingAura = ({ index }: { index: number }) => (
    <div className={`absolute -inset-4 rounded-3xl blur-2xl opacity-50 animate-pulse ${
      index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
      index === 1 ? 'bg-gradient-to-r from-gray-400 to-slate-500' :
      'bg-gradient-to-r from-amber-500 to-orange-600'
    }`} style={{ animationDuration: '2s' }}></div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🏆</div>
          <div className="text-2xl font-bold text-gray-800">Loading Leaderboard...</div>
          <div className="mt-4">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <div className="text-2xl font-bold text-red-600">Error: {error}</div>
          <button 
            onClick={loadUsers}
            className="mt-4 px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Confetti Effect */}
      {showConfetti && <Confetti />}
      
      {/* Particle Effects */}
      {showParticles && <Particles />}
      
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-4xl animate-bounce">🏆</div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent">
                  Leaderboard
                </h1>
                <p className="text-yellow-100 text-sm">Real-time Rankings & Achievements</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Live Updates</div>
              <div className="flex space-x-1 mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* User Selection & Claim Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-amber-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="mr-3">🎯</span>
            Claim Points
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* User Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select User
              </label>
              <div className="flex space-x-3">
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-amber-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-200 focus:border-amber-500 transition-all"
                >
                  <option value="">Choose a user...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.totalPoints} pts)
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowAddUser(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Claim Button */}
            <div className="flex items-end">
              <button
                onClick={claimPoints}
                disabled={!selectedUser || isClaiming}
                className="w-full px-8 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white font-bold text-lg rounded-xl hover:from-amber-600 hover:via-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-2xl relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative z-10">
                  {isClaiming ? '🎲 Claiming...' : '🎯 Claim Random Points (1-10)'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Top 3 Users - EXTREMELY Grand Display */}
        {topUsers.length > 0 && (
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-12 text-center flex items-center justify-center animate-pulse">
              <span className="mr-6 text-5xl animate-bounce">👑</span>
              <span className="bg-gradient-to-r from-yellow-600 via-orange-600 to-amber-600 bg-clip-text text-transparent">
                LEGENDARY CHAMPIONS
              </span>
              <span className="ml-6 text-5xl animate-bounce">👑</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-12">
              {topUsers.map((user, index) => (
                <div
                  key={user.id}
                  className={`relative transform hover:scale-110 transition-all duration-700 ${
                    index === 0 ? 'order-1 md:order-2' :
                    index === 1 ? 'order-2 md:order-1' :
                    'order-3'
                  }`}
                >
                  {/* Multiple Background Effects */}
                  <GlowingAura index={index} />
                  <RotatingBorder index={index} />
                  <FloatingOrbs index={index} />
                  
                  {/* Main Card */}
                  <div className={`relative bg-white rounded-3xl shadow-2xl p-6 text-center border-4 ${
                    index === 0 ? 'border-yellow-400 shadow-yellow-200' :
                    index === 1 ? 'border-gray-300 shadow-gray-200' :
                    'border-amber-600 shadow-amber-200'
                  }`}>
                    {/* Multiple Crowns with different animations */}
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                      <div className={`text-4xl ${
                        index === 0 ? 'animate-bounce' :
                        index === 1 ? 'animate-pulse' :
                        'animate-pulse'
                      }`}>
                        {index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}
                      </div>
                      <div className={`text-2xl absolute -top-1 -right-1 ${
                        index === 0 ? 'animate-ping' :
                        index === 1 ? 'animate-pulse' :
                        'animate-pulse'
                      }`}>
                        {index === 0 ? '⭐' : index === 1 ? '✨' : '💫'}
                      </div>
                    </div>
                    
                    {/* Floating User Avatar with multiple effects */}
                    <div className="mb-4 relative">
                      <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-2xl animate-pulse ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                        index === 1 ? 'bg-gradient-to-br from-gray-400 to-slate-500' :
                        'bg-gradient-to-br from-amber-500 to-orange-600'
                      }`} style={{ animationDuration: '3s' }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      {/* Orbiting particles around avatar */}
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`absolute w-2 h-2 rounded-full animate-ping ${
                            index === 0 ? 'bg-yellow-300' :
                            index === 1 ? 'bg-gray-300' :
                            'bg-amber-300'
                          }`}
                          style={{
                            left: `${50 + 30 * Math.cos(i * Math.PI / 2)}%`,
                            top: `${50 + 30 * Math.sin(i * Math.PI / 2)}%`,
                            animationDelay: `${i * 0.3}s`,
                            animationDuration: '2s'
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* User Name with glow effect */}
                    <div className="text-lg font-bold text-gray-800 mb-2 animate-pulse" style={{ animationDuration: '2.5s' }}>
                      {user.name}
                    </div>
                    
                    {/* Animated Points Display */}
                    <div className="text-3xl font-bold mb-1 animate-bounce" style={{ animationDuration: '1.5s' }}>
                      <span className={`${
                        index === 0 ? 'text-yellow-600' :
                        index === 1 ? 'text-gray-600' :
                        'text-amber-600'
                      }`}>
                        {user.totalPoints}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 font-bold animate-pulse" style={{ animationDuration: '3s' }}>POINTS</div>
                    
                    {/* Multiple Special Effects */}
                    {index === 0 && (
                      <>
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                        <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                      </>
                    )}
                    {index === 1 && (
                      <>
                        <div className="absolute -top-2 -left-2 w-3 h-3 bg-gray-400 rounded-full animate-ping"></div>
                        <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-slate-400 rounded-full animate-pulse"></div>
                      </>
                    )}
                    {index === 2 && (
                      <>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-ping"></div>
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                      </>
                    )}
                    
                    {/* Floating achievement badges */}
                    <div className="absolute top-2 left-2 text-lg animate-bounce" style={{ animationDelay: '0.5s' }}>
                      {index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉'}
                    </div>
                    <div className="absolute top-2 right-2 text-lg animate-bounce" style={{ animationDelay: '1s' }}>
                      {index === 0 ? '⭐' : index === 1 ? '✨' : '💫'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-amber-200">
          <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-amber-50 border-b border-amber-200">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <span className="mr-3">📊</span>
              Complete Leaderboard
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
                <tr>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-amber-100">
                {users.map((user, index) => (
                  <tr key={user.id} className="hover:bg-amber-50 transition-colors">
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                          user.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg' :
                          user.rank === 2 ? 'bg-gradient-to-r from-gray-300 to-slate-400 text-white shadow-lg' :
                          user.rank === 3 ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg' :
                          'bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-lg'
                        }`}>
                          {user.rank}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg ${
                            user.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                            user.rank === 2 ? 'bg-gradient-to-r from-gray-400 to-slate-500' :
                            user.rank === 3 ? 'bg-gradient-to-r from-amber-500 to-orange-600' :
                            'bg-gradient-to-r from-amber-400 to-orange-500'
                          }`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {user.name}
                            {user.rank && user.rank <= 3 && (
                              <span className="ml-2 text-lg">
                                {user.rank === 1 ? '👑' : user.rank === 2 ? '🥈' : '🥉'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-amber-600">
                        {user.totalPoints} pts
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Claims */}
        {claims.length > 0 && (
          <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-amber-200">
            <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-amber-50 border-b border-amber-200">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <span className="mr-3">📜</span>
                Recent Claims
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
                  <tr>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Points Claimed
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-amber-100">
                  {claims.slice(0, 10).map((claim) => (
                    <tr key={claim.id} className="hover:bg-amber-50 transition-colors">
                      <td className="px-8 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {claim.userName}
                        </div>
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200">
                          +{claim.points} pts
                        </span>
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(claim.claimedAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl border border-amber-200">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="mr-3">👤</span>
              Add New User
            </h3>
            <input
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Enter user name..."
              className="w-full px-4 py-3 border-2 border-amber-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-200 focus:border-amber-500 mb-6 transition-all"
              onKeyPress={(e) => e.key === 'Enter' && addUser()}
            />
            <div className="flex space-x-4">
              <button
                onClick={addUser}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg"
              >
                Add User
              </button>
              <button
                onClick={() => setShowAddUser(false)}
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-all transform hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
