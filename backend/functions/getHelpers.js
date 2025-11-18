exports.handler = async function (event, context) {
  const mockHelpers = [
    { id: '1', name: 'John Doe', rating: 4.8, tasks: 120, distance: '5 mins' },
    { id: '2', name: 'Jane Smith', rating: 4.9, tasks: 150, distance: '8 mins' },
  ];

  return {
    statusCode: 200,
    body: JSON.stringify(mockHelpers),
  };
};
