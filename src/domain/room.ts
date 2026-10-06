export type RoomFilters = {
  minCapacity?: number;
  features: string[];
};

export type FeatureSummary = {
  slug: string;
  name: string;
};

export type RoomListItem = {
  id: string;
  name: string;
  capacity: number;
  location: string | null;
  features: FeatureSummary[];
};

export type AdminRoomListItem = RoomListItem & { isActive: boolean };

export type RoomDetails = {
  id: string;
  name: string;
  capacity: number;
  location: string | null;
  description: string | null;
  isActive: boolean;
  featureSlugs: string[];
};
