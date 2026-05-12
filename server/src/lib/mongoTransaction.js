import mongoose from 'mongoose';

const isTransactionUnsupported = (error) => {
  const message = error?.message || '';

  return (
    error?.code === 20 ||
    error?.codeName === 'IllegalOperation' ||
    message.includes('Transaction numbers are only allowed') ||
    message.includes('replica set member or mongos') ||
    (message.includes('Transaction') && message.includes('not supported'))
  );
};

const isLocalMongoDB = () => {
  const host = mongoose.connection.host;
  return host === '127.0.0.1' || host === 'localhost' || host?.includes('127.0.0.1');
};

export const runWithOptionalTransaction = async (operation) => {
  // Skip transactions entirely for local MongoDB
  if (isLocalMongoDB()) {
    return operation();
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const result = await operation(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction().catch(() => {});
    }

    if (!isTransactionUnsupported(error)) {
      throw error;
    }

    console.warn('MongoDB transactions are unavailable; retrying operation without a transaction.');
    return operation();
  } finally {
    session.endSession();
  }
};
