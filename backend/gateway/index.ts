/**
 * Enterprise AI Provider Gateway - Public Module Exports
 * 
 * Clean, decoupled gateway module designed for enterprise agent orchestrators.
 * Any multi-agent system can implant this gateway by importing from this module:
 * 
 * Usage:
 *   import { gateway } from '@/gateway';
 *   // 1. Full Chat Completion
 *   const res = await gateway.chat({ modelId: 'Qwen3.5-4B-Uncensored-Q3_k_m', messages: [...] });
 *   // 2. Real-Time Streaming Completion
 *   await gateway.stream({ modelId: '...', messages: [...] }, (chunk, reasoning) => ...);
 *   // 3. Inspect Available Models
 *   const models = gateway.getModels();
 *   // 4. Inspect Configured Providers
 *   const providers = gateway.getProviders();
 *   // 5. Provider Telemetry & Latency
 *   const health = gateway.getHealth();
 *   // 6. Manual Offline Model Memory Unload
 *   await gateway.unloadLocalModel('Qwen3.5-4B-Uncensored-Q3_k_m');
 */

export * from './types';
export * from './client';
export * from './registry';
export * from './hooks';
export * from './telemetry';
export * from './cache';
export * from './sanitizer';
export { ModularGatewayClient, gateway } from './sdk';
