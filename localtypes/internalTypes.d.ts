export interface Dealership {
  name: string;
  website: {
    url: string;
    type: "edealer";
    requestUrl?: string;
  } | {
    url: string;
    type: "wordpress";
    cp: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface DealershipWithInventory extends Dealership {
  inventory: Inventory[];
}

export interface Inventory {
  model: string;
  trim: string;
  year: number;
  url: string;
  vin?: string;
  id: string;
  exterior_color: string;
  msrp: number;
  // Some dealers will show you the invoice price if you ask, but don’t expect to see the dealer cost.
  // You can come up with a very rough estimate by calculating that 1-to-3 percent (or so) of the MSRP and deducting it
  days_on_lot: number | undefined;
  freight: number | undefined;
}
