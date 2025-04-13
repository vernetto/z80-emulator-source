/**
 * Z80 Emulator Core
 * 
 * This module implements the core functionality of a Z80 CPU emulator,
 * including registers, flags, memory, and instruction execution.
 */

class Z80Core {
  constructor() {
    // Initialize registers
    this.registers = {
      // Main registers
      a: 0, b: 0, c: 0, d: 0, e: 0, h: 0, l: 0,
      // Alternate registers
      a_prime: 0, b_prime: 0, c_prime: 0, d_prime: 0, e_prime: 0, h_prime: 0, l_prime: 0,
      // Special registers
      i: 0, r: 0,
      // 16-bit registers
      ix: 0, iy: 0, sp: 0, pc: 0,
      // Flags (stored in F register)
      flags: {
        s: 0, // Sign flag
        z: 0, // Zero flag
        h: 0, // Half carry flag
        pv: 0, // Parity/Overflow flag
        n: 0, // Add/Subtract flag
        c: 0, // Carry flag
      },
      // Shadow flags
      flags_prime: {
        s: 0, z: 0, h: 0, pv: 0, n: 0, c: 0,
      }
    };

    // Initialize 64K memory
    this.memory = new Uint8Array(65536);
    
    // Execution state
    this.halted = false;
    this.interruptsEnabled = false;
    
    // Debug state
    this.breakpoints = new Set();
    this.isDebugging = false;
    this.stepMode = false;
  }

  // Get 16-bit register pairs
  getBC() { return (this.registers.b << 8) | this.registers.c; }
  getDE() { return (this.registers.d << 8) | this.registers.e; }
  getHL() { return (this.registers.h << 8) | this.registers.l; }
  
  // Set 16-bit register pairs
  setBC(value) {
    this.registers.b = (value >> 8) & 0xFF;
    this.registers.c = value & 0xFF;
  }
  
  setDE(value) {
    this.registers.d = (value >> 8) & 0xFF;
    this.registers.e = value & 0xFF;
  }
  
  setHL(value) {
    this.registers.h = (value >> 8) & 0xFF;
    this.registers.l = value & 0xFF;
  }

  // Get F register (flags)
  getF() {
    const { s, z, h, pv, n, c } = this.registers.flags;
    return (s << 7) | (z << 6) | (h << 4) | (pv << 2) | (n << 1) | c;
  }
  
  // Set F register (flags)
  setF(value) {
    this.registers.flags.s = (value & 0x80) >> 7;
    this.registers.flags.z = (value & 0x40) >> 6;
    this.registers.flags.h = (value & 0x10) >> 4;
    this.registers.flags.pv = (value & 0x04) >> 2;
    this.registers.flags.n = (value & 0x02) >> 1;
    this.registers.flags.c = value & 0x01;
  }
  
  // Exchange register sets
  exchangeRegisterSets() {
    // Exchange main registers with alternates
    [this.registers.a, this.registers.a_prime] = [this.registers.a_prime, this.registers.a];
    [this.registers.b, this.registers.b_prime] = [this.registers.b_prime, this.registers.b];
    [this.registers.c, this.registers.c_prime] = [this.registers.c_prime, this.registers.c];
    [this.registers.d, this.registers.d_prime] = [this.registers.d_prime, this.registers.d];
    [this.registers.e, this.registers.e_prime] = [this.registers.e_prime, this.registers.e];
    [this.registers.h, this.registers.h_prime] = [this.registers.h_prime, this.registers.h];
    [this.registers.l, this.registers.l_prime] = [this.registers.l_prime, this.registers.l];
    
    // Exchange flags
    [this.registers.flags, this.registers.flags_prime] = 
      [this.registers.flags_prime, this.registers.flags];
  }
  
  // Memory access methods
  readByte(address) {
    return this.memory[address & 0xFFFF];
  }
  
  writeByte(address, value) {
    this.memory[address & 0xFFFF] = value & 0xFF;
  }
  
  readWord(address) {
    const low = this.readByte(address);
    const high = this.readByte((address + 1) & 0xFFFF);
    return (high << 8) | low;
  }
  
  writeWord(address, value) {
    this.writeByte(address, value & 0xFF);
    this.writeByte((address + 1) & 0xFFFF, (value >> 8) & 0xFF);
  }
  
  // Stack operations
  pushStack(value) {
    this.registers.sp = (this.registers.sp - 2) & 0xFFFF;
    this.writeWord(this.registers.sp, value);
  }
  
