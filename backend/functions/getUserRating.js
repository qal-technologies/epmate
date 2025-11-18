exports.handler = async function (event, context) {
  // In a real application, you would fetch the user's rating from a database
  const mockRating = 4.85;

  return {
    statusCode: 200,
    body: JSON.stringify({ rating: mockRating }),
  };
};
