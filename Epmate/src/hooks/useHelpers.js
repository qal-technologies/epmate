import useSWR from 'swr';

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export const useHelpers = () => {
  const { data, error } = useSWR('/.netlify/functions/getHelpers', fetcher);

  return {
    helpers: data,
    isLoading: !error && !data,
    isError: error,
  };
};
