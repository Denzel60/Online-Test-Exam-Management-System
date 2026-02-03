import express from 'express';

const app = express();
app.listen(3000, () => {
  console.log('Server is running on port 3000');

app.get('/', (req, res) => {
  res.send('Hello, World!');
});
app.post('/data', (req, res) => {
  res.send('Data received');    
});
app.patch('/update', (req, res) => {
  res.send('Update successful');    
});
app.delete('/remove', (req, res) => {
  res.send('Remove successful');    
});
});

