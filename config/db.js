import mongoose from 'mongoose';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const fallbackUri = process.env.MONGO_URI_FALLBACK || process.env.MONGODB_URI;

  let lastError;

  // Try up to 3 times, switching to fallback if SRV/DNS fails
  for (let attempt = 1; attempt <= 3; attempt++) {
    const usingFallback =
      !!lastError &&
      fallbackUri &&
      /ESERVFAIL|ENOTFOUND|querySrv/i.test(String(lastError?.message));
    const uri = usingFallback ? fallbackUri : primaryUri;

    try {
      if (!uri) throw new Error('MONGO_URI is not set');

      const conn = await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 8000,
        family: 4, // Prefer IPv4 to avoid some DNS/IPv6 issues
      });
      console.log(
        `MongoDB Connected: ${conn.connection.host} to database: ${conn.connection.name}`,
      );
      return conn;
    } catch (error) {
      lastError = error;
      console.error(`MongoDB connection attempt ${attempt} failed:`, error.message);

      // If this looks like an SRV/DNS error and we have a fallback, try it next
      if (attempt < 3) {
        await sleep(1000 * attempt); // backoff
        continue;
      }
    }
  }

  console.error('MongoDB Connection Error:', lastError);
  console.error(
    'Tips: If using mongodb+srv, ensure DNS works or set MONGO_URI_FALLBACK to a mongodb://host:port URI.',
  );
  process.exit(1);
};

export default connectDB;
