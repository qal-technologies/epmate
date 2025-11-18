import useSWR from 'swr';

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export const useUserRating = () => {
  const { data, error } = useSWR('/.netlify/functions/getUserRating', fetcher);

  return {
    rating: data?.rating,
    isLoading: !error && !data,
    isError: error,
  };
};
