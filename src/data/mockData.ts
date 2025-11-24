export const mockChats = [
  {
    id: '1',
    name: 'Col. Rajesh Sharma',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh',
    lastMessage: 'Mission briefing at 1400 hours',
    timestamp: '10:30 AM',
    unread: 2,
    status: 'online',
  },
  {
    id: '2',
    name: 'Major Priya Singh',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    lastMessage: 'Coordinates received',
    timestamp: '9:15 AM',
    unread: 0,
    status: 'offline',
  },
  {
    id: '3',
    name: 'Northern Command',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=NC',
    lastMessage: 'Weather update for sector 5',
    timestamp: 'Yesterday',
    unread: 5,
    status: 'online',
  },
  {
    id: '4',
    name: 'Captain Arun Kumar',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arun',
    lastMessage: 'Roger that, standing by',
    timestamp: 'Yesterday',
    unread: 0,
    status: 'online',
  },
];

export const mockMessages = [
  {
    id: '1',
    senderId: 'other',
    text: 'Good morning. Status report ready?',
    timestamp: '9:00 AM',
    status: 'read',
  },
  {
    id: '2',
    senderId: 'me',
    text: 'Yes sir, all systems operational',
    timestamp: '9:02 AM',
    status: 'read',
  },
  {
    id: '3',
    senderId: 'other',
    text: 'Excellent. Proceed with phase 2',
    timestamp: '9:05 AM',
    status: 'read',
  },
  {
    id: '4',
    senderId: 'me',
    text: 'Copy that. Initiating now.',
    timestamp: '9:06 AM',
    status: 'delivered',
  },
];

export const mockCommunities = [
  {
    id: '1',
    name: 'Eastern Command',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=EC',
    members: 156,
    lastActivity: '2h ago',
  },
  {
    id: '2',
    name: 'Navy Communications',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Navy',
    members: 89,
    lastActivity: '5h ago',
  },
  {
    id: '3',
    name: 'Air Force Network',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=AF',
    members: 234,
    lastActivity: '1d ago',
  },
];

export const mockBroadcasts = [
  {
    id: '1',
    title: 'Emergency Alert System',
    recipients: 450,
    lastBroadcast: 'Security drill scheduled',
    timestamp: '1h ago',
  },
  {
    id: '2',
    title: 'Daily Operations',
    recipients: 120,
    lastBroadcast: 'Morning briefing notes',
    timestamp: '3h ago',
  },
];

export const mockCalls = [
  {
    id: '1',
    name: 'Col. Rajesh Sharma',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh',
    type: 'video' as const,
    timestamp: '10:30 AM',
    duration: '12:35',
    status: 'missed' as const,
  },
  {
    id: '2',
    name: 'Major Priya Singh',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    type: 'voice' as const,
    timestamp: '9:15 AM',
    duration: '5:20',
    status: 'completed' as const,
  },
  {
    id: '3',
    name: 'Captain Arun Kumar',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arun',
    type: 'video' as const,
    timestamp: 'Yesterday',
    duration: '25:10',
    status: 'completed' as const,
  },
];
