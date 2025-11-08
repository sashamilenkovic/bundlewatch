import { createSignal, onMount, onCleanup } from 'solid-js';
import { format } from 'date-fns';
import axios from 'axios';

export default function Home() {
  const [time, setTime] = createSignal(new Date());
  const [data, setData] = createSignal('Loading...');

  onMount(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    axios.get('https://api.github.com/repos/anthropics/claude-code')
      .then(res => setData(res.data.description))
      .catch(() => setData('Bundle Watch + SolidStart Example'));

    onCleanup(() => clearInterval(timer));
  });

  return (
    <div class="container">
      <h1>📦 Bundle Watch + SolidStart</h1>
      <p class="time">{format(time(), 'PPpp')}</p>
      <p class="description">{data()}</p>
      <div class="card">
        <p>This SolidStart app uses Bundle Watch via the Vite plugin!</p>
        <p>Check <code>bundle-report/index.html</code> after building.</p>
      </div>
    </div>
  );
}
