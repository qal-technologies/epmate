import useSWR from 'swr';

const fetcher = (url: string): Promise<any> =>
  fetch(url).then(res => res.json());

// Define server response type
interface UserRatingResponse {
  rating: number;
  userId?: string;
  [key: string]: any;
}

export const useUserRating = () => {
  const { data, error } = useSWR<UserRatingResponse>(
    '/.netlify/functions/getUserRating',
    fetcher,
  );

  return {
    rating: data?.rating,
    isLoading: !error && !data,
    isError: error,
  };
};
