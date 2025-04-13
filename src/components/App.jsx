import React, { useState, useEffect } from 'react';
import Z80Core from '../emulator/Z80Core';
import RegisterEditor from './RegisterEditor';
import MemoryEditor from './MemoryEditor';
import AsmEditor from './AsmEditor';
import Debugger from './Debugger';
import './App.css';

/**
 * Main App Component
 * 
 * This component integrates all the Z80 emulator components into a cohesive application.
 */
const App = () => {
  const [z80, setZ80] = useState(null);
  const [assembledProgram, setAssembledProgram] = useState([]);
  const [activeTab, setActiveTab] = useState('registers');
  
  // Initialize Z80 emulator
  useEffect(() => {
    const emulator = new Z80Core();
    emulator.reset();
    setZ80(emulator);
  }, []);
  
  // Handle program load
  const handleProgramLoad = (program, startAddress) => {
    setAssembledProgram(program);
  };
  
  // Handle register change
  const handleRegisterChange = (register, value) => {
    // This function can be used to trigger updates when registers change
    // For now, we'll just use it to force a re-render
    setZ80(prevZ80 => ({ ...prevZ80 }));
  };
  
  // Handle memory change
  const handleMemoryChange = (address, value) => {
    // This function can be used to trigger updates when memory changes
    // For now, we'll just use it to force a re-render
    setZ80(prevZ80 => ({ ...prevZ80 }));
  };
  
  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'registers':
        return <RegisterEditor z80={z80} onRegisterChange={handleRegisterChange} />;
      case 'memory':
        return <MemoryEditor z80={z80} onMemoryChange={handleMemoryChange} />;
      case 'assembly':
        return <AsmEditor z80={z80} onProgramLoad={handleProgramLoad} />;
      case 'debug':
        return <Debugger z80={z80} assembledProgram={assembledProgram} />;
      default:
        return <div>Select a tab</div>;
    }
  };
  
  return (
    <div className="app">
      <header className="app-header">
        <h1>Z80 Emulator</h1>
        <p>A React-based Z80 CPU emulator with debugging capabilities</p>
      </header>
      
      <div className="app-container">
        <div className="app-tabs">
          <button 
            className={`tab-button ${activeTab === 'registers' ? 'active' : ''}`}
            onClick={() => setActiveTab('registers')}
          >
            Registers
          </button>
          <button 
            className={`tab-button ${activeTab === 'memory' ? 'active' : ''}`}
            onClick={() => setActiveTab('memory')}
          >
            Memory
          </button>
          <button 
            className={`tab-button ${activeTab === 'assembly' ? 'active' : ''}`}
            onClick={() => setActiveTab('assembly')}
          >
            Assembly
          </button>
          <button 
            className={`tab-button ${activeTab === 'debug' ? 'active' : ''}`}
            onClick={() => setActiveTab('debug')}
          >
            Debug
          </button>
        </div>
        
        <div className="app-content">
          {renderTabContent()}
        </div>
      </div>
      
      <footer className="app-footer">
        <p>Z80 Emulator - Built with React</p>
      </footer>
    </div>
  );
};

export default App;
