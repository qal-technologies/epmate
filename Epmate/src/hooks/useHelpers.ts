import useSWR from 'swr';

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
  [key: string]: any;
}

export const useHelpers = () => {
  const { data, error } = useSWR<HelperData[]>(
    '/.netlify/functions/getHelpers',
    fetcher,
  );

  return {
    helpers: data,
    isLoading: !error && !data,
    isError: error,
  };
};
