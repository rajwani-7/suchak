export interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  status: 'online' | 'offline';
  isGroup?: boolean;
  isFavorite?: boolean;
  isContact?: boolean;
  participants?: string[];
  isDraft?: boolean;
}

export const mockChats: Chat[] = [
  {
    id: '1',
    name: 'Harsh (You)',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Harsh',
    lastMessage: '✓✓ Image',
    timestamp: '07:15',
    unread: 0,
    status: 'online',
    isContact: true,
    isFavorite: true,
  },
  {
    id: '2',
    name: 'IIT Guwahati',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=IIT',
    lastMessage: '✓✓✓ You: CV(HARSH RAJWANI).pdf 1 p...',
    timestamp: '05-11-2025',
    unread: 0,
    status: 'online',
    isGroup: true,
    isContact: true,
  },
  {
    id: '3',
    name: 'Vishal Hilal 3-2-2004',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vishal',
    lastMessage: 'You reacted 👍 to "Jo achha lagega vo fina"',
    timestamp: '07:05',
    unread: 0,
    status: 'online',
    isContact: true,
  },
  {
    id: '4',
    name: 'Himanshu Pu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Himanshu',
    lastMessage: 'You reacted 👍 to "Soja ab"',
    timestamp: '01:47',
    unread: 0,
    status: 'offline',
    isContact: true,
  },
  {
    id: '5',
    name: 'SIH 2025',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=SIH',
    lastMessage: '✔ You: suchak.rar',
    timestamp: '01:43',
    unread: 0,
    status: 'online',
    isGroup: true,
    isContact: true,
    participants: ['Armaan (MCA)', 'Harshil', 'Preyank(mca)(13/01/2004)', 'Vaishnavi', 'Vishal', 'You'],
  },
  {
    id: '6',
    name: 'Kamal Bhaiya',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kamal',
    lastMessage: '✓✓ Android TV - Old version. App-based, s...',
    timestamp: '00:19',
    unread: 0,
    status: 'online',
    isContact: true,
  },
  {
    id: '7',
    name: 'Bhai(PU Cs)',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bhai',
    lastMessage: '✓✓ https://securecomms-connect.vercel.ap...',
    timestamp: '00:04',
    unread: 0,
    status: 'offline',
    isContact: true,
  },
  {
    id: '8',
    name: 'Mummy',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mummy',
    lastMessage: '✓✓ Image',
    timestamp: 'Yesterday',
    unread: 0,
    status: 'offline',
    isContact: true,
    isFavorite: true,
  },
  {
    id: '9',
    name: 'SU MCA Sem 3 (2024 - 26)',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=SU',
    lastMessage: 'Khyati Mam (HOD): Dear students come wi...',
    timestamp: 'Yesterday',
    unread: 9,
    status: 'online',
    isGroup: true,
    isContact: true,
  },
  {
    id: '10',
    name: 'Col. Rajesh Sharma',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh',
    lastMessage: 'Mission briefing at 1400 hours',
    timestamp: '10:30 AM',
    unread: 2,
    status: 'online',
    isContact: true,
  },
  {
    id: '11',
    name: 'Major Priya Singh',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    lastMessage: 'Coordinates received',
    timestamp: '9:15 AM',
    unread: 0,
    status: 'offline',
    isContact: true,
  },
  {
    id: '12',
    name: 'Northern Command',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=NC',
    lastMessage: 'Weather update for sector 5',
    timestamp: 'Yesterday',
    unread: 5,
    status: 'online',
    isGroup: true,
    isContact: true,
  },
];

export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  text?: string;
  timestamp: string;
  status: 'pending' | 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'file' | 'link' | 'audio';
  file?: {
    name: string;
    size: string;
    type: string;
  };
  audio?: {
    url: string; // object URL or hosted URL
    duration?: number; // seconds
    size?: number; // bytes
  };
  link?: {
    url: string;
    title: string;
    description: string;
    preview?: string;
  };
  image?: string;
  reactions?: { emoji: string; users: string[] }[];
  isEdited?: boolean;
}

