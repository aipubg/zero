// The rooms of the sidebar. Each one groups related pages under tabs.
import { renderRoom } from '../room.js';

export const ROOMS = {
  computer: {
    base: '/computer', title: 'Computer',
    tabs: [
      { id: 'desktop', label: 'Desktop', icon: 'computer', load: () => import('./computer.js') },
      { id: 'screen', label: 'Screen share', icon: 'screen', load: () => import('./screen.js') },
    ],
  },
  work: {
    base: '/work', title: 'Work',
    tabs: [
      { id: 'tasks', label: 'Tasks', icon: 'tasks', load: () => import('./tasks.js') },
      { id: 'automations', label: 'Automations', icon: 'clock', load: () => import('./automations.js') },
      { id: 'agents', label: 'Agents', icon: 'agents', load: () => import('./agents.js') },
    ],
  },
  knowledge: {
    base: '/knowledge', title: 'Knowledge',
    tabs: [
      { id: 'memory', label: 'Memory', icon: 'memory', load: () => import('./memory.js') },
      { id: 'skills', label: 'Skills & Plugins', icon: 'skills', load: () => import('./skills.js') },
      { id: 'research', label: 'Research', icon: 'search', load: () => import('./research.js') },
    ],
  },
};

export const roomRenderer = name => ({ render: (root, ctx) => renderRoom(root, ctx, ROOMS[name]) });
