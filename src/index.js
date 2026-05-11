import 'dotenv/config';
import app from './app.js';
import { startTokenCleanupJob } from './jobs/tokenCleanup.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  startTokenCleanupJob();
});
