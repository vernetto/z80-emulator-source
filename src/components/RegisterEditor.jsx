import React, { useState, useEffect } from 'react';

/**
 * RegisterEditor Component
 * 
 * This component provides a UI for viewing and editing Z80 CPU registers.
 * It displays all registers and flags, allowing users to modify their values.
 */
const RegisterEditor = ({ z80, onRegisterChange }) => {
  const [registers, setRegisters] = useState({});
  const [flags, setFlags] = useState({});

  // Update local state when Z80 state changes
  useEffect(() => {
    if (z80) {
      const state = z80.getState();
      setRegisters(state.registers);
      setFlags(state.flags);
    }
  }, [z80]);

  // Handle register value change
  const handleRegisterChange = (register, value) => {
    // Convert input to number and ensure it's within valid range
    let numValue = parseInt(value, 16);
    
    // Validate input
    if (isNaN(numValue)) {
      numValue = 0;
    }
    
    // Apply appropriate range limits based on register type
    if (['a', 'b', 'c', 'd', 'e', 'h', 'l', 'i', 'r', 
         'a_prime', 'b_prime', 'c_prime', 'd_prime', 'e_prime', 'h_prime', 'l_prime'].includes(register)) {
      // 8-bit registers (0-255)
      numValue = Math.max(0, Math.min(255, numValue));
    } else if (['ix', 'iy', 'sp', 'pc'].includes(register)) {
      // 16-bit registers (0-65535)
      numValue = Math.max(0, Math.min(65535, numValue));
    }
    
    // Update Z80 state
    const newState = {
      registers: { ...registers, [register]: numValue }
    };
    
    z80.setState(newState);
    
    // Update local state
    setRegisters(prev => ({ ...prev, [register]: numValue }));
    
    // Notify parent component
    if (onRegisterChange) {
      onRegisterChange(register, numValue);
    }
  };

  // Handle flag value change
  const handleFlagChange = (flag, checked) => {
    const value = checked ? 1 : 0;
    
    // Update Z80 state
    const newState = {
      flags: { ...flags, [flag]: value }
    };
    
    z80.setState(newState);
    
    // Update local state
    setFlags(prev => ({ ...prev, [flag]: value }));
    
    // Notify parent component
    if (onRegisterChange) {
      onRegisterChange(`flag_${flag}`, value);
    }
  };

  // Format register value as hexadecimal
  const formatRegister = (value, bits = 8) => {
    if (value === undefined) return '';
    const mask = bits === 8 ? 0xFF : 0xFFFF;
    const padLength = bits === 8 ? 2 : 4;
    return (value & mask).toString(16).toUpperCase().padStart(padLength, '0');
  };

  // Get register pair value
  const getRegisterPair = (high, low) => {
    if (registers[high] === undefined || registers[low] === undefined) return '';
    return ((registers[high] << 8) | registers[low]).toString(16).toUpperCase().padStart(4, '0');
  };

  return (
    <div className="register-editor">
      <h2>Z80 Registers</h2>
      
      <div className="register-section">
        <h3>Main Registers</h3>
        <div className="register-grid">
          <div className="register-row">
            <div className="register-label">A:</div>
            <input
              type="text"
              value={formatRegister(registers.a)}
              onChange={(e) => handleRegisterChange('a', e.target.value)}
              className="register-input"
              maxLength={2}
            />
            <div className="register-label">F:</div>
            <div className="register-value">{formatRegister(z80?.getF())}</div>
          </div>
          
          <div className="register-row">
            <div className="register-label">B:</div>
            <input
              type="text"
              value={formatRegister(registers.b)}
              onChange={(e) => handleRegisterChange('b', e.target.value)}
              className="register-input"
              maxLength={2}
            />
            <div className="register-label">C:</div>
            <input
              type="text"
              value={formatRegister(registers.c)}
              onChange={(e) => handleRegisterChange('c', e.target.value)}
              className="register-input"
              maxLength={2}
            />
            <div className="register-label">BC:</div>
            <div className="register-value">{getRegisterPair('b', 'c')}</div>
          </div>
          
          <div className="register-row">
            <div className="register-label">D:</div>
            <input
              type="text"
              value={formatRegister(registers.d)}
              onChange={(e) => handleRegisterChange('d', e.target.value)}
              className="register-input"
              maxLength={2}
            />
            <div className="register-label">E:</div>
            <input
              type="text"
              value={formatRegister(registers.e)}
              onChange={(e) => handleRegisterChange('e', e.target.value)}
              className="register-input"
              maxLength={2}
            />
            <div className="register-label">DE:</div>
            <div className="register-value">{getRegisterPair('d', 'e')}</div>
          </div>
          
          <div className="register-row">
            <div className="register-label">H:</div>
            <input
              type="text"
              value={formatRegister(registers.h)}
              onChange={(e) => handleRegisterChange('h', e.target.value)}
              className="register-input"
              maxLength={2}
            />
            <div className="register-label">L:</div>
            <input
              type="text"
              value={formatRegister(registers.l)}
              onChange={(e) => handleRegisterChange('l', e.target.value)}
              className="register-input"
              maxLength={2}
            />
            <div className="register-label">HL:</div>
            <div className="register-value">{getRegisterPair('h', 'l')}</div>
          </div>
        </div>
      </div>
      
      <div className="register-section">
        <h3>Alternate Registers</h3>
        <div className="register-grid">
          <div className="register-row">
            <div className="register-label">A':</div>
            <input
              type="text"
              value={formatRegister(registers.a_prime)}
              onChange={(e) => handleRegisterChange('a_prime', e.target.value)}
              className="register-input"
              maxLength={2}
            />
            <div className="register-label">F':</div>
            <div className="register-value">{formatRegister(0)}</div>
          </div>
          
          <div className="register-row">
            <div className="register-label">B':</div>
            <input
              type="text"
              value={formatRegister(registers.b_prime)}
              onChange={(e) => handleRegisterChange('b_prime', e.target.value)}
              className="register-input"
              maxLength={2}
            />
            <div className="register-label">C':</div>
            <input
              type="text"
              value={formatRegister(registers.c_prime)}
              onChange={(e) => handleRegisterChange('c_prime', e.target.value)}
              className="register-input"
              maxLength={2}
            />
          </div>
          
          <div className="register-row">
            <div className="register-label">D':</div>
            <input
              type="text"
              value={formatRegister(registers.d_prime)}
              onChange={(e) => handleRegisterChange('d_prime', e.target.value)}
              className="register-input"
              maxLength={2}
            />
            <div className="register-label">E':</div>
            <input
              type="text"
              value={formatRegister(registers.e_prime)}
              onChange={(e) => handleRegisterChange('e_prime', e.target.value)}
              className="register-input"
              maxLength={2}
            />
          </div>
          
          <div className="register-row">
            <div className="register-label">H':</div>
            <input
              type="text"
              value={formatRegister(registers.h_prime)}
              onChange={(e) => handleRegisterChange('h_prime', e.target.value)}
              className="register-input"
              maxLength={2}
            />
            <div className="register-label">L':</div>
            <input
              type="text"
              value={formatRegister(registers.l_prime)}
              onChange={(e) => handleRegisterChange('l_prime', e.target.value)}
              className="register-input"
              maxLength={2}
            />
          </div>
        </div>
      </div>
      
      <div className="register-section">
        <h3>Special Registers</h3>
        <div className="register-grid">
          <div className="register-row">
            <div className="register-label">IX:</div>
            <input
              type="text"
              value={formatRegister(registers.ix, 16)}
              onChange={(e) => handleRegisterChange('ix', e.target.value)}
              className="register-input"
              maxLength={4}
            />
          </div>
          
          <div className="register-row">
            <div className="register-label">IY:</div>
            <input
              type="text"
              value={formatRegister(registers.iy, 16)}
              onChange={(e) => handleRegisterChange('iy', e.target.value)}
              className="register-input"
              maxLength={4}
            />
          </div>
          
          <div className="register-row">
            <div className="register-label">SP:</div>
            <input
              type="text"
              value={formatRegister(registers.sp, 16)}
              onChange={(e) => handleRegisterChange('sp', e.target.value)}
              className="register-input"
              maxLength={4}
            />
          </div>
          
          <div className="register-row">
            <div className="register-label">PC:</div>
            <input
              type="text"
              value={formatRegister(registers.pc, 16)}
              onChange={(e) => handleRegisterChange('pc', e.target.value)}
              className="register-input"
              maxLength={4}
            />
          </div>
          
          <div className="register-row">
            <div className="register-label">I:</div>
            <input
              type="text"
              value={formatRegister(registers.i)}
              onChange={(e) => handleRegisterChange('i', e.target.value)}
              className="register-input"
              maxLength={2}
            />
          </div>
          
          <div className="register-row">
            <div className="register-label">R:</div>
            <input
              type="text"
              value={formatRegister(registers.r)}
              onChange={(e) => handleRegisterChange('r', e.target.value)}
              className="register-input"
              maxLength={2}
            />
          </div>
        </div>
      </div>
      
      <div className="register-section">
        <h3>Flags</h3>
        <div className="flags-grid">
          <div className="flag-item">
            <input
              type="checkbox"
              id="flag-s"
              checked={flags.s === 1}
              onChange={(e) => handleFlagChange('s', e.target.checked)}
            />
            <label htmlFor="flag-s">S (Sign)</label>
          </div>
          
          <div className="flag-item">
            <input
              type="checkbox"
              id="flag-z"
              checked={flags.z === 1}
              onChange={(e) => handleFlagChange('z', e.target.checked)}
            />
            <label htmlFor="flag-z">Z (Zero)</label>
          </div>
          
          <div className="flag-item">
            <input
              type="checkbox"
              id="flag-h"
              checked={flags.h === 1}
              onChange={(e) => handleFlagChange('h', e.target.checked)}
            />
            <label htmlFor="flag-h">H (Half Carry)</label>
          </div>
          
          <div className="flag-item">
            <input
              type="checkbox"
              id="flag-pv"
              checked={flags.pv === 1}
              onChange={(e) => handleFlagChange('pv', e.target.checked)}
            />
            <label htmlFor="flag-pv">P/V (Parity/Overflow)</label>
          </div>
          
          <div className="flag-item">
            <input
              type="checkbox"
              id="flag-n"
              checked={flags.n === 1}
              onChange={(e) => handleFlagChange('n', e.target.checked)}
            />
            <label htmlFor="flag-n">N (Add/Subtract)</label>
          </div>
          
          <div className="flag-item">
            <input
              type="checkbox"
              id="flag-c"
              checked={flags.c === 1}
              onChange={(e) => handleFlagChange('c', e.target.checked)}
            />
            <label htmlFor="flag-c">C (Carry)</label>
          </div>
        </div>
      </div>
      
      <div className="register-actions">
        <button onClick={() => z80.reset()}>Reset Registers</button>
        <button onClick={() => z80.exchangeRegisterSets()}>Exchange Register Sets</button>
      </div>
    </div>
  );
};

export default RegisterEditor;
