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
