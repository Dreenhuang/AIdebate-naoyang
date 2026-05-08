import Header from './components/Header';
import ConfigPanel from './components/ConfigPanel';
import MessageStream from './components/MessageStream';
import StatusBar from './components/StatusBar';
import FileManager from './components/FileManager';
import { useWebSocket } from './hooks/useWebSocket';
import { useDebateStore } from './stores/debateStore';

function App() {
  const { send } = useWebSocket();
  const { reset } = useDebateStore();

  const handleStart = () => {
    const { config } = useDebateStore.getState();
    send('debate:start', config);
  };

  const handleStop = () => {
    send('debate:stop');
  };

  const handleReset = () => {
    reset();
    send('debate:reset');
  };

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <ConfigPanel 
          onStart={handleStart}
          onStop={handleStop}
          onReset={handleReset}
        />
        
        <div className="flex-1 flex flex-col min-w-0">
          <MessageStream />
          <StatusBar />
          <FileManager />
        </div>
      </div>
    </div>
  );
}

export default App;