export const mockMessages: Record<string, Message[]> = {
  '5': [ // SIH 2025
    {
      id: '1',
      senderId: '2-2004',
      senderName: 'Vishal Hilal 3-2-2004',
      text: '',
      timestamp: '15:38',
      status: 'read',
      type: 'file',
      file: {
        name: 'SUCHAK-Secure Communication App_v1.pdf',
        size: '6 pages',
        type: 'PDF',
      },
    },
    {
      id: '2',
      senderId: '2-2004',
      senderName: 'Vishal Hilal 3-2-2004',
      text: '',
      timestamp: '15:38',
      status: 'read',
      type: 'image',
      image: 'https://via.placeholder.com/300x200?text=Smart+India+Hackathon+2023',
    },
    {
      id: '3',
      senderId: '2-2004',
      senderName: 'Vishal Hilal 3-2-2004',
      text: 'man hai AICTE ke',
      timestamp: '15:38',
      status: 'read',
      type: 'text',
    },
    {
      id: '4',
      senderId: '2-2004',
      senderName: 'Vishal Hilal 3-2-2004',
      text: 'kal compulsory join ho jana',
      timestamp: '15:38',
      status: 'read',
      type: 'text',
    },
    {
      id: '5',
      senderId: '2-2004',
      senderName: 'Vishal Hilal 3-2-2004',
      text: 'Important updates and instructions milenge kal',
      timestamp: '15:39',
      status: 'read',
      type: 'text',
      isEdited: true,
    },
    {
      id: '6',
      senderId: 'me',
      text: '',
      timestamp: '01:39',
      status: 'read',
      type: 'link',
      link: {
        url: 'https://suchak0.netlify.app/',
        title: 'SUCHAK - Secure Defence...',
        description: 'End-to-end encrypted communication platform for defence personnel',
      },
    },
    {
      id: '7',
      senderId: 'me',
      text: '',
      timestamp: '01:43',
      status: 'sent',
      type: 'file',
      file: {
        name: 'suchak.rar',
        size: '55 MB',
        type: 'WinRAR archive',
      },
    },
  ],
  '1': [
    {
      id: '1',
      senderId: 'other',
      text: 'Good morning. Status report ready?',
      timestamp: '9:00 AM',
      status: 'read',
      type: 'text',
    },
    {
      id: '2',
      senderId: 'me',
      text: 'Yes sir, all systems operational',
      timestamp: '9:02 AM',
      status: 'read',
      type: 'text',
    },
    {
      id: '3',
      senderId: 'other',
      text: 'Excellent. Proceed with phase 2',
      timestamp: '9:05 AM',
      status: 'read',
      type: 'text',
    },
    {
      id: '4',
      senderId: 'me',
      text: 'Copy that. Initiating now.',
      timestamp: '9:06 AM',
      status: 'delivered',
      type: 'text',
    },
  ],
};

export const getMessagesForChat = (chatId: string): Message[] => {
  return mockMessages[chatId] || mockMessages['1'] || [];
};

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

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  status?: string;
  isAvailable?: boolean;
}

export const frequentlyContacted: Contact[] = [
  {
    id: '1',
    name: 'Harsh (You)',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Harsh',
    status: 'Message yourself',
    isAvailable: true,
  },
  {
    id: '2',
    name: 'Chacha',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chacha',
    status: 'Available',
    isAvailable: true,
  },
  {
    id: '3',
    name: 'Dharmi Patel',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dharmi',
    status: 'Available',
    isAvailable: true,
  },
  {
    id: '4',
    name: 'Bhadresh (Mca)',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bhadresh',
    status: 'Available',
    isAvailable: true,
  },
  {
    id: '5',
    name: 'Vishal Hilal 3-2-2004',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vishal',
    status: 'Believe In Yourself',
    isAvailable: false,
  },
];
