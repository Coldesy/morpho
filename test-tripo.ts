import { createTripoTask, pollTripoTask } from './src/lib/tripo.ts';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  console.log('Testing Tripo API with key:', process.env.TRIPO_API_KEY ? 'Set' : 'Not Set');
  try {
    const taskId = await createTripoTask('a small green apple');
    console.log('Task Created:', taskId);
    
    const url = await pollTripoTask(taskId);
    console.log('Model URL:', url);
  } catch (err) {
    console.error('Error:', err);
  }
}
main();
