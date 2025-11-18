exports.handler = async function (event, context) {
  const { pickupLocation, deliveryLocation, userId } = JSON.parse(event.body);

  // In a real application, you would save this to a database
  console.log('Creating errand:', { pickupLocation, deliveryLocation, userId });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Errand created successfully' }),
  };
};