  popStack() {
    const value = this.readWord(this.registers.sp);
    this.registers.sp = (this.registers.sp + 2) & 0xFFFF;
    return value;
  }
  
  // Reset the CPU
  reset() {
    // Clear all registers
    Object.keys(this.registers).forEach(key => {
      if (typeof this.registers[key] === 'object') {
        Object.keys(this.registers[key]).forEach(subKey => {
          this.registers[key][subKey] = 0;
        });
      } else {
        this.registers[key] = 0;
      }
    });
    
    // Reset program counter and stack pointer
    this.registers.pc = 0;
    this.registers.sp = 0xFFFF;
    
    // Reset execution state
    this.halted = false;
    this.interruptsEnabled = false;
  }
  
  // Load program into memory
  loadProgram(program, startAddress = 0) {
    for (let i = 0; i < program.length; i++) {
      this.writeByte(startAddress + i, program[i]);
    }
  }
  
  // Debug methods
  setBreakpoint(address) {
    this.breakpoints.add(address & 0xFFFF);
  }
  
  clearBreakpoint(address) {
    this.breakpoints.delete(address & 0xFFFF);
  }
  
  toggleBreakpoint(address) {
    address = address & 0xFFFF;
    if (this.breakpoints.has(address)) {
      this.breakpoints.delete(address);
      return false;
    } else {
      this.breakpoints.add(address);
      return true;
    }
  }
  
  clearAllBreakpoints() {
    this.breakpoints.clear();
  }
  
  // Execution methods
  step() {
    if (this.halted) return false;
    
    // Fetch instruction
    const opcode = this.readByte(this.registers.pc);
    this.registers.pc = (this.registers.pc + 1) & 0xFFFF;
    
    // Execute instruction (placeholder - actual implementation would be much more complex)
    // In a real implementation, this would decode and execute the Z80 instruction set
    this.executeInstruction(opcode);
    
    return true;
  }
  
  executeInstruction(opcode) {
    // This is a placeholder for the actual instruction execution
    // A full Z80 emulator would implement all opcodes here
    
    // For now, we'll just implement a few simple instructions as examples
    
    // NOP (0x00)
    if (opcode === 0x00) {
      // No operation
      return;
    }
    
    // LD A, n (0x3E)
    if (opcode === 0x3E) {
      const value = this.readByte(this.registers.pc);
      this.registers.pc = (this.registers.pc + 1) & 0xFFFF;
      this.registers.a = value;
      return;
    }
    
    // HALT (0x76)
    if (opcode === 0x76) {
      this.halted = true;
      return;
    }
    
    // In a complete implementation, all Z80 instructions would be handled here
  }
  
  run() {
    this.isDebugging = false;
    while (!this.halted) {
      if (this.breakpoints.has(this.registers.pc)) {
        this.isDebugging = true;
        break;
      }
      this.step();
    }
  }
  
  debug() {
    this.isDebugging = true;
    if (!this.halted && !this.stepMode) {
      if (this.breakpoints.has(this.registers.pc)) {
        return { stopped: true, address: this.registers.pc };
      }
      this.step();
    }
    return { stopped: this.halted, address: this.registers.pc };
  }
  
  // Get the current state of the CPU
  getState() {
    return {
      registers: { ...this.registers },
      pc: this.registers.pc,
      sp: this.registers.sp,
      flags: { ...this.registers.flags },
      halted: this.halted,
      interruptsEnabled: this.interruptsEnabled
    };
  }
  
  // Set the state of the CPU
  setState(state) {
    if (state.registers) {
      Object.keys(state.registers).forEach(key => {
        if (this.registers[key] !== undefined) {
          this.registers[key] = state.registers[key];
        }
      });
    }
    
    if (state.flags) {
      Object.keys(state.flags).forEach(key => {
        if (this.registers.flags[key] !== undefined) {
          this.registers.flags[key] = state.flags[key];
        }
      });
    }
    
    if (state.pc !== undefined) this.registers.pc = state.pc & 0xFFFF;
    if (state.sp !== undefined) this.registers.sp = state.sp & 0xFFFF;
    if (state.halted !== undefined) this.halted = state.halted;
    if (state.interruptsEnabled !== undefined) this.interruptsEnabled = state.interruptsEnabled;
  }
}

export default Z80Core;
