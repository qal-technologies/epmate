import useSWR from 'swr';

const fetcher = (url: string): Promise<any> =>
  fetch(url).then(res => res.json());

// Define expected response type
export interface HelperData {
  id: string;
  name: string;
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
