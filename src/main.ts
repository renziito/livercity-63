import './style.css';
import { Game } from './core/Game';

const loading = document.getElementById('loading')!;
const showLoadingError = (message: string) => {
  loading.style.opacity = '1';
  loading.innerHTML = '<p>NO SE PUDO CARGAR EL MAPA REAL DE LIVERPOOL.</p><small>' + message.replace(/[<>]/g, '') + '</small><p>Recarga la página para volver a intentarlo.</p>';
};

window.addEventListener('livercity-world-ready', () => {
  loading.style.opacity = '0';
  window.setTimeout(() => loading.remove(), 550);
});
window.addEventListener('livercity-world-error', (event) => {
  const detail = (event as CustomEvent<string>).detail || 'Error desconocido';
  showLoadingError(detail);
});

try {
  new Game(document.getElementById('game') as HTMLCanvasElement);
} catch (error) {
  console.error(error);
  showLoadingError('El navegador no pudo iniciar WebGL.');
}
