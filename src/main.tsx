import ReactDOM from 'react-dom/client';
import App from './App';

// 移除 index.html 中的预加载占位
const splash = document.getElementById('boot-splash');
if (splash) splash.remove();

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
