import express from 'express';
import path from 'path';

const app = express();
const port = 3000;

// Serve static files from the './static' directory
app.use(express.static(path.join(__dirname, '..', 'static')));

// Serve static files from the /dist directory with the correct MIME type
app.use(
  '/dist',
  express.static(path.join(__dirname, '..', '..', 'dist'), {
    setHeaders: (res, filePath) => {
      if (path.extname(filePath) === '.js') {
        res.setHeader('Content-Type', 'application/javascript');
      }
    },
  })
);

// Optionally, add CORS headers if needed
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

const PORT = process.env.PORT || port;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
