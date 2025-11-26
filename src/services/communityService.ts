import { Community } from '@/types/community';
import { mockCommunities } from '@/data/mockData';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchCommunities = async (): Promise<Community[]> => {
  await delay(500);
  return mockCommunities;
};

export const createCommunity = async (newCommunity: Community): Promise<Community> => {
  await delay(500);
  mockCommunities.push(newCommunity);
  return newCommunity;
};

export const updateCommunity = async (updatedCommunity: Community): Promise<Community> => {
  await delay(500);
  const index = mockCommunities.findIndex((c) => c.id === updatedCommunity.id);
  if (index !== -1) {
    mockCommunities[index] = updatedCommunity;
  }
  return updatedCommunity;
};

export const deleteCommunity = async (communityId: string): Promise<void> => {
  await delay(500);
  const index = mockCommunities.findIndex((c) => c.id === communityId);
  if (index !== -1) {
    mockCommunities.splice(index, 1);
  }
};
