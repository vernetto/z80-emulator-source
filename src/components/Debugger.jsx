import React, { useState, useEffect } from 'react';

/**
 * Debugger Component
 * 
 * This component provides debugging functionality for the Z80 emulator,
 * including step execution, breakpoints, and execution control.
 */
const Debugger = ({ z80, assembledProgram }) => {
  const [running, setRunning] = useState(false);
  const [breakpoints, setBreakpoints] = useState(new Set());
  const [currentAddress, setCurrentAddress] = useState(0);
  const [executionSpeed, setExecutionSpeed] = useState(10); // Instructions per second
  const [executionHistory, setExecutionHistory] = useState([]);
  const [maxHistorySize, setMaxHistorySize] = useState(100);
  const [stepCount, setStepCount] = useState(0);
  
  // Update current address when Z80 state changes
  useEffect(() => {
    if (z80) {
      setCurrentAddress(z80.registers.pc);
    }
  }, [z80]);
  
  // Handle execution loop
  useEffect(() => {
    let timer = null;
    
    if (running && z80 && !z80.halted) {
      timer = setInterval(() => {
        executeStep();
      }, 1000 / executionSpeed);
    }
    
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [running, z80, executionSpeed]);
  
  // Execute a single instruction
  const executeStep = () => {
    if (!z80 || z80.halted) {
      setRunning(false);
      return;
    }
    
    // Record state before execution
    const prevState = {
      pc: z80.registers.pc,
      instruction: getInstructionAtAddress(z80.registers.pc),
      registers: { ...z80.registers }
    };
    
    // Execute instruction
    z80.step();
    setStepCount(prev => prev + 1);
    
    // Update current address
    setCurrentAddress(z80.registers.pc);
    
    // Add to execution history
    setExecutionHistory(prev => {
      const newHistory = [...prev, prevState];
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        return newHistory.slice(newHistory.length - maxHistorySize);
      }
      return newHistory;
    });
    
    // Check for breakpoints
    if (breakpoints.has(z80.registers.pc)) {
      setRunning(false);
    }
    
    // Check for halt
    if (z80.halted) {
      setRunning(false);
    }
  };
  
  // Get instruction at a specific address
  const getInstructionAtAddress = (address) => {
    if (!assembledProgram) return 'Unknown';
    
    const instruction = assembledProgram.find(item => item.address === address);
    return instruction ? instruction.instruction : 'Unknown';
  };
  
  // Start execution
  const startExecution = () => {
    if (z80 && !z80.halted) {
      setRunning(true);
    }
  };
  
  // Stop execution
  const stopExecution = () => {
    setRunning(false);
  };
  
  // Reset execution
  const resetExecution = () => {
    setRunning(false);
    z80.reset();
    setCurrentAddress(z80.registers.pc);
    setExecutionHistory([]);
    setStepCount(0);
  };
  
  // Toggle breakpoint
  const toggleBreakpoint = (address) => {
    setBreakpoints(prev => {
      const newBreakpoints = new Set(prev);
      if (newBreakpoints.has(address)) {
        newBreakpoints.delete(address);
        z80.clearBreakpoint(address);
      } else {
        newBreakpoints.add(address);
        z80.setBreakpoint(address);
      }
      return newBreakpoints;
    });
  };
  
  // Clear all breakpoints
  const clearAllBreakpoints = () => {
    setBreakpoints(new Set());
    z80.clearAllBreakpoints();
  };
  
  // Format address as hexadecimal
  const formatAddress = (address) => {
    return address.toString(16).padStart(4, '0').toUpperCase();
  };
  
  // Render execution history
  const renderExecutionHistory = () => {
    return executionHistory.slice().reverse().map((item, index) => (
      <div key={index} className="history-item">
        <div className="history-address">{formatAddress(item.pc)}</div>
        <div className="history-instruction">{item.instruction}</div>
      </div>
    ));
  };
  
  // Render program listing with breakpoints and current position
  const renderProgramListing = () => {
    if (!assembledProgram || assembledProgram.length === 0) {
      return <div className="no-program">No program loaded</div>;
    }
    
    return assembledProgram.map((item, index) => (
      <div 
        key={index} 
        className={`program-line ${item.address === currentAddress ? 'current-line' : ''}`}
      >
        <div 
          className={`breakpoint-marker ${breakpoints.has(item.address) ? 'active' : ''}`}
          onClick={() => toggleBreakpoint(item.address)}
        >
          {breakpoints.has(item.address) ? '●' : '○'}
        </div>
        <div className="program-address">{formatAddress(item.address)}</div>
        <div className="program-bytes">
          {item.bytes.map(byte => 
            byte.toString(16).padStart(2, '0').toUpperCase()
          ).join(' ')}
        </div>
        <div className="program-instruction">{item.instruction}</div>
      </div>
    ));
  };
  
  return (
    <div className="debugger">
      <h2>Z80 Debugger</h2>
      
      <div className="debug-controls">
        <div className="execution-controls">
          <button 
            onClick={executeStep} 
            disabled={running || !z80 || z80.halted}
          >
            Step
          </button>
          <button 
            onClick={startExecution} 
            disabled={running || !z80 || z80.halted}
          >
            Run
          </button>
          <button 
            onClick={stopExecution} 
            disabled={!running}
          >
            Stop
          </button>
          <button onClick={resetExecution}>Reset</button>
        </div>
        
        <div className="speed-control">
          <label htmlFor="execution-speed">Speed:</label>
          <input
            id="execution-speed"
            type="range"
            min="1"
            max="1000"
            value={executionSpeed}
            onChange={(e) => setExecutionSpeed(parseInt(e.target.value))}
          />
          <span>{executionSpeed} inst/sec</span>
        </div>
        
        <div className="breakpoint-controls">
          <button onClick={clearAllBreakpoints}>Clear Breakpoints</button>
        </div>
      </div>
      
      <div className="debug-status">
        <div className="status-item">
          <span className="status-label">PC:</span>
          <span className="status-value">{formatAddress(currentAddress)}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Status:</span>
          <span className="status-value">
            {z80?.halted ? 'Halted' : running ? 'Running' : 'Stopped'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Steps:</span>
          <span className="status-value">{stepCount}</span>
        </div>
      </div>
      
      <div className="debug-container">
        <div className="program-listing">
          <h3>Program Listing</h3>
          <div className="listing-header">
            <div className="breakpoint-header">BP</div>
            <div className="address-header">Address</div>
            <div className="bytes-header">Bytes</div>
            <div className="instruction-header">Instruction</div>
          </div>
          <div className="listing-content">
            {renderProgramListing()}
          </div>
        </div>
        
        <div className="execution-history">
          <h3>Execution History</h3>
          <div className="history-header">
            <div className="history-address-header">Address</div>
            <div className="history-instruction-header">Instruction</div>
          </div>
          <div className="history-content">
            {renderExecutionHistory()}
          </div>
          <div className="history-controls">
            <label htmlFor="history-size">History Size:</label>
            <input
              id="history-size"
              type="number"
              min="10"
              max="1000"
              value={maxHistorySize}
              onChange={(e) => setMaxHistorySize(parseInt(e.target.value))}
            />
            <button onClick={() => setExecutionHistory([])}>Clear History</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Debugger;
