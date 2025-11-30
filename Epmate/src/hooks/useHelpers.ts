import useSWR from 'swr';
import React from 'react';

const fetcher = (url: string): Promise<any> =>
  fetch(url).then(res => res.json());

// Define expected response type
export interface HelperData {
  image: string | null;
  id: string;
  name: string;
  tagPrice: number;
  totalTasks: number;
  rating: number;
  distance: number;
  phone?: string;
  tasks?: number;
  [key: string]: any;
}

// Hardcoded helpers for development
// TODO: Replace with actual backend API call in production
const DEVELOPMENT_HELPERS: HelperData[] = [
  {
    id: '1',
    name: 'John Doe',
    tagPrice: 1500,
    rating: 4.5,
    tasks: 120,
    distance: 2.3,
    image: 'https://i.pravatar.cc/150?img=1',
    totalTasks: 120,
  },
  {
    id: '2',
    name: 'Jane Smith',
    tagPrice: 2250,
    rating: 4.7,
    tasks: 98,
    distance: 1.8,
    image: 'https://i.pravatar.cc/150?img=2',
    totalTasks: 98,
  },
  {
    id: '3',
    name: 'Mike Johnson',
    tagPrice: 10250,
    rating: 4.2,
    tasks: 75,
    distance: 3.1,
    image: 'https://i.pravatar.cc/150?img=3',
    totalTasks: 75,
  },
  {
    id: '4',
    name: 'Jude Dickson',
    tagPrice: 1700,
    rating: 4.9,
    tasks: 75,
    distance: 1,
    image: 'https://i.pravatar.cc/150?img=4',
    totalTasks: 275,
  },
  {
    id: '5',
    name: 'Joyce George',
    tagPrice: 1200,
    rating: 4.9,
    tasks: 75,
    distance: 15,
    image: 'https://i.pravatar.cc/150?img=5',
    totalTasks: 275,
  },
];

export const useHelpers = () => {
  // For development, return hardcoded data
  // TODO: Uncomment below for production API call
  /*
  const { data, error } = useSWR<HelperData[]>(
    '/.netlify/functions/getHelpers',
    fetcher,
  );

  return {
    helpers: data,
    isLoading: !error && !data,
    isError: error,
  };
  */

  // Development mode - return hardcoded data with simulated loading
  const [data, setData] = React.useState<HelperData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let timer: number;
    
    if (__DEV__) {
        // Simulate network delay in development
        timer = setTimeout(() => {
            setData(DEVELOPMENT_HELPERS);
            setIsLoading(false);
        }, 1000);
    } else {
        // In production, set data immediately (or fetch real data)
        setData(DEVELOPMENT_HELPERS);
        setIsLoading(false);
    }

    return () => {
        if (timer) clearTimeout(timer);
    };
  }, []);

  return {
    helpers: data,
    isLoading,
    isError: false,
  };
};
