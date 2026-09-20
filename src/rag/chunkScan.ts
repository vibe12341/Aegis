/**
 * Batch scanning for RAG retrieval results: scan many chunks, short-circuit
 * early once enough blocks are found.
 */
import type {
  Chunk,
  ChunkScanResult,
  ScanOptions,
  ScanResult,
} from "../types.js";
import { scan } from "../core/scanner.js";

export async function scanChunks(
  chunks: Chunk[],
  options: ScanChunksOptions = {},
): Promise<ChunkScanResult[]> {
  const maxBlocks = options.maxBlocks;
  const results: ChunkScanResult[] = [];

  for (const chunk of chunks) {
    const result = await scan(chunk.text, options);
    results.push({
      id: chunk.id,
      metadata: chunk.metadata,
      result,
    });
    if (maxBlocks !== undefined && countBlocks(results) >= maxBlocks) break;
  }

  return results;
}

function countBlocks(results: ChunkScanResult[]): number {
  let n = 0;
  for (const r of results) {
    if (r.result.verdict === "block") n++;
  }
  return n;
}

export interface ScanChunksOptions extends ScanOptions {
  /** Stop scanning remaining chunks once this many blocks occur. */
  maxBlocks?: number;
}
